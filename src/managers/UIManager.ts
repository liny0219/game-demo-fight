import { Scene } from 'phaser';
import { Debug } from '../utils/Debug';
import { SoundManager } from './SoundManager';
import { ScorePopup } from '../entities/ScorePopup';

export class UIManager {
    private scene: Scene;
    private debug: Debug;
    private soundManager: SoundManager;
    private score: number = 0;
    private scoreText: Phaser.GameObjects.Text;
    private waveText: Phaser.GameObjects.Text;
    private countdownText?: Phaser.GameObjects.Text;
    private skillCooldownText: Phaser.GameObjects.Text;
    private waveStartText?: Phaser.GameObjects.Text;
    private debugToggle?: Phaser.GameObjects.Container;

    constructor(scene: Scene, debug: Debug, soundManager: SoundManager) {
        this.scene = scene;
        this.debug = debug;
        this.soundManager = soundManager;

        // 创建分数显示
        this.scoreText = scene.add.text(10, 10, 'Score: 0', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        // 创建波数显示
        this.waveText = scene.add.text(10, 40, 'Wave: 1', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        // 创建技能冷却显示
        this.skillCooldownText = scene.add.text(10, scene.cameras.main.height - 40, '技能就绪!', {
            fontSize: '20px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        // 创建调试开关按钮
        this.createDebugToggle();
    }

    private createDebugToggle(): void {
        // 创建一个容器来放置按钮和背景
        this.debugToggle = this.scene.add.container(this.scene.cameras.main.width - 60, 30);

        // 创建按钮背景
        const background = this.scene.add.rectangle(0, 0, 100, 40, 0x000000, 0.5)
            .setOrigin(0.5);

        // 创建按钮文本
        const text = this.scene.add.text(0, 0, '调试: 关', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 将背景和文本添加到容器
        this.debugToggle.add([background, text]);

        // 使容器可交互
        background.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (this.debug.isEnabled()) {
                    this.debug.disable();
                    text.setText('调试: 关');
                } else {
                    this.debug.enable();
                    text.setText('调试: 开');
                }
            })
            .on('pointerover', () => {
                background.setFillStyle(0x333333, 0.7);
            })
            .on('pointerout', () => {
                background.setFillStyle(0x000000, 0.5);
            });
    }

    updateScore(score: number): void {
        this.score = score;
        this.scoreText.setText(`Score: ${score}`);
    }

    updateWave(wave: number): void {
        this.waveText.setText(`Wave: ${wave}`);
    }

    showWaveStartAnimation(wave: number): void {
        // 移除之前的文本（如果存在）
        if (this.waveStartText) {
            this.waveStartText.destroy();
        }

        // 创建新的波次开始文本
        this.waveStartText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            80, // 调整位置，避免遮挡
            `第 ${wave} 波`,
            {
                fontSize: '32px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                backgroundColor: '#00000066',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setAlpha(0);

        // 添加动画效果
        this.scene.tweens.add({
            targets: this.waveStartText,
            alpha: { from: 0, to: 1 },
            y: { from: 60, to: 80 },
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.scene.time.delayedCall(1500, () => {
                    if (this.waveStartText) {
                        this.scene.tweens.add({
                            targets: this.waveStartText,
                            alpha: 0,
                            y: 60,
                            duration: 500,
                            ease: 'Power2',
                            onComplete: () => {
                                if (this.waveStartText) {
                                    this.waveStartText.destroy();
                                    this.waveStartText = undefined;
                                }
                            }
                        });
                    }
                });
            }
        });

        // 播放波次开始音效
        this.soundManager.playSound('wave_start', { volume: 0.5 });
    }

    showNextWaveCountdown(timeLeft: number): void {
        // 移除之前的倒计时文本（如果存在）
        if (this.countdownText) {
            this.countdownText.destroy();
        }

        // 创建新的倒计时文本
        this.countdownText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            80,
            `下一波敌人将在 ${timeLeft} 秒后出现`,
            {
                fontSize: '24px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: '#00000066',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setAlpha(0.8);

        // 播放倒计时音效
        this.soundManager.playSound('countdown', { volume: 0.3 });
    }

    hideNextWaveCountdown(): void {
        if (this.countdownText) {
            this.countdownText.destroy();
            this.countdownText = undefined;
        }
    }

    updateSkillCooldown(cooldown: number): void {
        if (cooldown > 0) {
            this.skillCooldownText.setText(`技能冷却: ${cooldown}秒`);
            this.skillCooldownText.setColor('#ff0000');
        } else {
            this.skillCooldownText.setText('技能就绪!');
            this.skillCooldownText.setColor('#00ffff');
        }
    }

    getScore(): number {
        return this.score;
    }
}
