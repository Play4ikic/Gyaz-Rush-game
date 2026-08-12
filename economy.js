const SECRET_KEY = "FixOne_Goalyaz_SecureKey_2026_#99!"; //[span_1](start_span)[span_1](end_span)
const SIG_VERSION = "v2"; // Версия подписи для отслеживания изменений[span_2](start_span)[span_2](end_span)

// 0. Генерация контрольной цифровой подписи (хеша)[span_3](start_span)[span_3](end_span)
function generateSignature(amount) {
    const str = `${amount}:${SECRET_KEY}:${SIG_VERSION}`; //[span_4](start_span)[span_4](end_span)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i); //[span_5](start_span)[span_5](end_span)
        hash = ((hash << 5) - hash) + char; //[span_6](start_span)[span_6](end_span)
        hash |= 0; //[span_7](start_span)[span_7](end_span)
    }
    return btoa(`sig_${SIG_VERSION}_${hash}_${amount}`); //[span_8](start_span)[span_8](end_span)
}

// Сохранение баланса вместе с защитной подписью[span_9](start_span)[span_9](end_span)
function setSecureBalance(amount) {
    const safeAmount = Math.max(0, parseInt(amount) || 0); //[span_10](start_span)[span_10](end_span)
    localStorage.setItem('fixone_balance', safeAmount.toString()); //[span_11](start_span)[span_11](end_span)
    localStorage.setItem('fixone_sig', generateSignature(safeAmount)); //[span_12](start_span)[span_12](end_span)
}

// Безопасное чтение баланса с проверкой целостности[span_13](start_span)[span_13](end_span)
function getValidBalance() {
    let rawBalance = localStorage.getItem('fixone_balance'); //[span_14](start_span)[span_14](end_span)
    let rawSig = localStorage.getItem('fixone_sig'); //[span_15](start_span)[span_15](end_span)

    // ПРОВЕРКА НА ПЕРВЫЙ ВХОД (вообще нет данных)[span_16](start_span)[span_16](end_span)
    if (rawBalance === null && rawSig === null) {
        setSecureBalance(10000); // 10k на старт[span_17](start_span)[span_17](end_span)
        return 10000; //[span_18](start_span)[span_18](end_span)
    }

    // Обработка случая, когда баланс null, но подпись почему-то есть[span_19](start_span)[span_19](end_span)
    if (rawBalance === null) {
        rawBalance = '0'; //[span_20](start_span)[span_20](end_span)
    }

    const currentBalance = parseInt(rawBalance) || 0; //[span_21](start_span)[span_21](end_span)
    const expectedSig = generateSignature(currentBalance); //[span_22](start_span)[span_22](end_span)

    // ПРОВЕРКА НА МИГРАЦИЮ (баланс есть, подписи нет или она пустая)[span_23](start_span)[span_23](end_span)
    if (!rawSig || rawSig.trim() === "") {
        console.log("Включение защиты: создание начальной подписи."); //[span_24](start_span)[span_24](end_span)
        setSecureBalance(currentBalance); // Просто создаем подпись для текущих денег[span_25](start_span)[span_25](end_span)
        return currentBalance; //[span_26](start_span)[span_26](end_span)
    }

    // ПРОВЕРКА НА СТАРУЮ ВЕРСИЮ ПОДПИСИ[span_27](start_span)[span_27](end_span)
    if (!rawSig.startsWith(`sig_${SIG_VERSION}_`)) {
        console.log("Обновление версии защиты: пересоздание подписи."); //[span_28](start_span)[span_28](end_span)
        setSecureBalance(currentBalance); //[span_29](start_span)[span_29](end_span)
        return currentBalance; //[span_30](start_span)[span_30](end_span)
    }

    // ПРОВЕРКА ВЗЛОМА (защита активна, подписи не совпадают)[span_31](start_span)[span_31](end_span)
    if (rawSig !== expectedSig) {
        console.warn("ВНИМАНИЕ: Обнаружена попытка изменения баланса!"); //[span_32](start_span)[span_32](end_span)
        alert("Обнаружено несанкционированное изменение баланса через консоль! Значение сброшено."); //[span_33](start_span)[span_33](end_span)
        setSecureBalance(0); //[span_34](start_span)[span_34](end_span)
        return 0; //[span_35](start_span)[span_35](end_span)
    }

    return currentBalance; //[span_36](start_span)[span_36](end_span)
}

