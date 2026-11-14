### 1. LEVEL SELECTION AND CONTRACTS (With Budget and Success Guidelines)
The game must start with a level selector containing 5 levels. Each level has a statement, a maximum budget, and multiple valid paths (there is no single correct combination, but it must meet logical requirements).

- **Level 1: "First Space Data"**
  - **Statement:** A university wants to obtain its first atmospheric radiation and space weather measurements from space with a very tight budget.
  - **Maximum Budget:** $35M
  - **Valid Payloads:** Scientific CubeSat.
  - **Valid Orbits:** Low Earth Orbit (LEO) (300 - 600 km).
  - **Valid Rockets:** Rocket Lab Electron (due to budget).

- **Level 2: "Continuous Environmental Surveillance"**
  - **Statement:** We need to monitor the advance of forest wildfires and the state of glaciers. The area is often cloud-covered, and we need frequent overhead passes.
  - **Maximum Budget:** $85M
  - **Valid Payloads:** Earth Observation Pack or All-Weather SAR Radar Pack.
  - **Valid Orbits:** Polar LEO / Sun-Synchronous Orbit (SSO) or Inclined LEO.
  - **Valid Rockets:** Soyuz-2.1a or Falcon 9 (tightly budgeting).

- **Level 3: "Connecting the Continent"**
  - **Statement:** A telecom operator wants to provide high-speed internet coverage across an entire continent with zero signal interruptions.
  - **Maximum Budget:** $190M
  - **Valid Payloads:** Telecommunications Satellite.
  - **Valid Orbits:** Geostationary Orbit (GEO) or High Elliptical Orbit (HEO / Molniya).
  - **Valid Rockets:** Ariane 6 (A62) or Falcon 9.

- **Level 4: "Human Horizon"**
  - **Statement:** We want to prove our agency can send astronauts into space, keep them operating for several days, and bring them back safely.
  - **Maximum Budget:** $300M
  - **Valid Payloads:** Suborbital Capsule, Classic Orbital Capsule (3 crew), or Modern Commercial Capsule (4 crew). (Note: Requires integrated life support).
  - **Valid Orbits:** LEO (Avoid high orbits/MEO to prevent radiation failure unless using the shielded capsule).
  - **Valid Rockets:** Soyuz-2.1a or Falcon 9.

- **Level 5: "Orbital Outpost"**
  - **Statement:** The agency seeks to establish a permanent presence in space where a crew can live and perform long-term microgravity experiments.
  - **Maximum Budget:** $520M
  - **Valid Payloads:** Combination of Core Module + Laboratory or Habitat + Manned Capsule.
  - **Valid Orbits:** Stable LEO (350 - 500 km).
  - **Valid Rockets:** Ariane 5, Ariane 6, Falcon 9, or Starship.

---

### 2. UNIFIED PAYLOAD TABLE (TAB 1)
The user can select **multiple items at the same time** (modular mode), summing up their masses and costs, as long as it doesn't break level logic.

| Element / System | Mass (kg) | Cost (USD) | Type / Category |
| :--- | :--- | :--- | :--- |
| **Scientific Micro-Satellite (CubeSat)** | 130 kg | $18M | Science / Atmosphere |
| **Earth Observation Pack (Optical)** | 450 kg | $27M | Observation |
| **All-Weather Radar Pack (SAR)** | 400 kg | $40M | Observation |
| **Telecommunications Satellite** | 1,800 kg | $75M | Telecommunications |
| **Orbital Observatory (Telescope)** | 1,500 kg | $150M | Advanced Science |
| **Suborbital / Test Capsule (1 Astronaut)** | 1,400 kg | $65M | Manned (Basic) |
| **Classic Orbital Capsule (3 Astronauts)** | 7,200 kg | $130M | Manned (Standard) |
| **Modern Commercial Capsule (4 Astronauts)** | 12,500 kg | $220M | Manned (Advanced) |
| **Heavy Shielded Capsule (4 Astronauts)** | 21,000 kg | $350M | Manned / High Orbit |
| **Docking & Power Module (Core)** | 4,200 kg | $80M | Space Station |
| **Scientific Laboratory Module** | 8,500 kg | $160M | Space Station |
| **Habitat / Dormitories Module** | 10,000 kg | $190M | Space Station |

---

### 3. ORBIT TABLE AND $\Delta v$ CALCULATION (TAB 2)
The user selects an orbit type with a single click. **Internally** (not directly exposed to the user as a complex formula, but conceptually explained), the orbit determines the **Required $\Delta v$**.

