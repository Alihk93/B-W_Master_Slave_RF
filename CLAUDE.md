# CLAUDE.md — Master_Slave_RF

> Per-repo continuity document for Claude sessions. **PCB-only** project.
> Keep this current; it is the hand-off between sessions.
> Last reconciled against the actual KiCad files + dashboard report on **2026-06-30**.

## 1. Project identity
| Field | Value |
|---|---|
| Project | **Master_Slave_RF** (repo `B-W_Master_Slave_RF`) |
| Tracking code | **`MSRF-1.0`** (per IoT PM dashboard / `pm-sync.json`) |
| Owner / client | **B-W Technology Company** |
| Design house | **IRAQ_PCB** (sheets: *Designed by ENG.Ahmid.Q · Supervised by ENG.Ali.H.K*) |
| Repo | `Alihk93/B-W_Master_Slave_RF` (GitHub) |
| Rev | **1.0** (schematic title blocks) |
| Type | **PCB only** — firmware is tracked on the dashboard but **not** delivered in this repo |
| Boards | **Master** (base / **receiver**, mains) · **Slave** (remote / **transmitter**) |
| MCU | **ATmega328P** (8-bit AVR) — *Master confirmed in schematic; Slave per dashboard* |
| RF link | **ASK/OOK, 433.92 MHz** · **CY11** super-het **receiver** on Master · companion **TX module on Slave (TBD)** |
| Toolchain | KiCad 9 (schematic + PCB), GitHub |
| Schedule | Start **30 Jun 2026** · Client delivery **21 Jul 2026** (3-week build) · Budget **IQD 325,000** |

> ⚠ **Prior versions of this file were wrong** and have been corrected. The old identity
> (*"Wireless Device", `WDEV-1.0`, drawing `1-20267772`, MCU ATmega32U4, native-USB / no
> USB-serial chip*) does **not** match the design in the repo and is not used anywhere in the
> KiCad files or the dashboard. Treat the table above as authoritative.

## 2. Goal
Design and release the PCBs for a one-way wireless link in which a remote node (**Slave**)
transmits an ASK/OOK 433.92 MHz signal to a mains-powered base unit (**Master**). The Master
decodes the OOK code and **switches a relay output** (siren / load) and reports to a host PC over
**USB (via FT232RL)**. Deliverable = a manufacturable KiCad design (schematic, layout, BOM,
fab/assembly outputs).

**Status:** only the **Master (receiver) board** currently exists in the repo
(`Hardware/B-W_Masrter/`). The **Slave (transmitter) board has not been started** here yet.

## 3. Subject / scope
**In scope (this repo):**
- Schematic capture + PCB layout for the **Master** board (KiCad 9) — *Slave board TBD*
- ERC/DRC, BOM, Gerbers/drill, assembly drawings
- Master power chain: mains → onboard **5 V SMPS module** → 5 V rail
- RF front-end + antenna (433.92 MHz)
- Relay output stage (siren / load switching)
- Design review (power budget, RF link budget, relay drive, grounding)

**Out of scope here:** firmware (OOK decode/encode — tracked on the dashboard), cloud,
enclosure/mechanical.

## 4. System concept
```
 Slave (TRANSMIT, remote)                                   Master (RECEIVE, mains)
 [power TBD]->[ATmega328P]->[433.92 ASK/OOK TX module (TBD)]
        )))  433.92 MHz ASK/OOK, one-way  )))
                        [CY11 RX]->[ATmega328P @16MHz]->{ relay out (siren/load) }
                                                       ->[FT232RL]->[USB-C to PC]
                         mains -> onboard 5V SMPS (600 mA) -> 5V rail
```
Link: **Slave → Master**, one-way ASK/OOK at 433.92 MHz.

## 5. Boards

### Master — base / receiver (mains) — `Hardware/B-W_Masrter/`  *(implemented, 2-layer)*
- **Power:** mains **L/N** → onboard **5 V SMPS module** (`Power_Supply_SMPS_5V600mA`, **5 V @ 600 mA**)
  → single 5 V rail. *(Earlier note of "5 VDC @ 1 A external adapter" was wrong.)*
- **MCU:** **ATmega328P-A** (U1) @ **16 MHz** resonator (Y1). Arduino-Nano-style net naming
  (D2–D13, A0–A5, RXD0/TXD0) — the layout derives from an Arduino-Nano dev-board template.
