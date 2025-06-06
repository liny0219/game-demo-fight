import { Scene } from 'phaser';
import { Player } from '../entities/Player';
import { Logger } from '../utils/Logger';
import { Debug } from '../utils/Debug';
import { WaveManager } from '../managers/WaveManager';
import { UIManager } from '../managers/UIManager';
import { CollisionManager } from '../managers/CollisionManager';
import { SoundManager } from '../managers/SoundManager';
import { AssetManager } from '../managers/AssetManager';

export class MainScene extends Scene {
    private player!: Player;
    private logger: Logger;
    private debug: Debug;
    private waveManager!: WaveManager;
    private uiManager!: UIManager;
    private collisionManager!: CollisionManager;
    private soundManager!: SoundManager;
    private assetManager!: AssetManager;
    private isGameOver: boolean = false;

    constructor() {
        super({ key: 'MainScene' });
        this.logger = Logger.getInstance();
        this.debug = Debug.getInstance();
    }

    init(): void {
        // 重置场景状态
        this.isGameOver = false;
    }

    preload(): void {
        // 初始化资源管理器并加载资源
        this.assetManager = new AssetManager(this);
        this.assetManager.preloadAssets();

        // 初始化音频管理器
        this.soundManager = new SoundManager(this, this.debug);

        // 确保资源加载完成
        this.load.on('complete', () => {
            this.debug.logEvent('Assets', 'All assets loaded');
        });

        this.load.on('loaderror', (file: any) => {
            this.debug.logEvent('Assets', 'Load error', { file: file.key });
            // 如果资源加载失败，创建默认资源
            this.assetManager.createDefaultAssets();
        });
    }

    create(): void {
        this.logger.clear();
        this.debug.clear();
        this.logger.log('Scene', 'MainScene created');
        this.debug.init(this);

        // 创建默认资源（如果需要）
        this.assetManager.createDefaultAssets();

        // 创建玩家
        this.player = new Player(this, this.cameras.main.centerX, this.cameras.main.centerY);

        // 初始化管理器
        this.initializeManagers();

        // 开始第一波
        this.waveManager.startNewWave();

        // 添加场景暂停/恢复处理
        this.events.on('pause', () => {
            this.debug.logEvent('Scene', 'Game paused');
        });

        this.events.on('resume', () => {
            this.debug.logEvent('Scene', 'Game resumed');
        });
    }

    private initializeManagers(): void {
        // 初始化UI管理器
        this.uiManager = new UIManager(this, this.debug, this.soundManager);

        // 初始化碰撞管理器
        this.collisionManager = new CollisionManager(this, this.player, this.debug);
        this.collisionManager.init({
            onEnemyDeath: this.handleEnemyDeath.bind(this),
            onPlayerDeath: this.handleGameOver.bind(this)
        });

        // 初始化波次管理器，传递玩家的sprite而不是Player实例
        this.waveManager = new WaveManager(this, this.player.getSprite(), this.debug);
        this.waveManager.init({
            onWaveComplete: () => {
                this.uiManager.hideNextWaveCountdown();
            },
            onEnemySpawn: (enemy) => {
                this.collisionManager.setupEnemyCollisions(enemy);
            },
            onWaveStart: (wave) => {
                this.uiManager.updateWave(wave);
                this.uiManager.showWaveStartAnimation(wave);
                this.collisionManager.setCurrentWave(wave);
            },
            onCountdownTick: (timeLeft) => {
                this.uiManager.showNextWaveCountdown(timeLeft);
            }
        });
    }

    update(): void {
        if (this.isGameOver) return;

        this.player.update();
        
        // 更新敌人
        const enemies = this.waveManager.getEnemies();
        const aliveEnemies = enemies.filter(enemy => enemy.isAlive());
        aliveEnemies.forEach(enemy => enemy.update());
        this.waveManager.setEnemies(aliveEnemies);

        // 更新技能冷却显示
        const cooldown = Math.ceil(this.player.getSkillCooldown() / 1000);
        this.uiManager.updateSkillCooldown(cooldown);

        // 检查碰撞
        this.collisionManager.checkAttackCollisions(aliveEnemies);
        this.collisionManager.checkProjectileCollisions(aliveEnemies);

        // 检查是否需要开始新一波
        if (this.waveManager.checkWaveComplete()) {
            this.debug.logEvent('Wave', 'All enemies defeated');
            this.waveManager.startNextWaveCountdown();
        }
    }

    private handleEnemyDeath(x: number, y: number): void {
        // 根据波数增加得分
        const currentWave = this.waveManager.getCurrentWave();
        const scoreMultiplier = 1 + Math.log(currentWave) * 0.2;
        const score = Math.ceil(100 * scoreMultiplier);
        this.uiManager.updateScore(this.uiManager.getScore() + score);
        this.debug.logEvent('Score', 'Enemy defeated', { score, total: this.uiManager.getScore() });
    }

    private handleGameOver(): void {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        this.debug.logEvent('Game', 'Game Over', { 
            score: this.uiManager.getScore(), 
            wave: this.waveManager.getCurrentWave() 
        });
        
        // 切换到游戏结束场景
        this.scene.start('GameOverScene', {
            score: this.uiManager.getScore(),
            wave: this.waveManager.getCurrentWave()
        });
    }

    shutdown(): void {
        // 清理场景资源
        this.events.off('pause');
        this.events.off('resume');
        this.debug.destroy();
    }
}
