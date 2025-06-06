import 'phaser';
import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { MovementSystem } from '../systems/MovementSystem';
import { PlayerInputSystem } from '../systems/PlayerInputSystem';
import { EnemyAISystem } from '../systems/EnemyAISystem';
import { EnemyVisualSystem } from '../systems/EnemyVisualSystem';
import { HealthBarSystem } from '../systems/HealthBarSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ComponentUpdateSystem } from '../systems/ComponentUpdateSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { EntityFactory } from '../factories/EntityFactory';
import { PlayerComponent } from '../components/PlayerComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { HealthComponent } from '../components/HealthComponent';
import { TransformComponent } from '../components/TransformComponent';
import { VelocityComponent } from '../components/VelocityComponent';

export class MainScene extends Phaser.Scene {
    private world!: World;
    private entityFactory!: EntityFactory;
    private collisionSystem!: CollisionSystem;
    private player!: Entity;
    private enemies: Entity[] = [];
    private isGameOver: boolean = false;
    private currentWave: number = 1;
    private score: number = 0;
    private isWaveTransition: boolean = false;

    // UI元素
    private scoreText!: Phaser.GameObjects.Text;
    private waveText!: Phaser.GameObjects.Text;
    private skillCooldownText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'MainScene' });
    }

    init(): void {
        this.isGameOver = false;
        this.currentWave = 1;
        this.score = 0;
        this.enemies = [];
        this.isWaveTransition = false;
    }

    preload(): void {
        // 创建默认资源
        this.createDefaultAssets();
    }

    create(): void {
        // 初始化ECS世界
        this.world = new World(this);
        this.entityFactory = new EntityFactory(this.world, this);

        // 添加系统
        this.world.addSystem(new ComponentUpdateSystem(this.world));
        this.world.addSystem(new MovementSystem(this.world));
        this.world.addSystem(new PlayerInputSystem(this.world, this));
        this.world.addSystem(new EnemyAISystem(this.world));
        this.world.addSystem(new EnemyVisualSystem(this.world)); // 敌人视觉特效系统
        this.collisionSystem = new CollisionSystem(this.world, this);
        this.world.addSystem(this.collisionSystem);
        this.world.addSystem(new HealthBarSystem(this.world));
        this.world.addSystem(new ProjectileSystem(this.world));

        // 创建玩家
        this.player = this.entityFactory.createPlayer(
            this.cameras.main.centerX,
            this.cameras.main.centerY
        );

        // 创建UI
        this.createUI();

        // 设置事件监听
        this.setupEventListeners();

        // 开始第一波
        this.startWave();
        
        // 显示第一波开始信息
        this.showWaveStartMessage();

        console.log('ECS 主场景创建完成');
    }

    update(time: number, delta: number): void {
        if (this.isGameOver) return;

        // 更新ECS世界
        this.world.update(delta);

        // 检查波次状态
        this.checkWaveStatus();

        // 更新UI
        this.updateUI();
    }

    private createDefaultAssets(): void {
        // 创建玩家贴图
        if (!this.textures.exists('player')) {
            this.add.graphics()
                .fillStyle(0x00ff00)
                .fillRect(0, 0, 32, 32)
                .generateTexture('player', 32, 32)
                .destroy();
        }

        // 创建敌人贴图
        if (!this.textures.exists('enemy')) {
            this.add.graphics()
                .fillStyle(0xff0000)
                .fillRect(0, 0, 32, 32)
                .generateTexture('enemy', 32, 32)
                .destroy();
        }

        // 创建弹药贴图
        if (!this.textures.exists('projectile')) {
            this.add.graphics()
                .fillStyle(0xffff00)
                .fillCircle(4, 4, 4)
                .generateTexture('projectile', 8, 8)
                .destroy();
        }
    }

    private createUI(): void {
        // 得分
        this.scoreText = this.add.text(10, 10, '得分: 0', {
            fontSize: '24px',
            color: '#ffffff'
        }).setDepth(100);

        // 波数
        this.waveText = this.add.text(10, 40, '波数: 1', {
            fontSize: '20px',
            color: '#ffffff'
        }).setDepth(100);

        // 技能冷却
        this.skillCooldownText = this.add.text(10, 70, '', {
            fontSize: '16px',
            color: '#ffffff'
        }).setDepth(100);
    }

    private setupEventListeners(): void {
        // 玩家攻击
        this.events.on('player-attack', (playerEntity: Entity) => {
            this.handlePlayerAttack(playerEntity);
        });

        // 玩家技能
        this.events.on('player-skill', (playerEntity: Entity) => {
            this.handlePlayerSkill(playerEntity);
        });

        // 敌人死亡
        this.events.on('enemy-death', (enemyEntity: Entity) => {
            this.handleEnemyDeath(enemyEntity);
        });

        // 玩家死亡
        this.events.on('player-death', (playerEntity: Entity) => {
            this.gameOver();
        });
    }

    private handlePlayerAttack(playerEntity: Entity): void {
        const player = playerEntity.getComponent(PlayerComponent)!;
        const transform = playerEntity.getComponent(TransformComponent)!;

        const offset = 20;
        const attackX = transform.x + player.lastMoveDirection.x * offset;
        const attackY = transform.y + player.lastMoveDirection.y * offset;

        // 创建攻击框
        this.entityFactory.createAttackBox(attackX, attackY);

        // 检查攻击碰撞
        const hitEnemies = this.collisionSystem.checkAttackCollisions(attackX, attackY, 50, 50);
        
        // 处理击中的敌人
        for (const enemy of hitEnemies) {
            const enemyHealth = enemy.getComponent(HealthComponent);
            if (enemyHealth && !enemyHealth.isAlive()) {
                this.handleEnemyDeath(enemy);
            }
        }
    }

    private handlePlayerSkill(playerEntity: Entity): void {
        const player = playerEntity.getComponent(PlayerComponent)!;
        const transform = playerEntity.getComponent(TransformComponent)!;

        // 创建8个方向的弹药
        const directions = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, 
            { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 0.707, y: 0.707 }, { x: -0.707, y: 0.707 },
            { x: 0.707, y: -0.707 }, { x: -0.707, y: -0.707 }
        ];

        for (const dir of directions) {
            this.entityFactory.createProjectile(
                transform.x,
                transform.y,
                dir.x * player.projectileSpeed,
                dir.y * player.projectileSpeed
            );
        }
    }

    private handleEnemyDeath(enemyEntity: Entity): void {
        // 从敌人列表中移除
        const index = this.enemies.indexOf(enemyEntity);
        if (index !== -1) {
            this.enemies.splice(index, 1);
            
            // 获取敌人位置用于特效
            const transform = enemyEntity.getComponent(TransformComponent);
            if (transform) {
                // 添加得分
                const currentWave = this.currentWave;
                const scoreMultiplier = 1 + Math.log(currentWave) * 0.2;
                const score = Math.ceil(100 * scoreMultiplier);
                this.addScore(score);
                
                console.log(`敌人死亡，获得 ${score} 分`);
            }
            
            // 从世界中移除实体
            this.world.removeEntity(enemyEntity);
        }
    }



    private startWave(): void {
        const enemyCount = Math.min(3 + this.currentWave, 10);
        
        for (let i = 0; i < enemyCount; i++) {
            // 在屏幕边缘随机生成敌人
            const edge = Math.floor(Math.random() * 4);
            let x, y;

            switch (edge) {
                case 0: // 上边
                    x = Math.random() * this.cameras.main.width;
                    y = -50;
                    break;
                case 1: // 右边
                    x = this.cameras.main.width + 50;
                    y = Math.random() * this.cameras.main.height;
                    break;
                case 2: // 下边
                    x = Math.random() * this.cameras.main.width;
                    y = this.cameras.main.height + 50;
                    break;
                default: // 左边
                    x = -50;
                    y = Math.random() * this.cameras.main.height;
                    break;
            }

            const enemyHealth = 100 + (this.currentWave * 50);
            const enemy = this.entityFactory.createEnemy(x, y, enemyHealth);
            this.enemies.push(enemy);
        }

        // 重置波次转换状态
        this.isWaveTransition = false;
        
        // 如果不是第一波，显示波次开始信息
        if (this.currentWave > 1) {
            this.showWaveStartMessage();
        }
        
        console.log(`第 ${this.currentWave} 波开始，敌人数量: ${enemyCount}`);
    }

    private showWaveCompleteMessage(): void {
        // 显示波次完成的提示信息
        const message = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `第 ${this.currentWave - 1} 波完成！\n\n准备第 ${this.currentWave} 波...`,
            {
                fontSize: '32px',
                color: '#00ff00',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);

        // 2秒后移除消息
        this.time.delayedCall(2000, () => {
            message.destroy();
        });
    }

    private showWaveStartMessage(): void {
        // 显示波次开始的提示信息
        const message = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `第 ${this.currentWave} 波开始！`,
            {
                fontSize: '32px',
                color: '#ffff00',
                fontStyle: 'bold',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);

        // 2秒后移除消息
        this.time.delayedCall(2000, () => {
            message.destroy();
        });
    }

    private checkWaveStatus(): void {
        // 检查是否所有敌人都被消灭，且不在波次转换状态
        if (this.enemies.length === 0 && !this.isWaveTransition) {
            this.isWaveTransition = true;
            this.currentWave++;
            
            // 显示波次完成信息
            this.showWaveCompleteMessage();
            
            this.time.delayedCall(2000, () => {
                this.startWave();
            });
        }
    }



    private addScore(points: number): void {
        this.score += points;
    }

    private updateUI(): void {
        this.scoreText.setText(`得分: ${this.score}`);
        this.waveText.setText(`波数: ${this.currentWave}`);

        // 更新技能冷却显示
        const playerComp = this.player.getComponent(PlayerComponent);
        if (playerComp) {
            const cooldown = Math.ceil(playerComp.skillCooldown / 1000);
            if (cooldown > 0) {
                this.skillCooldownText.setText(`技能冷却: ${cooldown}s`);
            } else {
                this.skillCooldownText.setText('技能就绪');
            }
        }
    }

    private gameOver(): void {
        this.isGameOver = true;
        console.log(`游戏结束！得分: ${this.score}, 波数: ${this.currentWave}`);
        
        // 切换到游戏结束场景
        this.scene.start('GameOverScene', {
            score: this.score,
            wave: this.currentWave
        });
    }

    shutdown(): void {
        this.world.clear();
        this.events.off('player-attack');
        this.events.off('player-skill');
        this.events.off('enemy-attack');
    }
} 