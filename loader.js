// Список всех папок и файлов, которые нужно прогрузить заранее
const assetsToLoad = [
    // Золотые
    "Gold/Ayla-30.png", "Gold/Raul-3.png", "Gold/Selim-68.png", "Gold/Chaxangir-68.png",
    "Gold/Bayturan-85.png", "Gold/Elcan-92.png", "Gold/Nazrin-82.png", 
    "Gold/Turqay-92.png", "Gold/Tuncay-90.png", "Gold/Bugday-87.png",
    // TOTY
    "Toty/Elcan-97.png", "Toty/Turqay-97.png", "Toty/Tuncay-97.png", 
    "Toty/Bugday-95.png", "Toty/Nazrin-91.png",
    // Champions
    "Champions/Elcan-96.png", "Champions/Turqay-96.png", "Champions/Tuncay-91.png",
    "Champions/Bugday-90.png", "Champions/Nazrin-88.png"
];

function preloadAssets() {
    let loadedCount = 0;
    const totalCount = assetsToLoad.length;
    const progressLine = document.getElementById('load-progress');
    const statusText = document.getElementById('load-status');
    const preloader = document.getElementById('preloader');

    if (totalCount === 0) {
        hidePreloader();
        return;
    }

    assetsToLoad.forEach(src => {
        const img = new Image();
        img.src = src;
        
        // Когда картинка загрузилась (или если произошла ошибка, чтобы не зависнуть)
        img.onload = img.onerror = () => {
            loadedCount++;
            const percent = Math.floor((loadedCount / totalCount) * 100);
            
            if (progressLine) progressLine.style.width = percent + "%";
            if (statusText) statusText.innerText = percent + "%";

            if (loadedCount === totalCount) {
                // Небольшая задержка для красоты
                setTimeout(hidePreloader, 500);
            }
        };
    });
}

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = "0";
        setTimeout(() => {
            preloader.style.display = "none";
        }, 500);
    }
}

// Запускаем при загрузке страницы
window.addEventListener('DOMContentLoaded', preloadAssets);