// ============================================================
// GOVERNMENT MOUNTAIN > BALL BIG PROJECT
// Core Game Engine
// ============================================================

const SAVE_KEY = "gmbp_v1";

// Time: 1 in-game day = 10 real seconds → 1 month (30d) = 5 real minutes
const MS_PER_DAY = 10000;

const EQUIPMENT_DATA = {
  excavator: {
    id: "excavator",
    name: "Excavator",
    emoji: "🚜",
    desc: "Standard heavy excavator. Slow but reliable.",
    baseCost: 10,
    costMult: 1.18,
    mineRate: 0.5,   // tons/sec per unit
    unlockProgress: 0,
  },
  bulldozer: {
    id: "bulldozer",
    name: "Bulldozer",
    emoji: "🏗️",
    desc: "Pushes massive debris. Faster than excavator.",
    baseCost: 32,
    costMult: 1.20,
    mineRate: 2.8,
    unlockProgress: 5,
  },
  drill_rig: {
    id: "drill_rig",
    name: "Drill Rig",
    emoji: "⚙️",
    desc: "Penetrates deep rock layers with rotating drill.",
    baseCost: 18,
    costMult: 1.22,
    mineRate: 14,
    unlockProgress: 12,
  },
  laser_cutter: {
    id: "laser_cutter",
    name: "Laser Cutter",
    emoji: "🔬",
    desc: "Industrial-grade laser slices solid granite.",
    baseCost: 120,
    costMult: 1.25,
    mineRate: 80,
    unlockProgress: 25,
  },
  nano_processor: {
    id: "nano_processor",
    name: "Nano Processor",
    emoji: "🧬",
    desc: "Nanobots disassemble rock at molecular level.",
    baseCost: 900,
    costMult: 1.28,
    mineRate: 500,
    unlockProgress: 40,
  },
  ai_drone: {
    id: "ai_drone",
    name: "AI Drone Swarm",
    emoji: "🤖",
    desc: "Autonomous drone fleet with AI coordination.",
    baseCost: 8000,
    costMult: 1.32,
    mineRate: 3500,
    unlockProgress: 60,
  },
};

// Mount Rainier: ~3.9 billion tons of rock to remove (simplified)
const MOUNTAIN_TOTAL_TONS = 3_900_000_000;

// Tax rates per month based on equipment count
function calcMonthlyTax(state) {
  let total = 0;
  for (const [id, count] of Object.entries(state.equipment)) {
    const eq = EQUIPMENT_DATA[id];
    if (eq && count > 0) {
      // Tax = 2% of equipment total value
      total += eq.baseCost * count * 0.02;
    }
  }
  // Plus 5% of cash on hand as "government operation fee"
  total += state.cash * 0.05;
  return Math.floor(total);
}

function calcMineRatePerSec(state) {
  let rate = 0;
  for (const [id, count] of Object.entries(state.equipment)) {
    const eq = EQUIPMENT_DATA[id];
    if (eq && count > 0) rate += eq.mineRate * count;
  }
  return rate;
}

function calcProgress(state) {
  return Math.min(100, (state.tonsMined / MOUNTAIN_TOTAL_TONS) * 100);
}

function getEquipCost(id, owned) {
  const eq = EQUIPMENT_DATA[id];
  return Math.floor(eq.baseCost * Math.pow(eq.costMult, owned));
}

function defaultState() {
  return {
    cash: 5983835823,
    tonsMined: 0,
    day: 1,
    month: 1,
    year: 2025,
    lastTick: Date.now(),
    lastTaxDay: 1,
    equipment: {
      excavator: 0,
      bulldozer: 0,
      drill_rig: 0,
      laser_cutter: 0,
      nano_processor: 0,
      ai_drone: 0,
    },
    taxHistory: [],
    totalEarned: 0,
    totalTaxPaid: 0,
    glassProgress: 0, // 0-100, unlocks after 100% mine
    log: [],
    firstPlay: true,
  };
}

function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    s.lastTick = Date.now(); // reset tick on load to avoid time skip exploit
    return s;
  } catch(e) {
    return null;
  }
}

function addLog(state, msg) {
  const timestamp = `Y${state.year} M${state.month} D${state.day}`;
  state.log.unshift({ t: timestamp, msg });
  if (state.log.length > 80) state.log.pop();
}

// Sell mined rock as raw material → earns cash
// Price per ton fluctuates slightly
function sellPrice(state) {
  const base = 0.0012; // $0.0012 per ton base
  // small fluctuation based on day
  const variance = 1 + (Math.sin(state.day * 0.7) * 0.15);
  return base * variance;
}

window.GMBP = {
  EQUIPMENT_DATA,
  MOUNTAIN_TOTAL_TONS,
  MS_PER_DAY,
  calcMonthlyTax,
  calcMineRatePerSec,
  calcProgress,
  getEquipCost,
  defaultState,
  saveGame,
  loadGame,
  addLog,
  sellPrice,
};
