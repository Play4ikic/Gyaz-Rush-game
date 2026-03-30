import { updateBalance } from './economy.js'; // Важно: путь к файлу экономики

// Настройки бизнеса FixOne
const BIZ_MAX = 6000;      // Максимум накопления
const BIZ_INCOME = 20;     // Доход в секунду (72,000 в час)

let currentBizMoney = parseInt(localStorage.getItem('gyaz_biz_val')) || 0;
let lastUpdate = parseInt(localStorage.getItem('gyaz_biz_time')) || Date.now();

function updateBiz() {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);

    if (elapsedSeconds >= 1) {
        // Начисляем прибыль за прошедшее время (даже если вкладка была закрыта)
        if (currentBizMoney < BIZ_MAX) {
            let profit = elapsedSeconds * BIZ_INCOME;
            currentBizMoney += profit;
            
            if (currentBizMoney > BIZ_MAX) currentBizMoney = BIZ_MAX;
        }
        
        lastUpdate = now;
        
        // Сохраняем состояние бизнеса
        localStorage.setItem('gyaz_biz_val', currentBizMoney);
        localStorage.setItem('gyaz_biz_time', lastUpdate);
    }

    // Обновляем визуальную шкалу бизнеса
    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = Math.floor(currentBizMoney).toLocaleString() + " / " + BIZ_MAX + " CY";
        
        // Красим в красный, если склад забит
        display.style.color = (currentBizMoney >= BIZ_MAX) ? "#ff4444" : "#00ff88";
        display.style.fontWeight = "bold";
    }
}

// ГЛОБАЛЬНАЯ ФУНКЦИЯ СБОРА (для кнопки onclick)
window.collectBusinessMoney = async function() {
    if (currentBizMoney > 0) {
        const added = await updateBalance(Math.floor(currentBizMoney));
        
        if (added) {
            console.log(`Собрано из бизнеса: ${currentBizMoney} CY`);
            currentBizMoney = 0;
            lastUpdate = Date.now();
            localStorage.setItem('gyaz_biz_val', 0);
            localStorage.setItem('gyaz_biz_time', lastUpdate);
            updateBiz();
        }
    } else {
        alert("Бизнес пока не принес прибыли!");
    }
}

// Запуск цикла
setInterval(updateBiz, 1000);
updateBiz();
