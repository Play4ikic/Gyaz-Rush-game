import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com", 
    storageBucket: "play4ik-473ef.firebasestorage.app",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Ключ в LocalStorage
const STORAGE_KEY = 'fixone_balance';

// 1. Получить баланс (всегда возвращает число)
export function getBalance() {
    const val = localStorage.getItem(STORAGE_KEY);
    return (val === null || val === "undefined") ? 20000 : parseInt(val);
}

// 2. Изменить баланс (прибавить или отнять)
export async function updateBalance(amount) {
    const current = getBalance();
    const newTotal = current + amount;
    
    if (newTotal < 0) return false; // Недостаточно средств

    // Сохраняем локально (мгновенно)
    localStorage.setItem(STORAGE_KEY, newTotal);
    refreshUI();

    // Отправляем в Firebase (фоном)
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (user && user.uid) {
        try {
            await update(ref(db, `users/${user.uid}`), { balance: newTotal });
        } catch(e) { console.warn("Ошибка синхронизации с сервером"); }
    }
    return true;
}

// 3. Обновить цифры на всех страницах
export function refreshUI() {
    const amount = getBalance();
    const targets = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins');
    targets.forEach(el => {
        el.innerText = amount.toLocaleString() + " CY";
    });
}

// Авто-обновление при загрузке и каждые 2 секунды
document.addEventListener('DOMContentLoaded', refreshUI);
setInterval(refreshUI, 2000);