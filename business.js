import { updateBalance } from './economy.js';

const BIZ_CONFIG = {
    ID: 'coffee_shop',
    BASE_PROFIT: 50,    // Сколько дает на 1 уровне
    BASE_MAX: 10000,    // Лимит на 1 уровне
    UPGRADE_COST: 50000,
    VAL_KEY: 'biz_coffee_val',
    TIME_KEY: 'biz_coffee_time',
    LVL_KEY: 'biz_coffee_lvl'
};

// Загружаем данные
let level = parseInt(localStorage.getItem(BIZ_CONFIG.LVL_KEY)) || 1;
let currentPool = parseFloat(localStorage.getItem(BIZ_CONFIG.VAL_KEY)) || 0;
let lastTick = parseInt(localStorage.getItem(BIZ_CONFIG.TIME_KEY)) || Date.now();

// Динамические показатели на основе уровня
const getProfit = () => BIZ_CONFIG.BASE_PROFIT * level;
const getMax = () => BIZ_CONFIG.BASE_MAX * level;

function tick() {
    const now = Date.now();
    const diffMs = now - lastTick;

    if (diffMs >= 1000) {
        const secondsPassed = Math.floor(diffMs / 1000);
        const maxPool = getMax();
        const profitPerSec = getProfit();

        if (currentPool < maxPool) {
            currentPool += secondsPassed * profitPerSec;
            if (currentPool > maxPool) currentPool = maxPool;

            lastTick += secondsPassed * 1000;
            saveState();
        }
    }
    updateUI();
}

function updateUI() {
    const maxPool = getMax();
    const fillPercent = (currentPool / maxPool) * 100;

    // Обновляем текст и полоску
    const fillEl = document.getElementById('pool-fill');
    const textEl = document.getElementById('pool-text');
    const statsEl = document.getElementById('biz-stats');
    const upgradeBtn = document.getElementById('upgrade-btn');

    if (fillEl) fillEl.style.width = `${fillPercent}%`;
    if (textEl) textEl.innerText = `${Math.floor(currentPool).toLocaleString()} / ${maxPool.toLocaleString()} CY`;
    if (statsEl) statsEl.innerText = `Уровень ${level} | Прибыль: ${getProfit()} CY/сек`;
    if (upgradeBtn) upgradeBtn.innerText = `УЛУЧШИТЬ (${(BIZ_CONFIG.UPGRADE_COST * level).toLocaleString()} CY)`;
}

function saveState() {
    localStorage.setItem(BIZ_CONFIG.VAL_KEY, currentPool);
    localStorage.setItem(BIZ_CONFIG.TIME_KEY, lastTick);
    localStorage.setItem(BIZ_CONFIG.LVL_KEY, level);
}

// КНОПКА: Собрать деньги
window.collectMoney = async function() {
    if (currentPool >= 1) {
        const amount = Math.floor(currentPool);
        const success = await updateBalance(amount); // Используем твою экономику

        if (success) {
            currentPool = 0;
            lastTick = Date.now();
            saveState();
            console.log(`Бизнес принес: ${amount} CY`);
        }
    }
};

// КНОПКА: Улучшить бизнес
window.upgradeBiz = async function() {
    const cost = BIZ_CONFIG.UPGRADE_COST * level;
    const success = await updateBalance(-cost); // Списываем деньги через экономику

    if (success) {
        level++;
        saveState();
        alert(`Бизнес улучшен до ${level} уровня!`);
    } else {
        alert("Недостаточно CY для улучшения!");
    }
};

// Запуск
setInterval(tick, 1000);
tick();