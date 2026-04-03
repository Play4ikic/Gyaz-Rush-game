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
    // Считаем разницу в миллисекундах
    const diffMs = now - lastTick;

    if (diffMs >= 1000) {
        // Вычисляем, сколько целых секунд прошло
        const secondsPassed = Math.floor(diffMs / 1000);

        if (currentPool < CONFIG.MAX) {
            // Начисляем за каждую прошедшую секунду
            currentPool += secondsPassed * CONFIG.PER_SECOND;
            
            if (currentPool > CONFIG.MAX) currentPool = CONFIG.MAX;

            // ВАЖНО: обновляем время только на количество учтенных секунд
            // Это исключает потерю миллисекунд
            lastTick += secondsPassed * 1000;

            // Сохраняем состояние
            localStorage.setItem(CONFIG.VAL_KEY, Math.floor(currentPool));
            localStorage.setItem(CONFIG.TIME_KEY, lastTick);
        }
    }

    // Обновление UI
    const display = document.getElementById('business-display');
    if (display) {
        const currentAmount = Math.floor(currentPool);
        display.innerText = currentAmount.toLocaleString() + " / " + CONFIG.MAX + " CY";
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