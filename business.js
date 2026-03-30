import { updateBalance } from './economy.js';

const BIZ_MAX = 6000;
const BIZ_INCOME = 20;

function processBiz() {
    let currentBiz = parseInt(localStorage.getItem('gyaz_biz_val')) || 0;
    let lastTime = parseInt(localStorage.getItem('gyaz_biz_time')) || Date.now();
    
    const now = Date.now();
    const diff = Math.floor((now - lastTime) / 1000);

    if (diff >= 1) {
        if (currentBiz < BIZ_MAX) {
            currentBiz += diff * BIZ_INCOME;
            if (currentBiz > BIZ_MAX) currentBiz = BIZ_MAX;
        }
        localStorage.setItem('gyaz_biz_val', currentBiz);
        localStorage.setItem('gyaz_biz_time', now);
    }

    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = currentBiz + " / " + BIZ_MAX + " CY";
    }
}

// Кнопка сбора
window.collectBusinessMoney = function() {
    let currentBiz = parseInt(localStorage.getItem('gyaz_biz_val')) || 0;
    if (currentBiz > 0) {
        updateBalance(currentBiz); // ОТПРАВЛЯЕМ В ОБЩУЮ КАССУ
        localStorage.setItem('gyaz_biz_val', 0);
        localStorage.setItem('gyaz_biz_time', Date.now());
    }
}

setInterval(processBiz, 1000);
