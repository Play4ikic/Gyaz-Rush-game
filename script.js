const tabData = {
    news: { title: "ПОСЛЕДНИЕ НОВОСТИ", desc: "Новый сезон стартовал! Успей забрать награды.", img: "Prewie/news.png", link: "#" },
    shop: { title: "МАГАЗИН ПАКОВ", desc: "Открывай эксклюзивные наборы за CY.", img: "Prewie/shop.jpg", link: "shop.html" },
    club: { title: "МОЙ КЛУБ", desc: "Управляй составом и тактикой своей команды.", img: "Prewie/club.png", link: "club.html" },
    draft: { title: "DRAFT BATTLE", desc: "Собери временный состав и победи в турнире.", img: "Prewie/draft.png", link: "draft.html" },
    market: { title: "ТРАНСФЕРНЫЙ РЫНОК", desc: "Покупай и продавай игроков с выгодой.", img: "Prewie/market.png", link: "market.html" },
    betting: { title: "СТАВКИ", desc: "Умножай свои CY на арене ставок.", img: "Prewie/betting.png", link: "betting.html" }
};

function selectTab(tabKey) {
    const data = tabData[tabKey];
    if (!data) return;

    const container = document.getElementById('preview-box');
    const goBtn = document.getElementById('pre-link');

    container.style.opacity = "0";
    container.style.transform = "scale(0.95)";

    setTimeout(() => {
        document.getElementById('pre-title').innerText = data.title;
        document.getElementById('pre-desc').innerText = data.desc;
        document.getElementById('pre-img').src = data.img;
        goBtn.href = data.link;
        goBtn.style.display = (data.link === "#") ? "none" : "inline-block";
        container.style.opacity = "1";
        container.style.transform = "scale(1)";
    }, 200);

    document.querySelectorAll('.tab-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(`'${tabKey}'`)) {
            el.classList.add('active');
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const localData = localStorage.getItem('gyaz_user');
    if (!localData) {
        window.location.href = "auth.html";
        return;
    }
    const userData = JSON.parse(localData);
    
    // Привязка ника и баланса
    const businessLabel = document.querySelector('.business-label');
    if (businessLabel) businessLabel.innerText = "ИГРОК: " + userData.nickname.toUpperCase();
    
    const balanceEl = document.getElementById('shop-balance');
    if (balanceEl) {
        const balance = localStorage.getItem('fixone_balance') || userData.balance;
        balanceEl.innerText = Number(balance).toLocaleString() + " CY";
    }

    selectTab('news');
});