| Orbit Type | Altitude / Characteristics | Required $\Delta v$ (Approx.) | Risks / Notes |
| :--- | :--- | :--- | :--- |
| **Low LEO (Low Earth Orbit)** | 300 - 500 km | 9,300 m/s | Standard orbit, easy access, no severe radiation. |
| **Polar LEO / Sun-Synchronous (SSO)** | 600 - 800 km (Inclined 98°) | 9,800 m/s | Passes over poles, ideal for global observation. |
| **Medium Earth Orbit (MEO)** | 20,000 km | 11,200 m/s | Crosses Van Allen radiation belts (lethal for unshielded crews). |
| **Geostationary Orbit (GEO)** | 35,786 km (Fixed over equator) | 12,000 m/s | Continuous 24h fixed coverage, requires high energy and performance. |
| **High Elliptical Orbit (HEO / Molniya)** | High apogee / Low perigee | 11,500 m/s | Ideal for high latitudes, requires advanced thermal control. |

---

### 4. LAUNCHER / ROCKET TABLE (TAB 3)
The user chooses the rocket. Its specs define the rocket cost and max payload capacity.

| Rocket | Cost per Launch | Rocket Dry Mass | Max Propellant Mass | Mid Specific Impulse ($I_{sp}$) | Max LEO Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rocket Lab Electron** | $8.5M | ~1,200 kg | ~11,300 kg | 320 s | 300 kg |
| **Soyuz-2.1a** | $50M | ~22,000 kg | ~285,000 kg | 315 s | 7,500 kg |
| **Falcon 9 Block 5** | $70M | ~26,200 kg | ~518,400 kg | 311 s | 22,800 kg |
| **Ariane 6 (A62)** | $85M | ~41,000 kg | ~455,000 kg | 350 s | 10,350 kg |
| **SpaceX Starship** | $100M | ~375,000 kg | ~4,900,000 kg | 360 s | 150,000 kg |
| **Ariane 5 (ECA)** | $180M | ~45,000 kg | ~700,000 kg | 370 s | 20,000 kg |
| **Saturn V** | $1,200M | ~130,000 kg | ~2,840,000 kg | 380 s | 140,000 kg |
| **Space Shuttle (STS)** | $1,500M | ~278,000 kg | ~1,760,000 kg | 410 s | 24,400 kg |

#### 📐 Physics Engine (Tsiolkovsky Rocket Equation):
To calculate if the rocket reaches orbit, use the equation:
$$\Delta v_{\text{generated}} = I_{sp} \cdot 9.81 \cdot \ln\left(\frac{m_{\text{payload}} + m_{\text{structure}} + m_{\text{max\_propellant}}}{m_{\text{payload}} + m_{\text{structure}}}\right)$$
- **Simulation Rule:** If $\Delta v_{\text{generated}} < \text{Required }\Delta v$ of the chosen orbit, **do not block the user** in the tabs. Allow them to proceed to simulation and experience the failure there (the rocket runs out of fuel and re-enters or fails to reach orbit).
- **Strict Economic Rule:** If `Payload Cost + Rocket Cost > Level Max Budget`, **show an immediate visual alert** in the UI and warn the user before allowing them to move forward.
- **Free Navigation:** The user can move freely between the 4 tabs (1. Payload, 2. Orbit, 3. Rocket, 4. Summary) to adjust choices at any time.

---

### 5. SMART ERROR AND HINT SYSTEM (Per Level)
After simulation (or when clicking "Launch" on the Summary Tab 4), if the mission fails, the system must analyze the failure and display a **specific hint** tailored to the error:

1. **Budget Exceeded Error:**
   - *Hint:* "You've exceeded the agency's budget! Review the rocket cost or lighten the payload by choosing more economical components."
2. **Payload Overweight Error (Exceeds rocket capacity):**
   - *Hint:* "The chosen rocket lacks enough max payload capacity to lift all the weight you put in the bay. You need a heavier rocket or fewer instruments."
3. **$\Delta v$ Shortage Error (Rocket fails to reach orbit):**
   - *Hint:* "The engine ran out of fuel before reaching the required orbital velocity. Try a lower orbit or a rocket with higher specific impulse ($I_{sp}$) or more fuel."
4. **Radiation Error (Crew in MEO/HEO without shielding):**
   - *Hint:* "Medical alert! You sent a standard capsule to a medium orbit passing through the Van Allen radiation belts without proper shielding. Use the shielded capsule or keep the mission in LEO."
5. **Unfulfilled Mission Objective Error:**
   - *Hint:* "The mission flew successfully, but you didn't install the correct hardware for the contract objective (e.g., missing scientific instruments or manned modules)."
