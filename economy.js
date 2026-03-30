import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const BALANCE_KEY = 'fixone_balance';
const START_BALANCE = 20000;

export function getBalance() {
    let bal = localStorage.getItem(BALANCE_KEY);
    // Если в памяти пусто, ставим 20к, если нет - берем то, что есть (твои 13180)
    return bal !== null ? parseInt(bal) : START_BALANCE;
}

export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    if (newBalance < 0) return false; 
    
    localStorage.setItem(BALANCE_KEY, newBalance);
    
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (user) {
        const db = getDatabase();
        try {
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { console.log("Firebase sync skip"); }
    }
    
    refreshBalanceDisplay();
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    // Ищем id="shop-balance", который у тебя в hub.html
    const elements = document.querySelectorAll('#shop-balance, .balance-display, .balance-board');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// Запускаем обновление сразу и повторяем каждые 500мс для надежности
setInterval(refreshBalanceDisplay, 500);
document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);