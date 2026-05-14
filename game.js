// ============================================================
// GMBP — Core Engine v3 (clean rewrite, no race conditions)
// Architecture: localStorage is the ONLY source of truth.
// All pages read + write atomically. No merging. No intervals
// that overwrite unsaved changes.
// ============================================================

const SAVE_KEY = "gmbp_v3";

// 1 in-game day = 10 real seconds → 1 month (30d) = 5 real minutes
const MS_PER_DAY = 10000;

const EQUIPMENT = {
  excavator:     { id:"excavator",     name:"Excavator",       emoji:"🚜", desc:"Basic heavy excavator. Your first step.",           baseCost:400,     costMult:1.15, mineRate:1,    unlockPct:0  },
  bulldozer:     { id:"bulldozer",     name:"Bulldozer",       emoji:"🏗️", desc:"Pushes bulk debris fast.",                          baseCost:2500,    costMult:1.17, mineRate:6,    unlockPct:2  },
  drill_rig:     { id:"drill_rig",     name:"Drill Rig",       emoji:"⚙️", desc:"Penetrates deep granite layers.",                   baseCost:14000,   costMult:1.19, mineRate:35,   unlockPct:8  },
  laser_cutter:  { id:"laser_cutter",  name:"Laser Cutter",    emoji:"🔬", desc:"Industrial laser slices solid rock.",               baseCost:90000,   costMult:1.22, mineRate:200,  unlockPct:18 },
  nano_processor:{ id:"nano_processor",name:"Nano Processor",  emoji:"🧬", desc:"Nanobots disassemble rock molecularly.",            baseCost:600000,  costMult:1.25, mineRate:1200, unlockPct:35 },
  ai_drone:      { id:"ai_drone",      name:"AI Drone Swarm",  emoji:"🤖", desc:"Autonomous AI drones mine 24/7 with precision.",    baseCost:5000000, costMult:1.28, mineRate:8000, unlockPct:55 },
};

const MOUNTAIN_TONS = 3_900_000_000;

// Base price per ton
const BASE_PRICE = 0.003; // $0.003/ton (medium difficulty)

// 20 news templates — 10 up, 10 down
const NEWS_TEMPLATES = [
  // UP (multiplier > 1)
  { dir:"up", mult:1.4, text:"🏗️ Major construction boom in Texas — demand for raw granite surges. Rock prices spike +40%." },
  { dir:"up", mult:1.6, text:"🌋 Volcanic disruption in rival quarry halts 30% of US rock supply. Prices jump +60%." },
  { dir:"up", mult:1.25,text:"🇨🇳 China signs $8B import deal for American raw mountain rock. Market surges +25%." },
  { dir:"up", mult:1.5, text:"🏟️ New stadium megaprojects approved in 12 cities — rock demand at 10-year high. +50%." },
  { dir:"up", mult:1.35,text:"⛏️ Workers' union strike at 3 major quarries nationwide cuts supply. Prices +35%." },
  { dir:"up", mult:2.0, text:"💎 Scientists confirm Rainier granite has rare mineral trace. Bidding war erupts. Prices +100%." },
  { dir:"up", mult:1.45,text:"🛣️ Federal infrastructure bill passes — $400B road construction starts. Rock demand +45%." },
  { dir:"up", mult:1.3, text:"🌊 East coast flooding destroys 2 major quarry sites. Supply crunch. Prices +30%." },
  { dir:"up", mult:1.55,text:"🚀 SpaceX announces need for 50M tons of ballistic shielding rock. Market spikes +55%." },
  { dir:"up", mult:1.2, text:"📈 Analysts upgrade raw rock commodity outlook. Institutional buying pushes prices +20%." },
  // DOWN (multiplier < 1)
  { dir:"down", mult:0.6,  text:"📦 Brazil floods market with cheap granite imports. Prices crash -40%." },
  { dir:"down", mult:0.7,  text:"🤖 New AI excavation tech makes rock extraction 3x cheaper globally. Prices drop -30%." },
  { dir:"down", mult:0.5,  text:"🏚️ Construction sector enters recession — 40% drop in rock demand. Prices collapse -50%." },
  { dir:"down", mult:0.75, text:"🇮🇳 India opens massive new quarry operation, flooding world market. Prices fall -25%." },
  { dir:"down", mult:0.65, text:"🧪 Lab-grown synthetic rock certified for construction use. Natural rock demand -35%." },
  { dir:"down", mult:0.8,  text:"📉 Economic slowdown fears — commodity funds dump rock futures. Prices dip -20%." },
  { dir:"down", mult:0.55, text:"⚖️ EPA investigation into Rainier rock quality halts buyer confidence. Prices -45%." },
  { dir:"down", mult:0.7,  text:"🏔️ Largest ever Canadian rock deposit discovered — global supply shock. Prices -30%." },
  { dir:"down", mult:0.6,  text:"🌐 Global logistics collapse slows rock shipments, buyers pull orders. Prices -40%." },
  { dir:"down", mult:0.75, text:"💼 Government announces temporary rock price ceiling law. Market drops -25%." },
];

