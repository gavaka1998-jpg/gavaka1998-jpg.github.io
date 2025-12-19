// script.js
const LS_KEY = "tonforge_state_v1";

// цены апгрейдов (10 уровней покупок)
const UPGRADE_COSTS = [0.4, 0.8, 1.6, 3.2, 6.4, 12.8, 25.6, 51.2, 102.4, 204.8];

// доход за 5 сек по уровням:
// lvl0: 0.00000001
// lvl1: 0.00000003
// lvl2: 0.00000006
// lvl3: 0.00000012 ...
function incomePer5s(lvl) {
  if (lvl <= 0) return 0.00000001;
  let v = 0.00000003;
  for (let i = 1; i < lvl; i++) v *= 2;
  return v;
}

// состояние
let state = loadState();

const elBalance = document.getElementById("balance");
const elRate = document.getElementById("rate");
const elLvl = document.getElementById("lvl");
const elNextCost = document.getElementById("nextCost");
const btnUpgrade = document.getElementById("btnUpgrade");
const btnWithdraw = document.getElementById("btnWithdraw");

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { balance: 0, lvl: 0, lastTick: Date.now() };
    const s = JSON.parse(raw);
    if (typeof s.balance !== "number") s.balance = 0;
    if (typeof s.lvl !== "number") s.lvl = 0;
    if (typeof s.lastTick !== "number") s.lastTick = Date.now();
    return s;
  } catch {
    return { balance: 0, lvl: 0, lastTick: Date.now() };
  }
}

function saveState() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function fmt(x, digits = 10) {
  return Number(x).toFixed(digits);
}

function nextUpgradeCost() {
  // lvl=0 -> покупка #1 = 0.4
  // lvl=1 -> покупка #2 = 0.8 ...
  const idx = state.lvl; 
  if (idx >= UPGRADE_COSTS.length) return null;
  return UPGRADE_COSTS[idx];
}

function render() {
  elBalance.textContent = ${fmt(state.balance, 8)} TON;
  elLvl.textContent = ${state.lvl};

  const rate = incomePer5s(state.lvl);
  elRate.textContent = ${fmt(rate, 8)} TON / 5сек;

  const cost = nextUpgradeCost();
  if (cost === null) {
    elNextCost.textContent = Макс. уровень;
    btnUpgrade.disabled = true;
    btnUpgrade.textContent = "Максимальный уровень";
  } else {
    elNextCost.textContent = ${cost} TON;
    btnUpgrade.disabled = state.balance < cost;
    btnUpgrade.textContent = Апгрейд за ${cost} TON;
  }
}

function doTick() {
  const now = Date.now();
  const stepMs = 5000;

  // сколько 5-сек интервалов прошло
  const passed = Math.floor((now - state.lastTick) / stepMs);
  if (passed > 0) {
    const add = incomePer5s(state.lvl) * passed;
    state.balance += add;
    state.lastTick += passed * stepMs;
    saveState();
  }
  render();
}

// Апгрейд
btnUpgrade.addEventListener("click", () => {
  const cost = nextUpgradeCost();
  if (cost === null) return;
  if (state.balance < cost) return;

  state.balance -= cost;
  state.lvl += 1;
  saveState();
  render();

  // если открыто в Telegram WebApp — отправим событие боту
  sendToBot({ action: "upgrade", lvl: state.lvl, balance: state.balance });
});

// Вывод (пока просто событие)
btnWithdraw.addEventListener("click", () => {
  sendToBot({ action: "withdraw_request", balance: state.balance, lvl: state.lvl });
  alert("Заявка на вывод отправлена (пока тест).");
});

function sendToBot(payload) {
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.sendData(JSON.stringify(payload));
    }
  } catch {}
}

// запуск
render();
doTick();

// чтобы “шевелилось” на экране постоянно
setInterval(doTick, 250);