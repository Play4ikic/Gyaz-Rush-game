import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// Твой конфиг Firebase (оставляем тот же)
const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com", 
    storageBucket: "play4ik-473ef.firebasestorage.app",
    messagingSenderId: "115893557892",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- НАСТРОЙКИ КОНСТАНТ ---
const BALANCE_KEY = 'fixone_balance';
const BIZ_VAL_KEY = 'gyaz_biz_val';
const BIZ_TIME_KEY = 'gyaz_biz_time';

const BIZ_MAX = 6000;      // Лимит бизнеса
const BIZ_INCOME = 20;     // Доход в секунду

// --- 1. ЛОГИКА ОБЩЕГО БАЛАНСА ---

export function getBalance() {
    const bal = localStorage.getItem(BALANCE_KEY);
    return bal !== null ? parseInt(bal) : 20000; // 20k стартовых, если новый игрок
}

export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false; // Нельзя уходить в минус

    // Сохраняем локально
    localStorage.setItem(BALANCE_KEY, newBalance);
    
    // Синхронизируем с Firebase
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (user && user.uid) {
        try {
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { console.warn("Firebase Sync Error"); }
    }
    
    refreshBalanceDisplay();
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    // Ищем все элементы на страницах: магазин, биржа, драфт
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// --- 2. ЛОГИКА БИЗНЕСА (ПРИБЫЛЬ) ---

let currentBizMoney = parseInt(localStorage.getItem(BIZ_VAL_KEY)) || 0;
let lastUpdate = parseInt(localStorage.getItem(BIZ_TIME_KEY)) || Date.now();

function updateBizLogic() {
    const now = Date.now();
    const elapsed = Math.floor((now - lastUpdate) / 1000);

    if (elapsed >= 1) {
        if (currentBizMoney < BIZ_MAX) {
            currentBizMoney += elapsed * BIZ_INCOME;
            if (currentBizMoney > BIZ_MAX) currentBizMoney = BIZ_MAX;
        }
        lastUpdate = now;
        
        localStorage.setItem(BIZ_VAL_KEY, currentBizMoney);
        localStorage.setItem(BIZ_TIME_KEY, lastUpdate);
    }

    // Вывод на экран бизнеса
    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = Math.floor(currentBizMoney).toLocaleString() + " / " + BIZ_MAX + " CY";
        display.style.color = (currentBizMoney >= BIZ_MAX) ? "#ff4444" : "#00ff88";
    }
}

// Глобальная функция для кнопки "Собрать"
window.collectBusinessMoney = async function() {
    if (currentBizMoney >= 1) {
        const amountToCollect = Math.floor(currentBizMoney);
        const success = await updateBalance(amountToCollect);
        
        if (success) {
            currentBizMoney = 0;
            lastUpdate = Date.now();
            localStorage.setItem(BIZ_VAL_KEY, 0);
            localStorage.setItem(BIZ_TIME_KEY, lastUpdate);
            updateBizLogic();
            console.log("Прибыль собрана!");
        }
    } else {
        alert("Пока нечего собирать!");
    }
};

// --- ИНИЦИАЛИЗАЦИЯ ---

// Запуск циклов
setInterval(updateBizLogic, 1000);
setInterval(refreshBalanceDisplay, 1000);

// При загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    refreshBalanceDisplay();
    updateBizLogic();
});
