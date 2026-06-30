# CLAUDE.md — Wireless Device

> Per-repo continuity document for Claude sessions. **PCB-only** project.
> Keep this current; it is the hand-off between sessions.

## 1. Project identity
| Field | Value |
|---|---|
| Project | Wireless Device |
| Tracking code | `WDEV-1.0` |
| Official version / drawing | **1-20267772** |
| Owner | B/W Technology |
| Type | **PCB only** — no firmware/cloud deliverable in this repo |
| Boards | **Master_T** (base / **receiver**) · **R_Slave** (remote / **transmitter**) |
| MCU (both boards) | **ATmega32U4** (8-bit AVR, native USB) |
| RF link | **ASK/OOK, 433.92 MHz** · CY11 super-het **receiver** on Master_T · companion **TX module on R_Slave (TBD)** |
| Toolchain | KiCad (schematic + PCB), GitHub |

## 2. Goal
Design and release the two PCBs for a one-way wireless link in which a solar-and-battery-powered
remote node (**R_Slave**) transmits an ASK/OOK 433.92 MHz signal to a mains-powered base unit
(**Master_T**). Deliverable = a manufacturable KiCad design (schematic, layout, BOM, fab/assembly
outputs) for both boards, version 1-20267772.

## 3. Subject / scope
**In scope (this repo):**
- Schematic capture for Master_T and R_Slave (KiCad)
- PCB layout, ERC/DRC, BOM, Gerbers/drill, assembly drawings
- Power chains: Master 5 V @ 1 A rail; Slave solar → 1S Li-ion charge + protection + regulated rail
- RF front-end + antenna (433.92 MHz) for both boards
- Design review (power budget, charge-current math, RF link budget, grounding)

**Out of scope here:** firmware (OOK decode/encode), cloud, enclosure/mechanical.

## 4. System concept
```
 R_Slave (TRANSMIT, solar)                                          Master_T (RECEIVE, mains)
 [Solar]->[CN3065]->[1S 18650 +PCM]->[3V3|5V rail]->[ATmega32U4]->[433.92 ASK TX (TBD)]
        )))  433.92 MHz ASK/OOK, one-way  )))
                                            [CY11 RX]->[ATmega32U4 @5V/16MHz]->[USB to PC]
                                             (both @5V)              5VDC @ 1A in
```
Link: **R_Slave → Master_T**, one-way ASK/OOK at 433.92 MHz.

## 5. Boards

### Master_T — base / receiver (mains)
- **Power:** 5 VDC @ 1 A → 5 V rail. Add an LC filter / small LDO for a **clean RX supply** (super-het
  receivers are noise-sensitive).
- **MCU:** ATmega32U4 @ **5 V / 16 MHz** (crystal). **Native USB → PC** for data/HID/CDC (no USB-serial chip).
- **RF:** **CY11** ASK/OOK super-het **receiver**, 433.92 MHz, **VCC 4.5–5.5 V** (runs off the 5 V rail).
  Data out is CMOS/TTL → an **interrupt/ICP-capable** ATmega32U4 pin for OOK decoding.
- **Antenna:** 50 Ω, **~17 cm ¼-wave whip** at 433.92 MHz.

### R_Slave — remote / transmitter (solar)
- **Source:** single solar panel → **CN3065** solar Li-ion charger → 1S 18650 (3.0–4.2 V) **+ protection**.
- **Rail:** **decision (D3)** — 3.3 V/8 MHz (low power) vs 5 V boost/16 MHz (more TX range).
- **MCU:** ATmega32U4 (clock/voltage per rail).
- **RF:** **companion 433.92 MHz ASK/OOK transmitter (TBD)** — CY11 is receive-only, so the slave needs a
  matching TX. The chosen TX's supply voltage drives the rail decision.
