import { updateBalance } from './economy.js';

const BIZ_MAX = 6000;
const BIZ_INCOME = 20; 

// ЗАГРУЗКА: берем время из памяти, чтобы деньги копились, пока тебя нет
let currentBizMoney = parseInt(localStorage.getItem('gyaz_biz_val')) || 0;
let lastUpdate = parseInt(localStorage.getItem('gyaz_biz_time')) || Date.now();

function updateBiz() {
    const now = Date.now();
    // Считаем разницу между "сейчас" и "последним обновлением"
    const seconds = Math.floor((now - lastUpdate) / 1000);

    if (seconds >= 1) {
        if (currentBizMoney < BIZ_MAX) {
            currentBizMoney += seconds * BIZ_INCOME;
            if (currentBizMoney > BIZ_MAX) currentBizMoney = BIZ_MAX;
        }
        // Обновляем время последней проверки
        lastUpdate = now;
        
        localStorage.setItem('gyaz_biz_val', currentBizMoney);
        localStorage.setItem('gyaz_biz_time', lastUpdate);
    }

    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = Math.floor(currentBizMoney) + " / " + BIZ_MAX + " CY";
        display.style.color = (currentBizMoney >= BIZ_MAX) ? "#ff4444" : "#00ff88";
    }
}

// Глобальная функция для кнопки
window.collectBusinessMoney = function() {
    if (currentBizMoney >= 1) {
        const amount = Math.floor(currentBizMoney);
        updateBalance(amount); // Отправляем в файл экономики
        
        currentBizMoney = 0;
        lastUpdate = Date.now();
        localStorage.setItem('gyaz_biz_val', 0);
        localStorage.setItem('gyaz_biz_time', lastUpdate);
    }
};

setInterval(updateBiz, 1000);
updateBiz();