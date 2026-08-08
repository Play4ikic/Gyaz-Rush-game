const SECRET_KEY = "FixOne_Goalyaz_SecureKey_2026_#99!";
const SIG_VERSION = "v2"; // Версия подписи для отслеживания изменений

// 0. Генерация контрольной цифровой подписи (хеша)
function generateSignature(amount) {
    const str = `${amount}:${SECRET_KEY}:${SIG_VERSION}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return btoa(`sig_${SIG_VERSION}_${hash}_${amount}`);
}

// Сохранение баланса вместе с защитной подписью
function setSecureBalance(amount) {
    const safeAmount = Math.max(0, parseInt(amount) || 0);
    localStorage.setItem('fixone_balance', safeAmount.toString());
    localStorage.setItem('fixone_sig', generateSignature(safeAmount));
}

// Безопасное чтение баланса с проверкой целостности
function getValidBalance() {
    let rawBalance = localStorage.getItem('fixone_balance');
    let rawSig = localStorage.getItem('fixone_sig');

    // ПРОВЕРКА НА ПЕРВЫЙ ВХОД (вообще нет данных)
    if (rawBalance === null && rawSig === null) {
        setSecureBalance(10000); // 10k на старт
        return 10000;
    }

    // Обработка случая, когда баланс null, но подпись почему-то есть
    if (rawBalance === null) {
        rawBalance = '0';
    }

    const currentBalance = parseInt(rawBalance) || 0;
    const expectedSig = generateSignature(currentBalance);

    // ПРОВЕРКА НА МИГРАЦИЮ (баланс есть, подписи нет или она пустая)
    if (!rawSig || rawSig.trim() === "") {
        console.log("Включение защиты: создание начальной подписи.");
        setSecureBalance(currentBalance); // Просто создаем подпись для текущих денег
        return currentBalance;
    }

    // ПРОВЕРКА НА СТАРУЮ ВЕРСИЮ ПОДПИСИ
    // Если подпись есть, но она не начинается с текущей версии,
    // мы считаем её старой и обновляем под баланс (не сбрасываем!)
    if (!rawSig.startsWith(`sig_${SIG_VERSION}_`)) {
        console.log("Обновление версии защиты: пересоздание подписи.");
        setSecureBalance(currentBalance);
        return currentBalance;
    }

    // ПРОВЕРКА ВЗЛОМА (защита активна, подписи не совпадают)
    if (rawSig !== expectedSig) {
        console.warn("ВНИМАНИЕ: Обнаружена попытка изменения баланса!");
        alert("Обнаружено несанкционированное изменение баланса через консоль! Значение сброшено.");
        setSecureBalance(0);
        return 0;
    }

    return currentBalance;
}

// 1. Инициализация баланса при старте
getValidBalance();

// 2. ФУНКЦИЯ ОБНОВЛЕНИЯ БАЛАНСА
export async function updateBalance(amount) {
    let currentBalance = getValidBalance();
    
    if (amount < 0) {
        if (currentBalance + amount < 0) {
            console.error("Недостаточно средств!");
            return false;
        }
    }

    const newBalance = currentBalance + amount;
    setSecureBalance(newBalance);
    refreshBalanceDisplay();
    
    return true;
}

// 3. ФУНКЦИЯ ОТОБРАЖЕНИЯ БАЛАНСА
export function refreshBalanceDisplay() {
    const balance = getValidBalance();
    
    const displays = [
        document.getElementById('balance-display'),
        document.getElementById('shop-balance'),
        document.getElementById('user-balance')
    ];

    displays.forEach(el => {
        if (el) {
            el.innerText = balance.toLocaleString() + " CY";
        }
    });
}

// Авто-обновление при загрузке
refreshBalanceDisplay();