- **Antenna:** 50 Ω, ~17 cm ¼-wave whip at 433.92 MHz.
- **USB:** optional, for programming/config (deployed solar node — keep it, but it isn't load-bearing).

## 6. Known / fixed constraints
- Two **separate** PCBs.
- Master = 5 VDC @ 1 A (RX). Slave = solar + 1S 18650 protected (TX).
- Link: Slave → Master, **one-way ASK/OOK 433.92 MHz**.
- MCU on both = **ATmega32U4**. Receiver = **CY11**.
- Version 1-20267772, owner B/W Technology. KiCad + GitHub.

## 7. ATmega32U4 design notes (apply to both boards)
- **Native USB** (full-speed device) — no FTDI/CH340; the USB connector wires to D+/D- directly.
- USB needs an **accurate clock → external crystal** (the internal RC isn't USB-grade). The PLL accepts
  an **8 MHz or 16 MHz** crystal (PINDIV), so USB works at either.
- **Speed vs voltage:** 16 MHz needs **≥ 4.5 V**; 8 MHz is fine down to **2.7 V**. → Master 5 V/16 MHz;
  **Slave 3.3 V/8 MHz is viable with working USB** (proven by the Pro Micro 3.3 V/8 MHz variant).
- Add **1 µF on UCAP** (on-chip 3.3 V USB-pad regulator); decouple VCC / AVCC / UVCC properly.

## 8. Open decisions
**D1 — RF link: RESOLVED → ASK/OOK 433.92 MHz.** CY11 super-het **receiver** on Master_T
(VCC 4.5–5.5 V, sensitivity ≈ −114 dBm, ≈600 m claimed range). 433.92 MHz suits Region 1 (Iraq).

> ⚠ **D1b — companion TX (NEW, OPEN): CY11 is receive-only.** R_Slave needs a matching 433.92 MHz
> ASK/OOK **transmitter**. Recommend a **CY-family 433.92 MHz TX** (same SAW vendor → guaranteed
> frequency pairing) or a known module (e.g. STX882-class). **Confirm its supply voltage + interface —
> that decides D3.**

**D2 — Slave solar charger:** **CN3065** (rec) / CN3791 for larger panels, over TP4056. Confirm panel Voc/Isc/W.

**D3 — Slave rail / clock (driven by D1b):** 3.3 V LDO + 8 MHz (low power; needs a 3.3 V-capable TX)
**vs** 5 V boost + 16 MHz (more TX output / range). **Rec: 3.3 V/8 MHz** unless range demands a 5 V transmitter.

**D4 — 18650 protection:** integrated-PCM cell vs discrete (DW01A + FS8205). Confirm; add discrete PCM if bare.

**D5 — Master rail / output: RESOLVED → single 5 V rail** (CY11 + ATmega32U4 @ 16 MHz) + **native USB to PC**
for data. Confirm: does USB also *power* the master, or is the 5 V @ 1 A a separate adapter?
(USB2 = 0.5 A; 1 A implies a dedicated adapter.)

**D6 — Antenna: RESOLVED → 433.92 MHz, ~17 cm ¼-wave whip** (or helical coil for compactness), 50 Ω,
on both boards. Respect RF keep-out.

**Naming note (confirm):** Master_T = mains base (RX), R_Slave = remote solar node (TX).

## 9. KiCad workflow & suggested repo layout
```
wireless-device/
├─ CLAUDE.md
├─ Master_T/      # KiCad project (schematic, PCB, sym/fp libs)
├─ R_Slave/       # KiCad project
├─ docs/          # block diagram, decisions log, datasheets (CY11, ATmega32U4, TX)
├─ bom/           # per-board BOM
└─ output/        # gerbers, drill, assembly, PDFs (per board)
```
- One KiCad project per board; shared symbol/footprint libs at repo root if useful.
- Commit ERC/DRC-clean snapshots; tag releases as `WDEV-1.0` (official version 1-20267772).

## 10. How Claude should work in this repo — house style
- Explain reasoning step by step; **flag every assumption explicitly**.
- Show changes as **VSCode-style diffs** with `+` / `−`.
- For each engineering fork, **surface the options and give a recommendation** — don't pick silently.
- Hardware: **verify the numbers** — voltage domains, current limits, charge-current math, analog vs
  digital grounding, RF keep-out, pin mux. Don't assume.
- Keep changes **surgical** — don't retune unrelated nets, footprints, or board settings.

## 11. Definition of done (verification = the calc / datasheet check)
**Per board, "done" means:**
- ERC + DRC clean in KiCad.
- Power math: Master 5 V rail within regulator SOA; Slave charge current within cell + IC ratings;
  Slave rail holds across 3.0–4.2 V.
- RF: CY11 supply filtered/clean; TX output + antenna matched at 433.92 MHz; **link budget sane TX↔RX**;
  ¼-wave antenna length correct.
- Decode line on an interrupt/ICP pin; USB D+/D- routed as a matched pair; UCAP cap present.
- 18650 protection thresholds verified (OVP/UVP/OCP). BOM complete (**including the companion TX part**);
  Gerbers / drill / assembly generated.

**Project release (1-20267772):** both boards pass the above, bench bring-up confirms the RF link
end-to-end, decisions log updated.

## 12. Dashboard sync
Tracked in the IoT PM dashboard as **`WDEV-1.0`** (client: B/W Technology). To wire git status into the
dashboard, run `bash setup-dashboard.sh` in this repo — it appends an `@CLAUDE-md-sync-block.md` import
here and produces `pm-sync.json` on each push for one-click Import. Set the project's repo URL to match.

---
*Status: MCU = ATmega32U4 (both boards), RF = CY11 433.92 MHz RX. Next: pick the companion TX (D1b) →
that sets the slave rail (D3); confirm master USB-vs-adapter power (D5).*
