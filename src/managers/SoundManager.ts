import { Scene } from 'phaser';
import { Debug } from '../utils/Debug';

export class SoundManager {
    private scene: Scene;
    private debug: Debug;
    private isAudioContextStarted: boolean = false;

    constructor(scene: Scene, debug: Debug) {
        this.scene = scene;
        this.debug = debug;

        // 监听用户交互以启动音频上下文
        this.setupAudioContextListener();
    }

    private setupAudioContextListener(): void {
        const startAudioContext = () => {
            if (!this.isAudioContextStarted) {
                // 尝试恢复音频上下文
                const soundManager = this.scene.sound;
                if ('context' in soundManager && soundManager.context?.state === 'suspended') {
                    soundManager.context.resume().then(() => {
                        this.isAudioContextStarted = true;
                        this.debug.logEvent('Audio', 'AudioContext started');
                    }).catch((error: Error) => {
                        this.debug.logEvent('Audio', 'Failed to start AudioContext', { error });
                    });
                }
            }
        };

        // 添加用户交互事件监听器
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, startAudioContext, { once: true });
        });
    }

    playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
        try {
            // 即使AudioContext未启动也尝试播放
            // Phaser会在AudioContext准备好后自动播放
            this.scene.sound.play(key, config);
            this.debug.logEvent('Audio', 'Playing sound', { key, config });
        } catch (error: unknown) {
            this.debug.logEvent('Audio', 'Failed to play sound', { 
                key, 
                error: error instanceof Error ? error.message : String(error) 
            });
        }
    }

    preloadSounds(): void {
        this.scene.load.audio('wave_start', 'assets/sounds/wave_start.wav');
        this.scene.load.audio('countdown', 'assets/sounds/countdown.wav');
    }
}