- **USB:** **FT232RL** (U2) USB-serial bridge → **USB-C** receptacle (J1). USB protection:
  **USBLC6-2SC6** TVS (D2), **1 A polyfuse** (F1), CC resistors 5K1 (R2/R3), `1N5817` (D1).
  *(ATmega328P has no native USB — the FT232RL is required; this replaces the old "native USB" note.)*
- **RF:** **CY11-CY** (U3) ASK/OOK super-het **receiver**, 433.92 MHz, VCC 4.5–5.5 V off the 5 V rail.
  Data out → an interrupt-capable ATmega328P pin for OOK decode.
- **Relay output:** `Relay_5V` sheet — relay **K1 (JQC-3FF-024-1Z)** driven by **BC847B (Q12)** from
  the `RLY` net, flyback diode **M7 (D16)**, base R 1K (R27), pull-down 10K (R1). COM/NC/NO brought
  out to terminals (J5 "A", J6 "B", screw terminal J7).
- **Indicators:** status LEDs RED (D3), YLW (D5), GRN (D6), BLU (D7) with 470R/1K series Rs;
  **BOOT** push switch (SW1) + 10K reset/boot pull (R9).
- **Connectors:** USB-C (J1), mains L (J3) / N (J4), A/B outputs (J5/J6), 3-pos screw terminal (J7),
  2×6 header (J8), 1×6 headers (J2/J9). 4× mounting holes (H1–H4).
- **Antenna:** 50 Ω, ~17 cm ¼-wave whip at 433.92 MHz (respect RF keep-out).

### Slave — remote / transmitter — *not yet in repo*
- **MCU:** ATmega328P (per dashboard notes).
- **RF:** companion **433.92 MHz ASK/OOK transmitter module (TBD)** — CY11 is receive-only, so the
  Slave needs a matching TX (e.g. STX882-class or a CY-family TX for guaranteed SAW pairing).
  Reminder on the dashboard: *"Order 433 MHz ASK/OOK RF modules for Master & Slave (2 Jul 26)."*
- **Power / clock:** **TBD** — no schematic exists yet. *(Earlier solar / CN3065 / 1S-18650 narrative
  is unverified — there is no evidence of it in the design files; treat as an unconfirmed idea, not a
  decision, until a Slave schematic is drawn.)*
- **Antenna:** 50 Ω, ~17 cm ¼-wave whip at 433.92 MHz.

## 6. Known / fixed constraints
- Two **separate** PCBs (only Master drawn so far).
- Master = mains → onboard 5 V/600 mA SMPS (RX + relay). Slave power = TBD (TX).
- Link: Slave → Master, **one-way ASK/OOK 433.92 MHz**.
- MCU = **ATmega328P**. Receiver = **CY11**. USB via **FT232RL**.
- Owner B-W Technology Company; design by IRAQ_PCB. KiCad 9 + GitHub. Tracking `MSRF-1.0`.

## 7. ATmega328P design notes (Master, applies to Slave too)
- **No native USB** → a **USB-serial bridge (FT232RL)** provides the PC link (data + programming).
- External **16 MHz** timing element (resonator Y1 on Master) for a stable UART/system clock.
- 16 MHz needs **≥ 4.5 V** (fine on the 5 V rail). Decouple VCC/AVCC; AREF cap present (C4 4u7/16V).
- OOK decode line should sit on an **interrupt/ICP-capable** pin; USB D+/D- routed as a matched pair.

## 8. Open decisions / items to verify  *(house style: flag & verify the numbers)*
- **D1 — RF link: RESOLVED → ASK/OOK 433.92 MHz.** CY11 super-het **receiver** on Master
  (VCC 4.5–5.5 V, sensitivity ≈ −114 dBm). Suits Region 1 (Iraq).
- **D1b — companion TX (OPEN):** CY11 is RX-only; pick the Slave's 433.92 MHz **TX module** and confirm
  its supply voltage + interface (drives the Slave rail). Recommend a CY-family TX or STX882-class.
