# 09 — TECHNICAL GLOSSARY AND LAST-MINUTE REVISION SHEET

> **Purpose:** Quick-reference cheat sheet for the final 15 minutes before walking into your viva examination room.

---

## 1. Project At-a-Glance Fact Sheet

| Metric / Parameter | Value to Remember |
| :--- | :--- |
| **System Full Name** | Smart Tourist Safety Monitoring System (STSMS) |
| **Frontend Web Port** | Port `3009` (Vite 5.4.14 / React 18.2.0) |
| **Backend API Port** | Port `5001` (Node.js / Express 4.18.3, listening on `0.0.0.0`) |
| **Mobile Metro Port** | Port `8081` (React Native 0.88.0 / Expo SDK 58) |
| **Database Engine** | PostgreSQL with PostGIS on Supabase Cloud |
| **Live Database Stats** | `alerts`: 3 rows, `profiles`: 1 row |
| **Admin Polling Frequency** | Every 3000ms (3 seconds) via `setInterval` in `src/App.jsx` |
| **Dead Man's Switch Frequency** | Every 15 seconds via `setInterval` in `deadManSwitchService.js` |
| **Adaptive Movement Threshold** | $\ge 100\text{ meters}$ displacement OR speed $> 5\text{ km/h}$ |
| **Smartphone Battery Life** | Extended to 36+ hours via Haversine movement suppression |
| **Mobile Request Timeout** | 8000ms (8 seconds) via `AbortController` |
| **Data Privacy Auto-Purge** | Purges local mobile location logs older than 7 days |
| **Network Back-Off Rule** | 3 consecutive failed network syncs $\to$ 30-minute modem pause |
| **Community Trust Expiration** | 30 days linear decay; auto-hidden if flag count $\ge 3$ |
| **Search Grid Circle Radius** | 1800 meters (1.8 km) red dashed perimeter on LiveMap |

---

## 2. Mathematical Formulas Grounded in Code

### 1. The Haversine Formula (Displacement Calculation)
Used in `stsms-mobile/app/hooks/useLocation.js` to compute ground displacement $d$ in meters between two GPS coordinates $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$:

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c \quad (\text{where Earth radius } R = 6,371,000 \text{ m})$$

### 2. 30-Day Community Trust Decay Formula
Used in `server/controllers/hazardController.js` to dynamically adjust the reliability score of crowd-sourced hazards:

$$\text{baseDecay} = \max\left(0, 100 \times \left(1 - \frac{\text{ageInDays}}{30}\right)\right)$$
$$\text{trustScore} = \text{clamp}\left(\text{round}(\text{baseDecay} + (10 \times \text{upvotes}) - (15 \times \text{downvotes})), 0, 100\right)$$

---

## 3. Technical Glossary

- **GNSS (Global Navigation Satellite System):** The umbrella term for satellite positioning constellations, including GPS (USA), GLONASS (Russia), Galileo (Europe), and NavIC (India).
- **PostGIS:** The premier spatial database extender for PostgreSQL that adds support for geographic objects, spatial functions (`ST_X`, `ST_Y`, `ST_DWithin`), and spatial indexing.
- **WKT (Well-Known Text):** A standardized text markup language for representing vector geometry objects. In PostGIS, points are formatted as `POINT(longitude latitude)`—with longitude first.
- **GIST Index (Generalized Search Tree):** A tree-structured indexing mechanism that allows two-dimensional bounding box indexing, speeding up spatial proximity queries from $O(N)$ to $O(\log N)$.
- **Dead Man's Switch:** An automated safety mechanism that triggers an emergency response if a human operator fails to perform a routine check-in within a predefined time window.
- **Row Level Security (RLS):** A PostgreSQL security feature that restricts database read and write access on a per-row basis depending on the querying user's authentication context.
- **Service-Role Key:** A secret cryptographic key in Supabase that bypasses RLS, reserved strictly for backend server applications.
- **JWT (JSON Web Token):** A compact, URL-safe means of representing claims between two parties, digitally signed using HMAC SHA-256 with a secret key.
- **Bearer Token:** A security token passed in the HTTP `Authorization: Bearer <token>` header, granting access to anyone possessing the token.
- **Haversine Distance:** The angular distance between two points on the surface of a sphere, taking Earth's curvature into account.
- **Exponential Network Back-Off:** An algorithm that progressively increases the delay between network retry attempts during an outage to conserve device battery and avoid network congestion.
- **Reverse Geocoding:** The process of converting geographic coordinates (latitude and longitude) into human-readable addresses or city names.
