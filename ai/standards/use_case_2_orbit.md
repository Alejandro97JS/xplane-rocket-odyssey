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

**CRITICAL REQUIREMENT ON PHYSICS ENGINE:** Do NOT fake orbital mechanics with canned animations or simple geometric scaling. You MUST implement a real-time **2-Body Keplerian Orbital Mechanics & Vectorial Impulse Physics Engine** in code using standard aerospace equations (Vis-Viva equation, specific orbital energy, eccentricity vector, and semi-major axis derivations). Both the spacecraft's live trajectory and the predictive "Ghost Orbit" must be dynamically computed from the spacecraft's instantaneous position vector $\vec{r}$ and velocity vector $\vec{v}$.

### MATHEMATICAL & ORBITAL PHYSICS ENGINE (PHASE 2 CORE)
You must program a dedicated physics module that updates state vectors $(\vec{r}, \vec{v})$ at every simulation tick $\Delta t$ and derives orbital conic sections analytically:

1. **Gravitational Acceleration & Numerical Integration:**
   - Use Velocity Verlet or 4th-Order Runge-Kutta (RK4) integration for stable orbits:
     $$\vec{a}_{\text{grav}} = -\frac{\mu}{\Vert{}\vec{r}\Vert{}^3} \vec{r}$$
     where $\mu = G \cdot M$ is the standard gravitational parameter of the central body (Earth or Moon, scaled cleanly to screen pixels while maintaining exact dimensionless ratios).

2. **Vectorial Thrust & Attitude Control:**
   - The spacecraft has an orientation angle $\theta_{\text{ship}}$ controlled by the player, and an instantaneous velocity heading $\theta_{\text{vel}} = \text{atan2}(v_y, v_x)$.
   - When the player holds the **BURN** button, thrust acceleration $\vec{a}_{\text{thrust}}$ is applied strictly along the ship's nose vector $\hat{u} = (\cos\theta_{\text{ship}}, \sin\theta_{\text{ship}})$:
     $$\Delta \vec{v} = a_{\text{thrust}} \cdot \Delta t \cdot \hat{u}$$
   - **Why the 90° trap naturally emerges from the math:** If $\theta_{\text{ship}} = \theta_{\text{vel}} + 90^\circ$, $\Delta \vec{v} \perp \vec{v}$. By the Vis-Viva equation, adding velocity perpendicular to $\vec{v}$ rotates the apsidal line and increases eccentricity $e$ without efficiently raising the semi-major axis $a$, burning through the tight fuel reserve without reaching the target altitude.

3. **Real-Time Conic Section Solver (For Live & Ghost Orbits):**
   - At every frame (and dynamically projected ahead while holding BURN to draw the semi-transparent **Ghost Orbit**), compute the classical orbital elements from $(\vec{r}, \vec{v})$:
     - **Specific Orbital Energy ($\mathcal{E}$):**
       $$\mathcal{E} = \frac{v^2}{2} - \frac{\mu}{r}$$
     - **Semi-Major Axis ($a$):**
       $$a = -\frac{\mu}{2\mathcal{E}}$$
     - **Eccentricity Vector ($\vec{e}$) and Scalar Eccentricity ($e$):**
       $$\vec{e} = \frac{1}{\mu}\left[\left(v^2 - \frac{\mu}{r}\right)\vec{r} - (\vec{r} \cdot \vec{v})\vec{v}\right], \quad e = \Vert{}\vec{e}\Vert{}$$
     - **Apoapsis ($r_a$) and Periapsis ($r_p$):**
       $$r_a = a(1 + e), \quad r_p = a(1 - e)$$
     - **Argument of Periapsis ($\omega$):**
       $$\omega = \text{atan2}(e_y, e_x)$$
   - **Rendering the Ghost Orbit:** Use $(a, e, \omega)$ to draw the exact Keplerian ellipse (or hyperbola if $e \ge 1$) in real time as the player holds BURN.
   - **Escape Velocity Detection:** If $\mathcal{E} \ge 0$ (i.e., $e \ge 1.0$, meaning $v \ge v_{\text{escape}} = \sqrt{\frac{2\mu}{r}}$), the ellipse opens into a parabola/hyperbola—