function defaultState() {
  return {
    // Economy
    cash: 500,
    stockTons: 0,       // tons in storage ready to sell
    tonsMined: 0,       // total tons removed (progress bar, never decreases)
    priceMultiplier: 1.0, // affected by news events
    totalEarned: 0,
    totalTaxPaid: 0,
    // Time
    day: 1,
    month: 1,
    year: 2025,
    lastRealMs: Date.now(),
    // Equipment: owned counts
    equipment: { excavator:0, bulldozer:0, drill_rig:0, laser_cutter:0, nano_processor:0, ai_drone:0 },
    // Upgrades purchased
    upgrades: {},
    // Tax
    taxHistory: [],
    // News
    newsHistory: [],
    activeNewsUntilDay: 0,  // news event expires after this many in-game days
    activeNewsMult: 1.0,
    // Log
    log: [],
    // Sell history
    sellHistory: [],
    // Achievements
    achievements: {},
    // Security
    securityLevel: 0,     // 0=none, 1=basic, 2=advanced, 3=quantum
    sabotageRisk: 0,      // 0-100, risk of sabotage event
    // Misc
    firstPlay: true,
    manualMines: 0,
  };
}

// ── CALCULATIONS ────────────────────────────────────────────

function mineRatePerSec(state) {
  let rate = 0;
  for (const [id, count] of Object.entries(state.equipment)) {
    if (EQUIPMENT[id] && count > 0) {
      let r = EQUIPMENT[id].mineRate * count;
      // Apply upgrade multipliers
      if (id === 'excavator'      && state.upgrades['drill_bits'])    r *= 1.5;
      if (id === 'bulldozer'      && state.upgrades['turbo_push'])    r *= 1.8;
      if (id === 'laser_cutter'   && state.upgrades['turbo_laser'])   r *= 2.0;
      if (id === 'nano_processor' && state.upgrades['nano_v2'])       r *= 2.5;
      if (id === 'ai_drone'       && state.upgrades['ai_core_v2'])    r *= 3.0;
      rate += r;
    }
  }
  if (state.upgrades['global_efficiency']) rate *= 1.3;
  return rate;
}

function currentPrice(state) {
  let price = BASE_PRICE;
  // Natural day-based variance ±10%
  price *= 1 + Math.sin(state.day * 0.9 + state.month) * 0.1;
  // News event multiplier
  price *= state.priceMultiplier || 1.0;
  // Upgrade boost
  if (state.upgrades['int_deal'])    price *= 1.5;
  if (state.upgrades['premium_contract']) price *= 2.0;
  return price;
}

function monthlyTax(state) {
  let tax = 0;
  for (const [id, count] of Object.entries(state.equipment)) {
    if (EQUIPMENT[id] && count > 0) {
      tax += EQUIPMENT[id].baseCost * count * 0.015; // 1.5% equipment value
    }
  }
  tax += state.cash * 0.03; // 3% cash tax
  if (state.upgrades['tax_shield'])   tax *= 0.7;
  if (state.upgrades['tax_shield_2']) tax *= 0.5;
  return Math.max(0, Math.floor(tax));
}

function progress(state) {
  return Math.min(100, (state.tonsMined / MOUNTAIN_TONS) * 100);
}

function equipCost(id, owned) {
  return Math.floor(EQUIPMENT[id].baseCost * Math.pow(EQUIPMENT[id].costMult, owned));
}

// ── SAVE / LOAD ─────────────────────────────────────────────
// Uses a write lock flag to prevent concurrent writes

let _writeLock = false;

