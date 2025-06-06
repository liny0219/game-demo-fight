import 'phaser';
import { MainScene } from '../scenes/MainScene';
import { GameOverScene } from '../scenes/GameOverScene';

const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
            fps: 60
        }
    },
    scene: [MainScene, GameOverScene],
    audio: {
        disableWebAudio: false
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: true,
        powerPreference: 'high-performance'
    },
    input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: false
    },
    fps: {
        target: 60,
        forceSetTimeOut: true,
        deltaHistory: 10
    }
};

export default gameConfig; 