import { updateBalance } from './economy.js';

// Настройки FixOne Business
const CONFIG = {
    MAX: 6000,
    PER_SECOND: 20,
    VAL_KEY: 'gyaz_biz_val',
    TIME_KEY: 'gyaz_biz_time'
};

// Загружаем прогресс
let currentPool = parseInt(localStorage.getItem(CONFIG.VAL_KEY)) || 0;
let lastTick = parseInt(localStorage.getItem(CONFIG.TIME_KEY)) || Date.now();

function tick() {
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastTick) / 1000);

    if (diffSeconds >= 1) {
        // Если прошло время, начисляем
        if (currentPool < CONFIG.MAX) {
            currentPool += diffSeconds * CONFIG.PER_SECOND;
            if (currentPool > CONFIG.MAX) currentPool = CONFIG.MAX;
        }
        
        // Запоминаем время этого тика
        lastTick = now;
        
        // Сохраняем состояние бизнеса
        localStorage.setItem(CONFIG.VAL_KEY, currentPool);
        localStorage.setItem(CONFIG.TIME_KEY, lastTick);
    }

    // Рисуем в HTML
    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = Math.floor(currentPool).toLocaleString() + " / " + CONFIG.MAX + " CY";
        display.style.color = (currentPool >= CONFIG.MAX) ? "#ff4444" : "#00ff88";
    }
}

// Кнопка сбора (Доступна из HTML)
window.collectBusinessMoney = function() {
    if (currentPool >= 1) {
        const toAdd = Math.floor(currentPool);
        
        // Вызываем новую экономику
        updateBalance(toAdd);
        
        // Сбрасываем бизнес
        currentPool = 0;
        lastTick = Date.now();
        localStorage.setItem(CONFIG.VAL_KEY, 0);
        localStorage.setItem(CONFIG.TIME_KEY, lastTick);
        
        console.log(`Собрано прибыли: ${toAdd} CY`);
    }
};

// Запуск счетчика
setInterval(tick, 1000);
tick();