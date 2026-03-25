// Настройки
const BIZ_MAX = 6000;
const BIZ_INCOME = 20; 

// Загрузка
let currentBizMoney = parseInt(localStorage.getItem('gyaz_biz_val')) || 0;
let lastUpdate = parseInt(localStorage.getItem('gyaz_biz_time')) || Date.now();

function updateBiz() {
    const now = Date.now();
    const seconds = Math.floor((now - lastUpdate) / 1000);

    if (seconds >= 1) {
        // Начисляем деньги
        if (currentBizMoney < BIZ_MAX) {
            currentBizMoney += seconds * BIZ_INCOME;
            if (currentBizMoney > BIZ_MAX) currentBizMoney = BIZ_MAX;
        }
        lastUpdate = now;
        
        // Сохраняем
        localStorage.setItem('gyaz_biz_val', currentBizMoney);
        localStorage.setItem('gyaz_biz_time', lastUpdate);
    }

    // Вывод на экран
    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = currentBizMoney + " / " + BIZ_MAX + " CY";
        
        // Красим, если накопилось
        display.style.color = (currentBizMoney >= BIZ_MAX) ? "#ff4444" : "#00ff88";
    } else {
        console.error("ОШИБКА: Элемент с id='business-display' не найден на странице!");
    }
}

// Функция сбора (клик по кнопке)
function collectBusinessMoney() {
    if (currentBizMoney > 0) {
        // Вызываем твою функцию из economy.js
        if (typeof updateBalance === 'function') {
            updateBalance(currentBizMoney);
            currentBizMoney = 0;
            lastUpdate = Date.now();
            localStorage.setItem('gyaz_biz_val', 0);
            localStorage.setItem('gyaz_biz_time', lastUpdate);
            updateBiz();
        }
    }
}

// Запуск каждую секунду
setInterval(updateBiz, 1000);

// Сразу запускаем один раз при загрузке
updateBiz();