function saveGame(state) {
  // Always save — no lock needed for localStorage (synchronous)
  try {
    state._savedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch(e) { console.warn('Save failed:', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function addLog(state, msg, type) {
  const ts = `Y${state.year} M${String(state.month).padStart(2,'0')} D${String(state.day).padStart(2,'0')}`;
  state.log.unshift({ ts, msg, type: type || 'info' });
  if (state.log.length > 100) state.log.length = 100;
}

// ── NEWS ENGINE ─────────────────────────────────────────────

function maybeFireNews(state) {
  // News fires randomly, ~1 chance per 15 in-game days
  if (Math.random() > (1 / 15)) return null;
  // Pick random news
  const idx = Math.floor(Math.random() * NEWS_TEMPLATES.length);
  const news = NEWS_TEMPLATES[idx];
  state.priceMultiplier = news.mult;
  state.activeNewsUntilDay = state.day + 20; // lasts 20 in-game days
  state.activeNewsMult = news.mult;
  const entry = { ts: `Y${state.year} M${state.month} D${state.day}`, ...news };
  state.newsHistory.unshift(entry);
  if (state.newsHistory.length > 30) state.newsHistory.length = 30;
  addLog(state, `📰 NEWS: ${news.text}`, news.dir === 'up' ? 'good' : 'warn');
  return entry;
}

function tickNewsExpiry(state) {
  if (state.priceMultiplier !== 1.0 && state.day > (state.activeNewsUntilDay || 0)) {
    state.priceMultiplier = 1.0;
    addLog(state, '📰 News event expired. Rock prices return to normal.', 'info');
  }
}

// ── SABOTAGE SYSTEM ──────────────────────────────────────────

function tickSabotage(state) {
  // Risk grows slowly
  state.sabotageRisk = Math.min(100, (state.sabotageRisk || 0) + 0.5);
  // Security reduces risk
  const reduction = [0, 3, 6, 10][state.securityLevel || 0];
  state.sabotageRisk = Math.max(0, state.sabotageRisk - reduction);

  if (state.sabotageRisk > 60 && Math.random() < 0.02) {
    // Sabotage event!
    const dmg = Math.floor(state.cash * 0.15);
    state.cash = Math.max(0, state.cash - dmg);
    state.sabotageRisk = Math.max(0, state.sabotageRisk - 30);
    addLog(state, `🔴 SABOTAGE! Rival agents damaged equipment. Lost $${dmg.toLocaleString()}. Upgrade security!`, 'warn');
    return { type: 'sabotage', dmg };
  }
  return null;
}

// ── MAIN TICK (called by index.html only) ────────────────────
// Returns array of events that happened (news, tax, sabotage)

function processTick(state) {
  const now = Date.now();
  const elapsed = now - (state.lastRealMs || now);
  state.lastRealMs = now;

  const msPerDay = MS_PER_DAY;
  const daysToProcess = Math.floor(elapsed / msPerDay);
  if (daysToProcess <= 0) return [];

  const events = [];
  const rate = mineRatePerSec(state);
  const secPerDay = msPerDay / 1000;

  for (let d = 0; d < Math.min(daysToProcess, 10); d++) {
    // Mine
    const mined = rate * secPerDay;
    state.tonsMined = Math.min(state.tonsMined + mined, MOUNTAIN_TONS);
    state.stockTons += mined;

    // Advance day
    state.day++;

    // News check
    const newsEvent = maybeFireNews(state);
    if (newsEvent) events.push({ type: 'news', data: newsEvent });

    // News expiry
    tickNewsExpiry(state);

    // Sabotage check
    const sabEvent = tickSabotage(state);
    if (sabEvent) events.push(sabEvent);

    // Month rollover
    if (state.day > 30) {
      state.day = 1;
      state.month++;

      // Monthly tax
      const tax = monthlyTax(state);
      if (tax > 0) {
        if (state.cash >= tax) {
          state.cash -= tax;
          state.totalTaxPaid += tax;
          addLog(state, `🏛️ Monthly tax paid: $${tax.toLocaleString()}`, 'warn');
          events.push({ type: 'tax', amount: tax, defaulted: false });
        } else {
          const penalty = Math.floor(state.cash * 0.4);
          state.cash = Math.max(0, state.cash - penalty);
          addLog(state, `⚠️ TAX DEFAULT! Couldn't pay $${tax.toLocaleString()}. Penalty: $${penalty.toLocaleString()}`, 'warn');
          events.push({ type: 'tax', amount: tax, defaulted: true, penalty });
        }
        state.taxHistory.unshift({ month: state.month - 1 > 0 ? state.month - 1 : 12, year: state.year, amount: tax });
        if (state.taxHistory.length > 36) state.taxHistory.length = 36;
      }

      if (state.month > 12) {
        state.month = 1;
        state.year++;
      }
    }
  }

  // Consume fractional ms
  state.lastRealMs = now - (elapsed % msPerDay) * Math.min(daysToProcess, 10) / daysToProcess;

  return events;
}

// ── SELL OPERATION (called by market.html) ───────────────────
// Returns { ok, earned, error }

function sellStock(state, tons) {
  const stock = state.stockTons || 0;
  if (tons <= 0)       return { ok: false, error: 'Amount must be > 0' };
  if (tons > stock)    return { ok: false, error: `Only ${Math.floor(stock).toLocaleString()} tons in stock` };
  const price  = currentPrice(state);
  const earned = tons * price;
  state.cash       += earned;
  state.totalEarned = (state.totalEarned || 0) + earned;
  state.stockTons   = Math.max(0, stock - tons);
  state.sellHistory = state.sellHistory || [];
  state.sellHistory.unshift({
    ts: `Y${state.year} M${state.month} D${state.day}`,
    tons: Math.floor(tons),
    earned,
    price,
  });
  if (state.sellHistory.length > 30) state.sellHistory.length = 30;
  addLog(state, `💰 Sold ${Math.floor(tons).toLocaleString()} tons @ $${price.toFixed(5)}/ton = $${earned.toFixed(2)}`, 'good');
  return { ok: true, earned };
}

// ── EXPORTS ──────────────────────────────────────────────────

window.GMBP = {
  EQUIPMENT,
  NEWS_TEMPLATES,
  MOUNTAIN_TONS,
  MS_PER_DAY,
  BASE_PRICE,
  // Calculations
  mineRatePerSec,
  currentPrice,
  monthlyTax,
  progress,
  equipCost,
  // State
  defaultState,
  saveGame,
  loadGame,
  addLog,
  // Operations
  processTick,
  sellStock,
  maybeFireNews,
};
