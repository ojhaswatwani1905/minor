# Design System & UI Specifications

### 1. Color Palette Tokens

| Token Name | Hex Value | Usage |
| :--- | :--- | :--- |
| **Background Primary** | `#000000` | True-Black background for maximum OLED battery saving. |
| **Card Surface** | `#121212` | Container panels, bottom sheet cards, borders. |
| **Primary Accent** | `#3182CE` | Navigation highlights, active tabs, buttons. |
| **Danger / SOS** | `#E53E3E` | High-priority warnings, SOS button, hazard badges. |
| **Caution** | `#DD6B20` | Moderate hazards (poor lighting, stray animals). |
| **Success / Safe** | `#38A169` | Safe Check-In trigger, verified dhaba recommendations. |

### 2. UI Component Wireframe

#### Active Safety Dashboard Screen
```
+-------------------------------------------------------------+
|  STATUS: MONITORING ACTIVE                    [ 🔋 88% ]    |
+-------------------------------------------------------------+
|                                                             |
|                   DEAD MAN'S SWITCH TIMER                   |
|                            02 : 15 : 00                     |
|                  Auto-SOS at 06:00 PM (Cloud)               |
|                                                             |
|   [ 🛡️ SAFE CHECK-IN / EXTEND ]     [ ➕ WRITE REVIEW ]      |
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|           [ 🚨 EMERGENCY SOS - SLIDE TO TRIGGER ]           |
|            (Fallback: Direct SMS if offline)                |
+-------------------------------------------------------------+
```
