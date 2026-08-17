# APEX v2.5 🏎️
### Analytical & Curriculum-Driven Simracing Coach & Live Telemetry Suite

> Built upon the legendary motorsport engineering principles of **Skip Barber’s *"Going Faster!"*** (by Carl Lopez) and powered by real-time, high-precision 60Hz UDP telemetry from **Forza Motorsport** and **Forza Horizon**.

---

## 🏁 Overview

**APEX v2.5** is a comprehensive racing engineering and coaching platform designed to elevate simracers from casual driving to professional motorsport technique. Combining an interactive **14-Module Curriculum Academy**, **60Hz Live Telemetry Ingest & Visualizer**, **Deep Dive Debrief Studio**, and **Automated Stint Telemetry Archiving**, APEX transforms raw vehicle physics into actionable driving insights.

---

## ✨ Key Features

### 🎓 1. Skip Barber Curriculum Academy
14 deeply engineered modules covering the entire Skip Barber Racing School curriculum:
* **Mod 01: The Racing Line & Types of Corners** — Geometric vs. Late apexes, exit-speed priority, and sacrifice turns.
* **Mod 02: The Friction Circle & Traction Budget** — Vector grip limits ($G_{\text{total}} = \sqrt{G_{\text{lat}}^2 + G_{\text{lon}}^2}$), tire slip angles, and grip utilization.
* **Mod 03: Threshold & Trail Braking** — Peak pressure rise-rate, transition into corner entry, and progressive pedal bleed-off.
* **Mod 04: Corner Phasing & Turn-In Dynamics** — Entry, clipping, and track-out phases with yaw rate stabilization.
* **Mod 05: Throttle Application & Exit Speed** — Unwinding steering angle before full throttle commitment.
* **Mod 06: Car Balance, Pitch & Weight Transfer** — Load management, longitudinal pitch under braking, and lateral roll.
* **Mod 07: Decreasing vs. Increasing Radius Corners** — Multi-apex strategy and late rotation techniques.
* **Mod 08: S-Bends, Chicanes & Linked Complexes** — Momentum preservation, curb hopping, and transition timing.
* **Mod 09: The Oversteer Continuum & Slip Angle** — Managing yaw acceleration, countersteering speed, and throttle modulation.
* **Mod 10: Understeer Mitigation & Scrub Angle** — Diagnosing front-end push, steering scrub, and trail-brake loading.
* **Mod 11: High-Speed Aero & Downforce Balance** — Speed-squared aerodynamic grip and platform stability.
* **Mod 12: Wet Weather Lines & Low-G Grip Management** — Off-line rubber avoidance, rim-shots, and hydroplane avoidance.
* **Mod 13: Racecraft: Overtaking, Defense & Traffic** — Positioning on the brakes, crossover maneuvers, and drafting.
* **Mod 14: Mental Focus, Consistency & Stint Pacing** — Rhythm, target lap delta variance, and tire life preservation.

* **Interactive Theory & Mental Models**: Rich visualizations, textbook quotes, and tactical drill guides.
* **Hands-on Session Challenges**: Live interactive telemetry targets with real-time scoring.
* **Module Graduation Exams**: Comprehensive tests verifying theoretical understanding and telemetry execution.

---

### 📡 2. Real-Time 60Hz Telemetry Ingest & Live Practice
* **High-Speed UDP Bridge**: Node.js UDP ingestion bridge capturing 60Hz packets on port `5300` and streaming them over WebSockets (port `5301`) to the browser.
* **Live Telemetry Simulator**: Built-in simulator allowing full training and testing without launching the game.
* **Real-Time Visualizations**:
  * **Dynamic G-G Friction Circle**: Real-time tire traction budget utilization ($G_{\text{lat}}$ vs. $G_{\text{lon}}$).
  * **Pedal Traces & Steering Inputs**: Synchronized throttle, brake, clutch, handbrake, and steering angles.
  * **4-Corner Suspension & Tire Metrics**: Suspension travel, tire load, tire surface temperatures, slip ratios, and slip angles.
  * **Live Audio & Visual Coaching Cues**: Instant feedback for over-braking, abrupt steering turn-in, and delayed throttle application.

---

