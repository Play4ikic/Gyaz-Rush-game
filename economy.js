import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const BALANCE_KEY = 'fixone_balance';
const USER_KEY = 'gyaz_user';
const START_BALANCE = 20000;

export function getBalance() {
    // Берем значение напрямую из fixone_balance, как в твоем Application tab
    let bal = localStorage.getItem(BALANCE_KEY);
    if (bal === null) {
        // Если совсем пусто, ставим стартовый баланс
        localStorage.setItem(BALANCE_KEY, START_BALANCE);
        return START_BALANCE;
    }
    return parseInt(bal);
}

export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false; 
    
    // 1. Сохраняем в основной ключ баланса
    localStorage.setItem(BALANCE_KEY, newBalance);
    
    // 2. Синхронизируем с объектом пользователя и Firebase
    const userRaw = localStorage.getItem(USER_KEY);
    if (userRaw) {
        const user = JSON.parse(userRaw);
        const db = getDatabase();
        
        try {
            // Обновляем в облаке
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
            
            // Обновляем локальную копию объекта пользователя
            user.balance = newBalance;
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            console.log("Баланс синхронизирован: " + newBalance);
        } catch (e) {
            console.error("Ошибка Firebase, но локально сохранено:", e);
        }
    }
    
    refreshBalanceDisplay();
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    // Добавил еще больше селекторов, чтобы точно найти текст с балансом
    const elements = document.querySelectorAll('.balance-board, #shop-balance, #user-balance, #user-coins, .money-display, #p-score-val');
    
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// Запускаем отображение сразу при загрузке скрипта и при полной загрузке страницы
refreshBalanceDisplay();
document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);

// Сделаем функцию доступной глобально для тестов в консоли
window.refreshMoney = refreshBalanceDisplay;