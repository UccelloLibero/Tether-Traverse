// import * as THREE from 'three';

let listener, sound, isPlaying = false;

export function initMusic(camera) {
    // Starting a new game after Exit must not stack a second copy of the track
    if (sound && sound.isPlaying) sound.stop();
    isPlaying = false;

    listener = new THREE.AudioListener();
    camera.add(listener);

    sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('assets/music/windchill.wav', buffer => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);
        sound.play();
        isPlaying = true;
    });
}

export function toggleMusic() {
    if (!sound) return;
    if (isPlaying) {
        sound.pause();
    } else {
        sound.play();
    }
    isPlaying = !isPlaying;
}