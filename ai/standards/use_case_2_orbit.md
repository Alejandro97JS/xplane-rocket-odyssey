### 1. PHYSICS ENGINE & CORE MATHEMATICS (SI UNITS & FIXED TIMESTEP)
- **SI Units Internally:** All calculations (position, velocity, mass, acceleration) must use SI base units. Pixel scaling is applied exclusively at the HTML5 Canvas rendering layer.
- **Fixed Timestep Integration:** Use a deterministic fixed timestep (`dt = 1/60s`, Velocity Verlet or RK4) in `game-core`:
  $$\vec{a}_{\text{grav}} = -\frac{\mu}{\|\vec{r}\|^3} \vec{r}$$
  where $\mu_{\text{Earth}} = 3.986 \times 10^{14} \text{ m}^3/\text{s}^2$ and $\mu_{\text{Moon}} = 4.904 \times 10^{12} \text{ m}^3/\text{s}^2$.
- **Patched Conics (Level 2):** Seamlessly transition coordinate systems and central body $\mu$ when the spacecraft crosses the Moon's Sphere of Influence (SOI) boundary at $r_{\text{SOI}} \approx 66,100 \text{ km}$ from Earth.
- **Attitude Control & Vectorial Thrust:** 
  - Rotation speed capped at $45^\circ/\text{s}$ via keyboard (`A`/`D` or `Left`/`Right` arrows).
  - Thrust application: $\Delta \vec{v} = \frac{F_{\text{thrust}}}{m(t)} \cdot \Delta t \cdot \hat{u}$, where $\hat{u}$ is the ship's nose vector.
  - *The 90° Vectorial Trap:* Thrusting perpendicular ($\pm 90^\circ$) to velocity vector $\vec{v}$ alters eccentricity without efficiently raising semi-major axis $a$, draining propellant without achieving transfer.
- **Strict Propellant Model:** Mass decreases linearly with burn time ($\dot{m} = \frac{F_{\text{thrust}}}{I_{sp} \cdot g_0}$). Initial propellant in Phase 2 levels is calibrated to provide a tight **12% to 15% extra $\Delta v$ margin** above theoretical minimums.

---

### 2. PILOTING LEVELS SPECIFICATION

#### Level 1: "Hohmann Transfer in Earth Orbit"
- **Initial Orbit:** Circular LEO at $h_1 = 400 \text{ km}$ ($r_1 = 6,778 \text{ km}$).
- **Target Orbit:** Circular higher orbit at $h_2 = 1,000 \text{ km}$ ($r_2 = 7,378 \text{ km}$).
- **Mechanics:**
  - Hold `Space` to **BURN** (updates $\vec{v}$ and renders a real-time semi-transparent **Ghost Orbit Ellipse**).
  - Time warp available (`1x`, `10x`, `100x`) during coasting phases.
- **Success Condition:** Final circularized orbit satisfies $|r_a - r_2| / r_2 \le 0.05$ and $|r_p - r_2| / r_2 \le 0.05$ ($\pm 5\%$ tolerance).
- **Failure States & Educational Hints:**
  - *Out of Fuel ($m_{\text{fuel}} \le 0$):* "Propellant exhausted! Align strictly with your velocity vector ($0^\circ$ prograde) before burning to maximize efficiency."
  - *Escape Trajectory ($e \ge 1.0$):* "Escape velocity exceeded ($\mathcal{E} \ge 0$)! Your closed ellipse broke into a hyperbolic escape trajectory. Release BURN earlier."

#### Level 2: "Lunar Orbit Insertion (TLI + LOI)"
- **Stage 1 - Trans-Lunar Injection (TLI):**
  - **Launch Window Traffic Light:** Computes phase angle error $\Delta \phi$ relative to ideal Hohmann phase angle $\phi_{\text{ideal}}$:
    - 🔴 **Red** ($\Delta \phi > 15^\circ$): Do not burn.
    - 🟡 **Yellow** ($5^\circ \le \Delta \phi \le 15^\circ$): Prepare attitude (`0°` prograde).
    - 🟢 **Green** ($\Delta \phi < 5^\circ$): Optimal launch window open.
  - Hold `Space` at Green light to stretch ghost orbit apoapsis to the Moon's orbital radius ($r_{\text{Moon}} \approx 384,400 \text{ km}$).
- **Cislunar Coast:** Time warp up to `1000x` with an automatic safety drop to `1x` upon entering Lunar SOI.
- **Stage 2 - Lunar Orbit Insertion (LOI):**
  - Upon crossing into Lunar SOI, rotate spacecraft $180^\circ$ (retrograde relative to $\vec{v}_{\text{rel}}$).
  - Execute a retrograde braking burn near lunar periapsis ($h_{\text{lunar}} = 100 \text{ km}$) to reduce specific orbital energy $\mathcal{E}_{\text{Moon}} < 0$ and circularize ($e_{\text{Moon}} < 0.08$).
- **Failure States & Educational Hints:**
  - *Missed Interception:* "Missed lunar intercept! Wait for the Launch Window Traffic Light to turn Green."
  - *Lunar Impact:* "Trajectory intersection below lunar surface! Periapsis radius was inside the Moon ($r_{\text{peri}} < 1,737 \text{ km}$). Adjust burn duration."
  - *Over-Braking / Crash:* "Excessive retrograde burn! You inverted your orbit into a lunar impact trajectory."
  - *Mid-Course Fuel Exhaustion:* "Propellant depleted during cislunar coast! You are drifting uncontrolled in deep space."
