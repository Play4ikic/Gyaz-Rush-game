import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com",
    storageBucket: "play4ik-473ef.appspot.com",
    messagingSenderId: "115893557892",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

window.loginWithGoogle = function() {
    signInWithPopup(auth, provider)
        .then(async (result) => {
            const user = result.user;
            const userRef = ref(db, 'users/' + user.uid);
            
            // Проверяем, есть ли такой игрок в базе
            const snapshot = await get(userRef);
            
            if (!snapshot.exists()) {
                // РЕГИСТРАЦИЯ НОВОГО ИГРОКА
                const newUser = {
                    uid: user.uid,
                    nickname: user.displayName || "Новый игрок",
                    balance: 20000,
                    inventory: [],
                    squad: [null, null, null, null, null]
                };
                await set(userRef, newUser);
                saveLocal(newUser);
            } else {
                // ВХОД СУЩЕСТВУЮЩЕГО
                saveLocal(snapshot.val());
            }
            window.location.href = "hub.html";
        })
        .catch((error) => {
            console.error("Ошибка входа:", error.code);
            alert("Ошибка входа: " + error.message);
        });
};

function saveLocal(userData) {
    localStorage.setItem('gyaz_user', JSON.stringify(userData));
    localStorage.setItem('fixone_balance', userData.balance);
    localStorage.setItem('myPlayers', JSON.stringify(userData.inventory || []));
    localStorage.setItem('activeSquad', JSON.stringify(userData.squad || [null, null, null, null, null]));
}