- **D2 — Slave board (OPEN):** not yet designed. Define power source, MCU support, TX, antenna.
- **D3 — Master USB power (CONFIRM):** does USB-C also *power* the board, or is it data-only with the
  mains SMPS as the sole supply? (Both an SMPS and a USB VBUS path exist — verify there's no contention.)
- **⚠ D4 — relay coil voltage mismatch (VERIFY):** sheet is named `Relay_5V` and the coil ties to the
  **+5 V** rail, but the relay value is **`JQC-3FF-024-1Z`** — the `024` suffix is the **24 V** coil
  variant, which will **not pull in reliably from 5 V**. Confirm the correct part (likely the `-005`
  5 V coil) or the intended coil supply.
- **D5 — Antenna: RESOLVED → 433.92 MHz, ~17 cm ¼-wave whip**, 50 Ω, respect RF keep-out.

### File / naming cleanups to confirm with the designer
- Project folder is **`B-W_Masrter`** (typo for "Master").
- Master root sheet's **title block reads "R_Slave"** even though the board is the Master/receiver
  (CY11 RX, relay, mains SMPS). Likely a copy-paste leftover — relabel.
- Relay/USB sub-sheet file is **`PORG.kicad_sch`** but the sheet is named **PROG** (typo); a second
  sheet `Relay_5V.kicad_sch` holds the relay. **`PWR_IN.kicad_sch`** and **`Siren_Relay24V.kicad_sch`**
  are **empty/orphan** (not in the hierarchy) — either populate or delete.

## 9. KiCad workflow & actual repo layout
```
B-W_Master_Slave_RF/
├─ CLAUDE.md
├─ README.md
├─ Project_Report.pdf            # dashboard snapshot (MSRF-1.0)
├─ Hardware/
│  └─ B-W_Masrter/               # Master (RX) KiCad 9 project — only board so far
│     ├─ B-W_Masrter.kicad_pro / .kicad_sch / .kicad_pcb
│     ├─ PORG.kicad_sch (PROG)  ·  Relay_5V.kicad_sch
│     ├─ PWR_IN.kicad_sch · Siren_Relay24V.kicad_sch   # empty/orphan
│     └─ STEP/                   # 3D (B-W_Masrter.step, NANO_IQ.FCStd)
├─ scripts/                      # dashboard sync (sync-dashboard.mjs, install-hook.mjs)
├─ package.json · pm-sync.json · CLAUDE-md-sync-block.md · .githooks/pre-push
└─ B-W_Logo.jpeg
```
- *(Suggested when the Slave starts: add `Hardware/B-W_Slave/`; keep one KiCad project per board.)*
- Commit ERC/DRC-clean snapshots. KiCad lock/autosave/backup files are git-ignored (see `.gitignore`).

## 10. How Claude should work in this repo — house style
- Explain reasoning step by step; **flag every assumption explicitly**.
- Show changes as **VSCode-style diffs** with `+` / `−`.
- For each engineering fork, **surface the options and give a recommendation** — don't pick silently.
- Hardware: **verify the numbers** — voltage domains, current limits, relay coil drive, analog vs
  digital grounding, RF keep-out, pin mux. Don't assume.
- Keep changes **surgical** — don't retune unrelated nets, footprints, or board settings.

## 11. Definition of done (verification = the calc / datasheet check)
**Master, "done" means:**
- ERC + DRC clean in KiCad.
- Power: 5 V SMPS within its 600 mA budget across CY11 + ATmega328P + relay coil + LEDs;
  no USB-VBUS / SMPS contention.
- RF: CY11 supply filtered/clean; antenna matched at 433.92 MHz; ¼-wave length correct; link budget sane.
- Relay: coil voltage matches its supply (**resolve D4**), flyback diode present, base drive correct.
- Decode line on an interrupt/ICP pin; USB D+/D- a matched pair; FT232RL decoupled.
- BOM complete; Gerbers / drill / assembly generated.

**Slave:** schematic + layout exist and pass the same checks; TX output + antenna matched; link budget
sane TX↔RX.

**Project release (MSRF-1.0):** both boards pass the above, bench bring-up confirms the RF link
end-to-end, decisions log updated.

## 12. Dashboard sync
Tracked in the IoT PM dashboard as **`MSRF-1.0`** (client: B-W Technology Company). The repo ships the
sync tooling: running **`npm run sync`** (or any `git push`, via `.githooks/pre-push`) executes
`scripts/sync-dashboard.mjs`, which writes **`pm-sync.json`** (git fields: repo, last commit, etc.) for
one-click **Dashboard → Import**. See `CLAUDE-md-sync-block.md` for the rule. After meaningful work,
run the sync and commit `pm-sync.json`.

---
*Status (2026-06-30): Master (RX) board drawn — ATmega328P + CY11 RX + FT232RL/USB-C + 5 V SMPS + relay
out. Open: pick Slave TX module (D1b) → start Slave board (D2); confirm Master USB-vs-SMPS power (D3);
**resolve relay coil-voltage mismatch (D4)**; fix naming/orphan-sheet cleanups (§8).*
