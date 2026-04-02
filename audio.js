const playlist = [
    "Music/Drive - moa moa (FIFA 23 Official Soundtrack).m4a",
    "Music/Marwa Loud - Bad Boy (Lyrics).m4a",
    "Music/Ojitos Lindos - Bad Bunny (ft. Bomba Estereo) (FIFA 23 Official Soundtrack).m4a",
    "Music/6am - Channel Tres (EAFC 24 SOUNDTRACK).mp3",
    "Music/Going Kokomo - Royel Otis (EAFC 24 SOUNDTRACK).mp3",
    "Music/Mamgobhozi - Major Lazer & Major League Djz (ft. Brenda Fassie) (EAFC 24 SOUNDTRACK).mp3",
    "Music/seasidedemo - SEB (FIFA 22 Official Soundtrack).mp3",
    "Music/Worms - Ashnikko (EAFC 24 SOUNDTRACK).mp3"
];

let currentTrackIndex = parseInt(localStorage.getItem('gyaz_track_index')) || 0;
let savedTime = parseFloat(localStorage.getItem('gyaz_music_time')) || 0;
let isMuted = localStorage.getItem('gyaz_muted') === 'true';

const bgMusic = new Audio();
bgMusic.volume = 0.3;
bgMusic.muted = isMuted;

// --- НОВАЯ ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ПО КЛАВИШАМ ---
// --- ОБНОВЛЕННАЯ ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ: CTRL + ЦИФРА ---
document.addEventListener('keydown', (event) => {
    // Проверяем, нажата ли клавиша Ctrl (или Cmd на Mac) вместе с цифрой
    if (event.ctrlKey) {
        const key = parseInt(event.key);
        
        // Проверяем, что нажата цифра от 1 до 8
        if (key >= 1 && key <= 8) {
            // Отменяем стандартное действие браузера (например, переключение вкладок)
            event.preventDefault(); 
            
            console.log("Переключение трека через Ctrl +", key);
            
            // 1. Останавливаем текущий трек
            bgMusic.pause();
            
            // 2. Меняем индекс (вычитаем 1, так как индекс массива начинается с 0)
            currentTrackIndex = key - 1;
            
            // 3. Устанавливаем новый файл
            bgMusic.src = playlist[currentTrackIndex];
            bgMusic.currentTime = 0;
            
            // 4. Запускаем
            bgMusic.play().catch(err => {
                console.error("Нужен клик по странице для активации звука!");
            });

            // Сохраняем состояние в память
            localStorage.setItem('gyaz_track_index', currentTrackIndex);
            localStorage.setItem('gyaz_music_time', 0);
        }
    }
});
function syncAndPlay() {
    if (!bgMusic.src) {
        bgMusic.src = playlist[currentTrackIndex];
        bgMusic.currentTime = savedTime;
    }

    bgMusic.play().catch(err => {
        console.log("Ожидание клика для запуска звука...");
    });
}

setInterval(() => {
    if (!bgMusic.paused) {
        localStorage.setItem('gyaz_music_time', bgMusic.currentTime);
        localStorage.setItem('gyaz_track_index', currentTrackIndex);
    }
}, 200);

bgMusic.onended = () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    bgMusic.src = playlist[currentTrackIndex];
    bgMusic.currentTime = 0;
    bgMusic.play();
};

document.addEventListener('click', () => {
    syncAndPlay();
});

window.addEventListener('load', syncAndPlay);

function toggleMute() {
    bgMusic.muted = !bgMusic.muted;
    localStorage.setItem('gyaz_muted', bgMusic.muted);
    return bgMusic.muted;
}

function setVolume(val) {
    bgMusic.volume = val;
}