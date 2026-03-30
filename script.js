const tabData = {
    news: { 
        title: "ПОСЛЕДНИЕ НОВОСТИ", 
        desc: "Новый сезон уже стартует.Успей получить новые Карточки", 
        img: "Prewie/news.png", 
        link: "#" 
    },
    shop: { 
        title: "МАГАЗИН ПАКОВ", 
        desc: "Открывай эксклюзивные паки Toty Pack. Попробуй выбить TOTY или Champions карты!", 
        img: "Prewie/shop.jpg", 
        link: "shop.html" 
    },
    club: { 
        title: "УПРАВЛЕНИЕ КЛУБОМ", 
        desc: "Настрой свой состав, проверь средний рейтинг (AVG) и расставь игроков на поле.", 
        img: "Prewie/club.png", 
        link: "club.html" 
    },
    draft: { 
        title: "DRAFT BATTLE", 
        desc: "Выбери сложность и сразись в бою.Твой клуб твое решение!", 
        img: "Prewie/draft.png", 
        link: "draft.html" 
    },
    market: { 
        title: "ТРАНСФЕРНЫЙ РЫНОК", 
        desc: "Продавай своих игроков.Создай свой Бизнес", 
        img: "Prewie/market.png", 
        link: "market.html" 
    },
    betting: { 
        title: "BETTING ARENA", 
        desc: "Ставь на Toxic или Cheerleaders. Угадывай точный счет и умножай свои Деньги в 10 раз!", 
        img: "Prewie/betting.png", 
        link: "betting.html" 
    }
};

function selectTab(tabKey) {
    const data = tabData[tabKey];
    if (!data) return;

    const container = document.getElementById('preview-box');
    const goBtn = document.getElementById('pre-link');

    // Эффект переключения
    container.style.opacity = "0";
    container.style.transform = "scale(0.95)";

    setTimeout(() => {
        document.getElementById('pre-title').innerText = data.title;
        document.getElementById('pre-desc').innerText = data.desc;
        document.getElementById('pre-img').src = data.img;
        
        // Назначаем ссылку кнопке
        goBtn.href = data.link;

        // Если это новости — кнопку входа прячем
        goBtn.style.display = (data.link === "#") ? "none" : "inline-block";

        container.style.opacity = "1";
        container.style.transform = "scale(1)";
    }, 200);

    // Активный класс для вкладок
    document.querySelectorAll('.tab-item').forEach(el => {
        el.classList.remove('active');
        if (el.innerText.toLowerCase().includes(tabKey.replace('news', 'новости'))) {
            el.classList.add('active');
        }
    });
}

window.onload = () => {
    selectTab('news');
    if (typeof refreshBalanceDisplay === "function") refreshBalanceDisplay();
};

// Проверка авторизации при входе в Хаб
window.addEventListener('DOMContentLoaded', () => {
    const localData = localStorage.getItem('gyaz_user');
    
    if (!localData) {
        // Если игрок не залогинен — отправляем на страницу входа
        window.location.href = "auth.html";
        return;
    }

    const userData = JSON.parse(localData);
    
    // Выводим никнейм в консоль для теста
    console.log("Авторизован как: " + userData.nickname);

    // Обновляем интерфейс данными из профиля
    updateUIFromProfile(userData);
});

function updateUIFromProfile(data) {
    // Давай заменим текст "Бизнес" на твой Никнейм
    const businessLabel = document.querySelector('.business-label');
    if (businessLabel) {
        businessLabel.innerText = "ИГРОК: " + data.nickname.toUpperCase();
    }

    // Обновляем баланс из базы (если в базе 10,000, то и тут будет 10,000)
    if (typeof updateBalanceDisplay === "function") {
        // Если у тебя в economy.js есть функция обновления, вызываем её
        // Либо просто напрямую:
        const balanceEl = document.getElementById('shop-balance');
        if (balanceEl) balanceEl.innerText = data.balance + " CY";
    }
}