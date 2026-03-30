import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const BALANCE_KEY = 'fixone_balance';
const START_BALANCE = 20000;

export function getBalance() {
    let bal = localStorage.getItem(BALANCE_KEY);
    if (bal === null) {
        localStorage.setItem(BALANCE_KEY, START_BALANCE);
        return START_BALANCE;
    }
    return parseInt(bal);
}

export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false; 
    
    // 1. Сохраняем локально
    localStorage.setItem(BALANCE_KEY, newBalance);
    
    // 2. Отправляем в Firebase (чтобы на другом ПК баланс обновился)
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (user) {
        const db = getDatabase();
        await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        // Обновляем данные в локальном объекте пользователя
        user.balance = newBalance;
        localStorage.setItem('gyaz_user', JSON.stringify(user));
    }
    
    refreshBalanceDisplay();
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    const elements = document.querySelectorAll('.balance-board, #shop-balance, #user-balance, #user-coins');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);