### 📊 3. Telemetry & Debrief Studio
* **Multi-Channel Synchronized Waveforms**: Speed (kph/mph), RPM, Gear, Throttle, Brake, Steering, and G-Forces plotted across exact track distance.
* **Corner-by-Corner Breakdown**: Automated segmentation of track turns with entry speed, minimum apex speed, exit speed, and trail-braking duration.
* **Braking Diagnostic Engine**: Brake rise time, peak pressure G-force, and trail-braking decay rate analysis.
* **Setup & Handling Advisor**: Integrated diagnostic tool advising on sway bar (anti-roll bar), damper, spring, brake bias, tire pressure, and aerodynamic adjustments based on corner behavior.
* **Stint Management & Lap Overlay**: Multi-lap ghost comparison to identify tenths gained or lost per sector.

---

### 🗂️ 4. Driver History, Archiving & Reporting
* **Persistent Lap Database**: Automatic local storage indexing of completed laps, best sector splits, and challenge completions.
* **Pro Telemetry PDF Export**: One-click generation of professional motorsport engineering debrief sheets with lap summaries, corner breakdowns, and coaching recommendations.

---

### 🏎️ 5. Built-in FM23 Car & Track Database
* **Extensive Car Roster**: Indexed specs for Mazda (Formula Mazda, MX-5 Cup, 787B), Porsche (911 GT3 RS, 911 RSR, 919 Hybrid), Honda/Acura (Civic Type R, NSX GT3), BMW, Ferrari, McLaren, and more.
* **Global Track Layouts**: Spa-Francorchamps, Circuit de Barcelona-Catalunya, Silverstone, Nürburgring Nordschleife, Laguna Seca, Watkins Glen, Road America, Suzuka, and more.

---

## 🛠️ Architecture & Tech Stack

```
[Forza Motorsport / Horizon] 
        │ (UDP Port 5300 / CarDash binary packet @ 60Hz)
        ▼
[Node.js UDP Ingest Bridge (server/udpServer.js)]
        │ (WebSocket Binary Stream ws://localhost:5301)
        ▼
[React 19 + TypeScript Frontend Engine]
   ├── forzaParser.ts (Binary SLED/CarDash decoding)
   ├── physicsEngine.ts (Friction circle, corner segmentation, scoring)
   ├── Skip Barber Curriculum Engine
   └── Canvas / SVG Telemetry Visualizers
```

* **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
* **Telemetry Server**: Node.js UDP Datagram (`dgram`), WebSocket Server (`ws`).
* **Reporting & Export**: jsPDF, html2canvas.

---

## 🚀 Quick Start Guide

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/mindcoder9033/APEX-v2.5.git
cd "APEX v2.5"

# Install dependencies
npm install
```

### 2. Running the Development Environment

Launch both the Vite UI dev server and the UDP Telemetry Bridge:

```bash
# Terminal 1: Launch Web Application
npm run dev

# Terminal 2: Launch Live UDP Telemetry Bridge
npm run udp-server
```

Open your browser at **`http://localhost:5173`**.

---

## 🎮 Forza In-Game Telemetry Configuration

To transmit real-time telemetry from **Forza Motorsport (2023)** or **Forza Horizon 4 / 5** to APEX:

1. Launch Forza and open **Settings** > **HUD and Gameplay** (or **Telemetry**).
2. Scroll to the bottom and configure the following:
   * **Data Out**: `ON`
   * **Data Out IP Address**:
     * If playing on the **same PC**: `127.0.0.1` or `localhost`
     * If playing on **Xbox** or another PC on the local network: Your PC's local IP (e.g. `192.168.1.X`) or subnet broadcast `192.168.1.255`
   * **Data Out IP Port**: `5300`
   * **Data Out Packet Format**: `CarDash` (or `SLED`)
3. Return to track. APEX will automatically detect incoming packets and transition to **Forza 60Hz Live** mode!

---

## 📐 Telemetry Physics & Coaching Formulas

* **Traction Budget Utilization**:
  $$\text{Traction Budget} = \frac{\sqrt{G_{\text{lat}}^2 + G_{\text{lon}}^2}}{G_{\text{peak\_grip}}} \times 100\%$$
* **Trail Braking Decay Efficiency**: Measures linear decay from threshold pressure to steering apex without abrupt tire unloading.
* **Exit Prioritization Index**: Computes throttle timing relative to apex clipping and steering unwind angle.

---

## 📜 Credits & Acknowledgments

* **Skip Barber Racing School** & Carl Lopez for the seminal motorsport racing theory and textbook *"Going Faster! Mastering the Art of Race Driving"*.
* **Turn 10 Studios & Playground Games** for supporting high-frequency UDP telemetry output in the Forza franchise.

---

## 📄 License

This project is licensed under the MIT License.
