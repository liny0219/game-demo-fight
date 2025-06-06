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
            debug: false
        }
    },
    scene: [MainScene, GameOverScene],
    audio: {
        disableWebAudio: false
    },
    render: {
        pixelArt: false,
        antialias: true
    },
    input: {
        keyboard: true,
        mouse: true,
        touch: true,
        gamepad: false
    }
};

export default gameConfig; 