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
document.addEventListener('keydown', (event) => {
    // Проверяем, нажата ли цифра от 1 до 8
    const key = parseInt(event.key);
    
    if (key >= 1 && key <= 8) {
        console.log(`Нажата клавиша ${key}. Переключаю на трек №${key}`);
        
        // Индекс в массиве начинается с 0, поэтому вычитаем 1
        currentTrackIndex = key - 1;
        
        // Меняем источник, сбрасываем время и запускаем
        bgMusic.src = playlist[currentTrackIndex];
        bgMusic.currentTime = 0; 
        
        // Сохраняем выбор сразу
        localStorage.setItem('gyaz_track_index', currentTrackIndex);
        localStorage.setItem('gyaz_music_time', 0);
        
        bgMusic.play().catch(err => console.log("Нажми на экран, чтобы разрешить звук!"));
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