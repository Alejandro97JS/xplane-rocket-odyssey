### PHASE 2: DYNAMIC ORBITAL PILOTING SIMULATION
Once the design succeeds, the game transitions to **Phase 2**, turning into a real-time interactive flight simulator where precision and fuel management matter. **Crucial Rule:** The remaining fuel margin in Phase 2 must be tightly balanced (strict margins, e.g., only 10-15% buffer above minimum required $\Delta v$), meaning precise piloting is mandatory.

#### Level 1 (Phase 2): "Hohmann Transfer in Earth Orbit"
- **Objective:** Transfer from a circular initial LEO to a higher/lower target circular orbit.
- **Mechanics:**
  - **Attitude Control (Yaw/Rotation):** The user can rotate the spacecraft using keys/buttons. A visual thrust vector arrow indicates the direction. 
    - *The 90-Degree Trap:* If the user points the ship at 90° (perpendicular) instead of 0° (parallel to motion) and fires, energy is wasted, failing to reach the orbit and draining the tight fuel supply.
  - **Interactive BURN Button:** Holding down the button consumes propellant in real-time from a visible fuel bar and scales a **semi-transparent Ghost Orbit (Ellipse)** dynamically on screen.
  - **Success Condition:** Release the button when the ghost orbit matches the target circular orbit ($\pm 5\%$ tolerance) and circularize.
  - **Failure Conditions & Smart Hints:**
    - *Out of Fuel:* "You ran out of fuel! Align your spacecraft parallel to your velocity vector (0°) before firing to maximize transfer efficiency."
    - *Escape Trajectory (Parabolic/Hyperbolic):* "Too much throttle! You exceeded Earth's escape velocity. Release the BURN button before breaking closed-orbit bounds."

#### Level 2 (Phase 2): "Lunar Orbit Insertion (TLI + LOI)"
- **Objective:** Launch from LEO, intercept the Moon, and brake into a stable circular lunar orbit.
- **Mechanics:**
  - **Launch Window Traffic Light (🔴/🟡/🟢):** A visual indicator on screen showing when orbital alignment is correct. The player must wait for the **Green Light** to avoid blind calculations.
  - **Phase 1 - Trans-Lunar Injection (TLI):** When the light is green and attitude is at 0°, hold **BURN** to stretch the ghost orbit out toward the Moon's orbital path. Fuel margins here are razor-thin.
  - **Phase 2 - Lunar Orbit Insertion (LOI):** Upon reaching the Moon's proximity, the view zooms/shifts to the lunar frame. The player must rotate the craft 180° (retrograde) and execute a precise braking burn (*Retro-burn*) using the remaining fuel to capture into a circular lunar orbit.
  - **Failure Conditions & Smart Hints:**
    - *Missed Interception:* "You missed the Moon! Watch the launch window traffic light carefully to time your burn with the Moon's position."
    - *Failed Capture (No Braking):* "You forgot to brake at the Moon! Without a retrograde burn upon arrival, lunar gravity slingshotted you away into deep space."
