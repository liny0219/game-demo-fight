import { Scene } from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Debug } from '../utils/Debug';

interface WaveCallbacks {
    onWaveComplete: () => void;
    onEnemySpawn: (enemy: Enemy) => void;
    onWaveStart: (wave: number) => void;
    onCountdownTick: (timeLeft: number) => void;
}

export class WaveManager {
    private scene: Scene;
    private player: Phaser.Physics.Arcade.Sprite;
    private debug: Debug;
    private enemies: Enemy[] = [];
    private currentWave: number = 0;
    private waveState: 'none' | 'starting' | 'in progress' | 'complete' = 'none';
    private callbacks?: WaveCallbacks;
    private countdownTimer?: Phaser.Time.TimerEvent;
    private readonly WAVE_COUNTDOWN: number = 10; // 10秒间隔
    private readonly SPAWN_DELAY: number = 500;
    private readonly ENEMY_HEALTH_PER_BAR: number = 100; // 每管血代表的血量值，与Enemy类中的MAX_HEALTH_PER_BAR保持一致

    constructor(scene: Scene, player: Phaser.Physics.Arcade.Sprite, debug: Debug) {
        this.scene = scene;
        this.player = player;
        this.debug = debug;
    }

    init(callbacks: WaveCallbacks): void {
        this.callbacks = callbacks;
    }

    startNewWave(): void {
        this.currentWave++;
        this.waveState = 'starting';
        this.debug.set('wave', this.currentWave);
        this.debug.set('waveState', this.waveState);
        this.debug.logEvent('Wave', 'Starting new wave', { wave: this.currentWave });

        if (this.callbacks) {
            this.callbacks.onWaveStart(this.currentWave);
        }

        // 每波只生成一个敌人，血量随波数增加，确保初始血量为多管
        const enemyHealth = this.ENEMY_HEALTH_PER_BAR * 3 + (this.currentWave - 1) * this.ENEMY_HEALTH_PER_BAR;
        this.debug.set('enemyHealth', enemyHealth);

        // 延迟生成敌人
        this.scene.time.delayedCall(2000, () => {
            // 在屏幕边缘随机位置生成敌人
            const side = Math.floor(Math.random() * 4); // 0: 上, 1: 右, 2: 下, 3: 左
            const margin = 50;
            let x = this.scene.cameras.main.centerX;
            let y = this.scene.cameras.main.centerY;

            switch (side) {
                case 0: // 上边
                    y = margin;
                    x = margin + Math.random() * (this.scene.cameras.main.width - margin * 2);
                    break;
                case 1: // 右边
                    x = this.scene.cameras.main.width - margin;
                    y = margin + Math.random() * (this.scene.cameras.main.height - margin * 2);
                    break;
                case 2: // 下边
                    y = this.scene.cameras.main.height - margin;
                    x = margin + Math.random() * (this.scene.cameras.main.width - margin * 2);
                    break;
                case 3: // 左边
                    x = margin;
                    y = margin + Math.random() * (this.scene.cameras.main.height - margin * 2);
                    break;
            }

            const enemy = new Enemy(this.scene, x, y, this.player);
            enemy.setHealth(enemyHealth);
            this.enemies.push(enemy);

            if (this.callbacks) {
                this.callbacks.onEnemySpawn(enemy);
            }

            this.waveState = 'in progress';
            this.debug.set('waveState', this.waveState);
            this.debug.logEvent('Wave', 'Wave setup completed', { wave: this.currentWave });
        });
    }

    startNextWaveCountdown(): void {
        if (this.waveState !== 'complete') {
            this.waveState = 'complete';
            this.debug.set('waveState', this.waveState);

            let timeLeft = this.WAVE_COUNTDOWN;
            this.debug.logEvent('Wave', 'Starting countdown', { timeLeft });

            if (this.callbacks) {
                this.callbacks.onCountdownTick(timeLeft);
            }

            this.countdownTimer = this.scene.time.addEvent({
                delay: 1000,
                callback: () => {
                    timeLeft--;
                    this.debug.logEvent('Wave', 'Countdown tick', { timeLeft });

                    if (this.callbacks) {
                        this.callbacks.onCountdownTick(timeLeft);
                    }

                    if (timeLeft <= 0) {
                        this.debug.logEvent('Wave', 'Countdown complete');
                        if (this.callbacks) {
                            this.callbacks.onWaveComplete();
                        }
                        this.startNewWave();
                    }
                },
                repeat: this.WAVE_COUNTDOWN - 1
            });
        }
    }

    checkWaveComplete(): boolean {
        return this.waveState === 'in progress' && this.enemies.every(enemy => !enemy.isAlive());
    }

    getEnemies(): Enemy[] {
        return this.enemies;
    }

    setEnemies(enemies: Enemy[]): void {
        this.enemies = enemies;
    }

    getCurrentWave(): number {
        return this.currentWave;
    }
}
