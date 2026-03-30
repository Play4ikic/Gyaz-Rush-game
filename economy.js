// 1. Константы (база данных)
const BALANCE_KEY = 'fixone_balance';
const START_BALANCE = 20000;

// 2. Функция: Получить текущий баланс из памяти
function getBalance() {
    let bal = localStorage.getItem(BALANCE_KEY);
    if (bal === null) {
        localStorage.setItem(BALANCE_KEY, START_BALANCE);
        return START_BALANCE;
    }
    return parseInt(bal);
}

// 3. Функция: Изменить баланс (прибавить или отнять)
function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    // Если денег после вычитания станет меньше нуля — отмена
    if (newBalance < 0) return false; 
    
    localStorage.setItem(BALANCE_KEY, newBalance);
    
    // Сразу обновляем цифры на всех страницах
    refreshBalanceDisplay();
    return true;
}

// 4. Функция: Обновить текст баланса на экране
function refreshBalanceDisplay() {
    const bal = getBalance();
    // Ищем все возможные ID и классы, где может быть написан баланс
    const elements = document.querySelectorAll('.balance-board, #shop-balance, #user-balance');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// 5. Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);

// 6. Авто-обновление при изменениях в других вкладках
window.addEventListener('storage', (event) => {
    if (event.key === BALANCE_KEY) {
        refreshBalanceDisplay();
    }
});