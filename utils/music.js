// Background music (Web Audio via three.js).
//
// Mobile browsers only allow audio that starts from a tap, so unlockAudio() is
// called right inside the Start tap, and again on later taps to recover from
// iOS suspending audio when the app is backgrounded.

// AAC: ~1 MB instead of the 15 MB WAV, plays on every mobile browser
const MUSIC_URL = "assets/music/windchill.m4a";

let listener = null;
let sound = null;
let bufferPromise = null;
let musicOn = true; // the player's choice; survives restarts

// iPhone: play even with the ring/silent switch on (Safari 17+). Players can
// still mute with the in-game sound button.
if (navigator.audioSession) {
    try { navigator.audioSession.type = "playback"; } catch (e) { /* unsupported */ }
}

function audioContext() {
    return THREE.AudioContext.getContext();
}

// Call synchronously from a tap/click/key handler
export function unlockAudio() {
    const ctx = audioContext();
    if (ctx.state !== "running") ctx.resume().catch(() => {});
}

// Download + decode once, reuse for every new game
function loadBuffer() {
    if (!bufferPromise) {
        bufferPromise = new Promise((resolve, reject) => {
            new THREE.AudioLoader().load(MUSIC_URL, resolve, undefined, reject);
        });
        bufferPromise.catch(() => { bufferPromise = null; }); // allow a retry
    }
    return bufferPromise;
}

function playIfWanted() {
    if (musicOn && sound && sound.buffer && !sound.isPlaying && !document.hidden) {
        unlockAudio();
        sound.play();
    }
}

export function initMusic(camera) {
    stopMusic();

    if (!listener) listener = new THREE.AudioListener();
    camera.add(listener);

    const thisSound = (sound = new THREE.Audio(listener));
    loadBuffer()
        .then(buffer => {
            if (sound !== thisSound) return; // a newer game replaced this one
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.5);
            playIfWanted();
        })
        .catch(err => console.warn("Music failed to load:", err));
}

export function stopMusic() {
    if (sound && sound.isPlaying) sound.stop();
    sound = null;
}

export function isMusicOn() {
    return musicOn;
}

// Returns the new on/off state so buttons can show it
export function toggleMusic() {
    musicOn = !musicOn;
    if (!musicOn) {
        if (sound && sound.isPlaying) sound.pause();
    } else {
        playIfWanted(); // if still loading, it starts as soon as it's ready
    }
    return musicOn;
}

// Pause when the app/tab is hidden; pick back up when it returns
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (sound && sound.isPlaying) sound.pause();
    } else {
        playIfWanted();
    }
});

// Any tap or key press revives audio that iOS suspended in the background
["pointerdown", "touchend", "keydown"].forEach(type => {
    document.addEventListener(type, () => {
        if (!sound) return;
        if (audioContext().state !== "running") unlockAudio();
        playIfWanted();
    }, { passive: true });
});
