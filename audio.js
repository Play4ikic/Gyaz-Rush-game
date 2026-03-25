const playlist = [
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

function syncAndPlay() {
    if (!bgMusic.src) {
        bgMusic.src = playlist[currentTrackIndex];
        bgMusic.currentTime = savedTime;
    }

    bgMusic.play().then(() => {
        console.log("Музыка успешно подхвачена!");
    }).catch(err => {
        console.log("Ожидание клика пользователя для запуска звука...");
    });
}

// Сохраняем прогресс очень часто (каждые 200мс), чтобы переход был точным
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

// ГЛАВНОЕ: Слушаем любой клик на странице, чтобы "разбудить" звук
document.addEventListener('click', () => {
    syncAndPlay();
}, { once: false }); // Убрал once:true, чтобы срабатывало наверняка

// Авто-попытка при загрузке (сработает, если браузер уже "доверяет" сайту)
window.addEventListener('load', syncAndPlay);

function toggleMute() {
    bgMusic.muted = !bgMusic.muted;
    localStorage.setItem('gyaz_muted', bgMusic.muted);
    return bgMusic.muted;
}

function setVolume(val) {
    bgMusic.volume = val;
}