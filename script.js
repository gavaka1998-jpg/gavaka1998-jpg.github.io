let balance = 0;
let income = 0.0000000100; // доход каждые 5 секунд

function updateUI() {
  document.getElementById("balance").innerText =
    balance.toFixed(8) + " TON";
}

// майнинг каждые 5 секунд
setInterval(() => {
  balance += income;
  updateUI();

  // отправляем данные боту
  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.sendData(JSON.stringify({
      action: "mine",
      balance: balance
    }));
  }

}, 5000);

// кнопки (пока заглушки)
function upgrade() {
  alert("Апгрейд будет дальше");
}

function withdraw() {
  alert("Вывод будет дальше");
}

// первый рендер
updateUI();