// 1. Инициализация баланса при старте[span_37](start_span)[span_37](end_span)
getValidBalance(); //[span_38](start_span)[span_38](end_span)

// 2. ФУНКЦИЯ ОБНОВЛЕНИЯ БАЛАНСА[span_39](start_span)[span_39](end_span)
export async function updateBalance(amount) {
    let currentBalance = getValidBalance(); //[span_40](start_span)[span_40](end_span)
    
    if (amount < 0) {
        if (currentBalance + amount < 0) { //[span_41](start_span)[span_41](end_span)
            console.error("Недостаточно средств!"); //[span_42](start_span)[span_42](end_span)
            return false; //[span_43](start_span)[span_43](end_span)
        }
    }

    const newBalance = currentBalance + amount; //[span_44](start_span)[span_44](end_span)
    setSecureBalance(newBalance); //[span_45](start_span)[span_45](end_span)
    refreshBalanceDisplay(); //[span_46](start_span)[span_46](end_span)
    
    return true; //[span_47](start_span)[span_47](end_span)
}

// 3. ФУНКЦИЯ ОТОБРАЖЕНИЯ БАЛАНСА[span_48](start_span)[span_48](end_span)
export function refreshBalanceDisplay() {
    const balance = getValidBalance(); //[span_49](start_span)[span_49](end_span)
    
    const displays = [
        document.getElementById('balance-display'), //[span_50](start_span)[span_50](end_span)
        document.getElementById('shop-balance'), //[span_51](start_span)[span_51](end_span)
        document.getElementById('user-balance') //[span_52](start_span)[span_52](end_span)
    ];

    displays.forEach(el => {
        if (el) {
            el.innerText = balance.toLocaleString() + " CY"; //[span_53](start_span)[span_53](end_span)
        }
    });
}

// 4. ПРОВЕРКА ОДНОРАЗОВОЙ БОНУСНОЙ ССЫЛКИ (?promo=super100k)
function checkPromoCode() {
    refreshBalanceDisplay(); //[span_54](start_span)[span_54](end_span)

    const urlParams = new URLSearchParams(window.location.search); //[span_55](start_span)[span_55](end_span)
    const promoCode = urlParams.get('promo'); //[span_56](start_span)[span_56](end_span)

    // Новый промокод
    const SECRET_CODE = "super100k";
    const CLAIM_KEY = "promo_claimed_" + SECRET_CODE;

    if (promoCode === SECRET_CODE) {
        const isClaimed = localStorage.getItem(CLAIM_KEY); //[span_57](start_span)[span_57](end_span)

        if (!isClaimed) {
            // Начисляем 100 000 с генерацией валидной подписи[span_58](start_span)[span_58](end_span)
            updateBalance(100000); //[span_59](start_span)[span_59](end_span)
            
            // Фиксируем, что бонус был забран[span_60](start_span)[span_60](end_span)
            localStorage.setItem(CLAIM_KEY, "true"); //[span_61](start_span)[span_61](end_span)

            alert("🎉 Поздравляем! Вам начислено 100 000 CY!"); //[span_62](start_span)[span_62](end_span)

            // Очищаем URL без перезагрузки[span_63](start_span)[span_63](end_span)
            const cleanUrl = window.location.origin + window.location.pathname; //[span_64](start_span)[span_64](end_span)
            window.history.replaceState({}, document.title, cleanUrl); //[span_65](start_span)[span_65](end_span)
        } else {
            alert("⚠️ Вы уже активировали этот подарок!"); //[span_66](start_span)[span_66](end_span)
            
            const cleanUrl = window.location.origin + window.location.pathname; //[span_67](start_span)[span_67](end_span)
            window.history.replaceState({}, document.title, cleanUrl); //[span_68](start_span)[span_68](end_span)
        }
    }
}

// Безопасный запуск независимости от скорости загрузки модуля
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkPromoCode);
} else {
    checkPromoCode();
}
