// КЛЮЧИ ХРАНИЛИЩА (Используем твои стандартные названия)
const BALANCE_KEY = 'fixone_balance'; 
const BIZ_VAL_KEY = 'gyaz_biz_val';
const BIZ_TIME_KEY = 'gyaz_biz_time';

// НАСТРОЙКИ БИЗНЕСА
const BIZ_MAX = 6000;      
const BIZ_INCOME = 20;     

// --- 1. РАБОТА С БАЛАНСОМ ---

// Получить текущие деньги
export function getBalance() {
    const bal = localStorage.getItem(BALANCE_KEY);
    if (bal === null || bal === "undefined") {
        localStorage.setItem(BALANCE_KEY, 20000); // Стартовый капитал
        return 20000;
    }
    return parseInt(bal);
}

// Изменить баланс (начислить или списать)
export function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false; // Не уходим в минус

    localStorage.setItem(BALANCE_KEY, newBalance);
    refreshBalanceDisplay();
    return true;
}

// Обновить текст во всех элементах на экране
export function refreshBalanceDisplay() {
    const bal = getBalance();
    // Список всех ID и классов, которые ты используешь в проекте
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins, #balance-text');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// --- 2. ЛОГИКА БИЗНЕСА ---

function updateBusiness() {
    let currentBiz = parseInt(localStorage.getItem(BIZ_VAL_KEY)) || 0;
    let lastTime = parseInt(localStorage.getItem(BIZ_TIME_KEY)) || Date.now();
    
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastTime) / 1000);

    if (diffSeconds >= 1) {
        if (currentBiz < BIZ_MAX) {
            currentBiz += diffSeconds * BIZ_INCOME;
            if (currentBiz > BIZ_MAX) currentBiz = BIZ_MAX;
        }
        localStorage.setItem(BIZ_VAL_KEY, currentBiz);
        localStorage.setItem(BIZ_TIME_KEY, now);
    }

    // Отрисовка прибыли бизнеса
    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = Math.floor(currentBiz).toLocaleString() + " / " + BIZ_MAX + " CY";
        display.style.color = (currentBiz >= BIZ_MAX) ? "#ff4444" : "#00ff88";
    }
}

// Глобальная функция для кнопки "Собрать"
window.collectBusinessMoney = function() {
    let currentBiz = parseInt(localStorage.getItem(BIZ_VAL_KEY)) || 0;
    
    if (currentBiz >= 1) {
        // Просто перекладываем из одного ключа в другой локально
        updateBalance(Math.floor(currentBiz));
        localStorage.setItem(BIZ_VAL_KEY, 0);
        localStorage.setItem(BIZ_TIME_KEY, Date.now());
        console.log("Прибыль успешно собрана локально!");
    } else {
        alert("Пока нечего собирать!");
    }
};

// --- 3. ЗАПУСК ---

// Обновляем экран каждые 500мс для плавности
setInterval(refreshBalanceDisplay, 500);
setInterval(updateBusiness, 1000);

// Первичная отрисовка при загрузке
document.addEventListener('DOMContentLoaded', () => {
    refreshBalanceDisplay();
    updateBusiness();
});
