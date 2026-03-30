import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const BALANCE_KEY = 'fixone_balance';

export function getBalance() {
    const bal = localStorage.getItem(BALANCE_KEY);
    return bal !== null ? parseInt(bal) : 20000;
}

export async function updateBalance(amount) {
    let newBalance = getBalance() + amount;
    if (newBalance < 0) return false;

    localStorage.setItem(BALANCE_KEY, newBalance);
    
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (user) {
        const db = getDatabase();
        try {
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { console.warn("Firebase sync failed, saved locally."); }
    }
    refreshBalanceDisplay();
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// Постоянное обновление интерфейса
setInterval(refreshBalanceDisplay, 1000);
document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);