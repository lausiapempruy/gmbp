# 🔮 Government Mountain › Ball Big Project

> *The most ambitious engineering project in human history.*  
> Dismantle **Mount Rainier, Washington** — 3.9 billion tons of rock — and forge it into a perfect glass ball worth over $1 trillion.

---

## 🎮 Gameplay

You are the **Director** of a classified US government operation. Starting with just **$250**, you must:

1. Buy equipment in the **Workshop** (Excavator → Bulldozer → Drill Rig → Laser Cutter → Nano Processor → AI Drone)
2. Mine rock automatically over time and sell it in the **Market**
3. Survive **monthly taxes** — the more equipment you own, the higher the tax
4. Unlock upgrades, research boosts, and watch the 3D mountain slowly transform into a floating glass ball
5. Reach **100% completion** to complete the project

### ⏱ Time System
| Real Time | In-Game Time |
|-----------|-------------|
| 10 seconds | 1 day |
| 5 minutes | 1 month |
| 1 hour | 12 months |

### 💰 Economy
- Mined rock sells for ~$0.0012/ton (fluctuates daily)
- Monthly tax = 2% of equipment value + 5% of cash on hand
- Upgrades reduce tax or boost output permanently

### 🗺 Pages
| Page | Description |
|------|-------------|
| `index.html` | Main dashboard with live **Three.js 3D scene** (drag to orbit, scroll to zoom) |
| `workshop.html` | Buy and manage all equipment |
| `market.html` | Sell rock, view live price chart, buy research upgrades |
| `report.html` | Stats, achievements, tax history, reset |

---

## 🚀 Host on GitHub Pages

### Step 1 — Create Repository
1. Go to [github.com](https://github.com) → **New repository**
2. Name it: `gmbp` (or anything you want)
3. Set visibility: **Public**
4. ✅ Do NOT initialize with README (you already have files)
5. Click **Create repository**

### Step 2 — Upload Files
**Option A — GitHub Web UI (easiest):**
1. Open your new repo
2. Click **"uploading an existing file"** or drag & drop
3. Upload all 6 files at once:
   - `index.html`
   - `market.html`
   - `workshop.html`
   - `report.html`
   - `style.css`
   - `game.js`
   - `README.md`
4. Scroll down → **Commit changes**

**Option B — Git CLI:**
```bash
git init
git add .
git commit -m "Initial commit: GMBP v1.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gmbp.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. Go to repo → **Settings** → **Pages** (left sidebar)
2. Under **Source**: select `Deploy from a branch`
3. Branch: `main`, folder: `/ (root)`
4. Click **Save**
5. Wait ~1-2 minutes, then your site is live at:

```
https://YOUR_USERNAME.github.io/gmbp/
```

---

## 📁 File Structure
```
gmbp/
├── index.html       ← Dashboard + 3D Scene (Three.js)
├── market.html      ← Rock market + price chart + upgrades
├── workshop.html    ← Equipment shop
├── report.html      ← Stats, achievements, tax log
├── style.css        ← All shared styles
├── game.js          ← Game engine, save/load, equipment data
└── README.md        ← This file
```

---

## 🔧 Technical Details
- **3D Engine**: [Three.js r128](https://threejs.org) via CDN — no install needed
- **Save System**: `localStorage` — persists across sessions
- **Fonts**: Google Fonts (Rajdhani, Exo 2, Share Tech Mono)
- **No build step** — pure HTML/CSS/JS, works as static files
- **Mobile friendly** — responsive layout, touch drag on 3D scene

---

## 🏆 Achievements
| Icon | Name | Condition |
|------|------|-----------|
| 🚜 | First Machine | Buy first excavator |
| 💸 | Dead Broke | Fall below $10 cash |
| 💰 | First Million | Reach $1,000,000 cash |
| ⛏ | 10K Tons | Mine 10,000 tons |
| 🏔️ | Mountain Mover | Mine 1,000,000 tons |
| 🔬 | Laser Age | Unlock Laser Cutter |
| 🤖 | Drone Age | Deploy AI Drone Swarm |
| 🏛️ | Good Citizen | Pay $100,000 in taxes |
| 🌗 | Halfway There | Reach 50% completion |
| 🔮 | THE GLASS BALL | Complete 100% — win the game |

---

## 📜 License
Free to use, fork, and modify. This is a personal project.

---

*"The mountain will not yield willingly. Neither will the market."*  
— GMBP Director's Handbook, Chapter 1
