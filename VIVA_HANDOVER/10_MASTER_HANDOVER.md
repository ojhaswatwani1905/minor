# 10 — MASTER HANDOVER & AI TUTORING DIRECTIVE

> **NOTICE TO CHATGPT / AI TUTOR:**  
> You are acting as a **Senior University Professor and Technical Viva Coach**. You have been provided with the complete, evidence-based technical handover files for **STSMS (Smart Tourist Safety Monitoring System)**.
>
> ### CRITICAL TEACHING DIRECTIVES:
> 1. **Teach strictly from the verified facts in this folder.** Do NOT invent features, database tables, carrier webhooks, or architectural modules that do not exist.
> 2. **Respect the project status:** When the student asks about features, remind them which features are *Implemented and verified*, *Partially implemented*, or *Planned*.
> 3. **Train the student to explain the code themselves:** Don't just give answers; prompt the student to recite the 30-second pitch, explain the Haversine formula, trace the PostGIS coordinate order, and justify design trade-offs.

---

## 1. Handover File Index & Recommended Study Order

The handover report is organized into 12 dedicated markdown documents. Follow this 5-stage mastery curriculum:

```
[STAGE 1: THE CORE PITCH (Day 1)]
  ├── 00_PROJECT_EXECUTIVE_SUMMARY.md ── Memorize problem statement & 30s viva pitch.
  └── 09_GLOSSARY_AND_REVISION_NOTES.md ── Master key metrics, formulas, and terminology.

[STAGE 2: ARCHITECTURE & CODE TRACE (Day 2)]
  ├── 01_ARCHITECTURE_AND_DATA_FLOW.md ── Understand client-server-Supabase data pipelines.
  └── 02_CODEBASE_AND_TECH_STACK.md ── Memorize file responsibilities and exact tech versions.

[STAGE 3: APIS & DATABASE DEFENCE (Day 3)]
  ├── 03_API_DOCUMENTATION.md ──────── Understand all 33 endpoints and request/response contracts.
  └── 04_DATABASE_AND_SUPABASE.md ──── Defend PostGIS, generated columns, and RLS bypass.

[STAGE 4: DEEP DIVE: SOS & SECURITY (Day 4)]
  ├── 05_SOS_AND_LIVE_MONITORING.md ── Trace the 1-Tap SOS button to the Leaflet map radar.
  └── 06_SECURITY_AND_TESTING.md ───── Explain JWT, data privacy, and live test evidence.

[STAGE 5: MOCK VIVA EXAMINATION (Day 5)]
  ├── 07_FEATURE_STATUS_AND_FUTURE_SCOPE.md ── Handle limitations and roadmap questions.
  ├── 08_VIVA_QUESTIONS_AND_ANSWERS.md ────── Rehearse all 40+ defense questions.
  └── 11_AUDIT_EVIDENCE_AND_UNKNOWNS.md ───── Review live diagnostic outputs and command proofs.
```

---

## 2. Interactive Tutoring Modes for ChatGPT

When instructing ChatGPT, use these prompt templates:

### Prompt 1: Strict External Examiner Mode (Mock Viva)
> *"ChatGPT, act as a strict external viva examiner for my college project defense. Ask me 5 difficult questions about the STSMS architecture, database schema, and SOS workflow one by one. Critique my answers using only the files in `VIVA_HANDOVER/`. If I miss a file path or mathematical detail, correct me."*

### Prompt 2: Step-by-Step Code Walkthrough Mode
> *"ChatGPT, act as my senior software architect mentor. Walk me through `05_SOS_AND_LIVE_MONITORING.md` line by line. Explain why PostGIS requires longitude before latitude, how the Haversine filter saves battery life, and how to defend error code 23505 to my professor."*

### Prompt 3: Last-Minute Rapid Fire Revision Mode
> *"ChatGPT, give me a rapid-fire quiz on `09_GLOSSARY_AND_REVISION_NOTES.md`. Ask me for ports, polling frequencies, formula definitions, and table row counts to test my memory before my viva."*

---

## 3. Key Defensive Talking Points to Remember

1. **Why not WebSockets?**  
   *“We utilized 3-second HTTP interval polling because in remote disaster command posts, internet connections frequently drop. HTTP polling is stateless, self-healing, and avoids persistent socket connection overhead.”*
2. **Why does PostGIS use `POINT(lng lat)`?**  
   *“Because GIS mathematical standards represent coordinates in Cartesian $(X, Y)$ order, where Longitude is the horizontal East-West axis ($X$) and Latitude is the vertical North-South axis ($Y$). Reversing them places the location in the Arctic Ocean instead of the Himalayas.”*
3. **How does the Dead Man's Switch protect unconscious victims?**  
   *“A background cloud daemon checks active expeditions every 15 seconds. If an arrival deadline expires without a manual check-in from the tourist, an emergency alert is automatically generated, notifying the command center even if the victim is incapacitated.”*
