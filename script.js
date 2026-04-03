const tabData = {
    news: { 
        title: "ПОСЛЕДНИЕ НОВОСТИ", 
        desc: "Новый весенний сезон FixOne FC уже здесь! Успей забрать уникальные карточки Eldzhan и Tuncay.", 
        img: "Prewie/news.png", 
        link: "#" 
    },
    shop: { 
        title: "МАГАЗИН ПАКОВ", 
        desc: "Трать свои CY на элитные наборы. Шанс выбить TOTY или Champions карты повышен!", 
        img: "Prewie/shop.jpg", 
        link: "shop.html" 
    },
    club: { 
        title: "МОЙ КЛУБ", 
        desc: "Настраивай тактику, меняй состав и следи за рейтингом (AVG) своей команды.", 
        img: "Prewie/club.png", 
        link: "club.html" 
    },
    draft: { 
        title: "DRAFT BATTLE", 
        desc: "Собери команду из случайных игроков и докажи, что ты лучший тренер в быстром турнире.", 
        img: "Prewie/draft.png", 
        link: "draft.html" 
    },
    market: { 
        title: "ТРАНСФЕРНЫЙ РЫНОК", 
        desc: "Торгуй игроками с умом. Покупай дешево, продавай дорого и строй свою империю.", 
        img: "Prewie/market.png", 
        link: "market.html" 
    },
    pass: { 
        title: "GY PASS: SPRING", 
        desc: "Проходи уровни, зарабатывай опыт и открывай премиальные награды этого сезона.", 
        img: "Prewie/pass.png", 
        link: "gympass.html" 
    }
};

/**
 * Функция переключения контента в центре экрана
 */
function selectTab(tabKey) {
    const data = tabData[tabKey];
    if (!data) return;

    const container = document.getElementById('preview-box');
    const goBtn = document.getElementById('pre-link');

    // Анимация затухания
    container.style.opacity = "0";
    container.style.transform = "translateY(10px)";

    setTimeout(() => {
        document.getElementById('pre-title').innerText = data.title;
        document.getElementById('pre-desc').innerText = data.desc;
        document.getElementById('pre-img').src = data.img;
        
        goBtn.href = data.link;
        // Скрываем кнопку, если это раздел новостей
        goBtn.style.display = (data.link === "#") ? "none" : "inline-block";

        container.style.opacity = "1";
        container.style.transform = "translateY(0)";
    }, 200);

    // Обновление активного состояния в меню
    document.querySelectorAll('.tab-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(`'${tabKey}'`)) {
            el.classList.add('active');
        }
    });
}

/**
 * Загрузка данных пользователя при старте
 */
window.addEventListener('DOMContentLoaded', () => {
    const localData = localStorage.getItem('gyaz_user');
    
    // Если игрок не авторизован — редирект
    if (!localData) {
        window.location.href = "auth.html";
        return;
    }

    const userData = JSON.parse(localData);
    
    // Обновляем баланс в шапке (приоритет данным из localStorage экономики)
    const balanceEl = document.getElementById('shop-balance');
    if (balanceEl) {
        const currentBalance = localStorage.getItem('fixone_balance') || userData.balance;
        balanceEl.innerText = Number(currentBalance).toLocaleString() + " CY";
    }

    // Стартовая вкладка
    selectTab('news');
});