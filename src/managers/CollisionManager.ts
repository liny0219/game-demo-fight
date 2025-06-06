import { Scene } from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Debug } from '../utils/Debug';

interface CollisionCallbacks {
    onEnemyDeath: (x: number, y: number) => void;
    onPlayerDeath: () => void;
}

export class CollisionManager {
    private scene: Scene;
    private player: Player;
    private debug: Debug;
    private callbacks?: CollisionCallbacks;
    private currentWave: number = 0;
    private readonly ENEMY_DAMAGE: number = 10;
    private readonly PLAYER_DAMAGE: number = 10;
    private readonly PROJECTILE_DAMAGE: number = 20;

    constructor(scene: Scene, player: Player, debug: Debug) {
        this.scene = scene;
        this.player = player;
        this.debug = debug;
    }

    init(callbacks: CollisionCallbacks): void {
        this.callbacks = callbacks;
    }

    setupEnemyCollisions(enemy: Enemy): void {
        // 设置敌人与玩家的碰撞
        this.scene.physics.add.overlap(
            enemy.getSprite(),
            this.player.getSprite(),
            () => {
                // 如果玩家处于无敌状态，不造成伤害
                if (this.player.isPlayerInvincible()) return;

                // 玩家受到伤害，并传递敌人位置用于击退效果
                this.player.takeDamage(
                    this.ENEMY_DAMAGE,
                    enemy.getSprite().x,
                    enemy.getSprite().y
                );
                this.debug.set('lastDamage', this.ENEMY_DAMAGE);

                // 敌人被击退
                enemy.knockback(this.player.getSprite().x, this.player.getSprite().y);

                if (this.player.isPlayerDead() && this.callbacks) {
                    this.callbacks.onPlayerDeath();
                }
            }
        );
    }

    checkAttackCollisions(enemies: Enemy[]): void {
        const attackBox = this.player.getAttackBox();
        if (!attackBox) return;

        enemies.forEach(enemy => {
            if (!enemy.isAlive()) return;

            const enemySprite = enemy.getSprite();
            const bounds = attackBox.getBounds();

            if (Phaser.Geom.Rectangle.Overlaps(bounds, enemySprite.getBounds())) {
                enemy.takeDamage(this.PLAYER_DAMAGE);
                this.debug.set('lastDamage', this.PLAYER_DAMAGE);

                // 敌人被击退
                enemy.knockback(this.player.getSprite().x, this.player.getSprite().y, 200);

                if (!enemy.isAlive() && this.callbacks) {
                    this.callbacks.onEnemyDeath(enemySprite.x, enemySprite.y);
                }
            }
        });
    }

    checkProjectileCollisions(enemies: Enemy[]): void {
        const projectiles = this.player.getProjectiles();

        projectiles.forEach(projectile => {
            enemies.forEach(enemy => {
                if (!enemy.isAlive()) return;

                const enemySprite = enemy.getSprite();
                if (this.scene.physics.overlap(projectile, enemySprite)) {
                    enemy.takeDamage(this.PROJECTILE_DAMAGE);
                    this.debug.set('lastDamage', this.PROJECTILE_DAMAGE);
                    
                    // 敌人被击退
                    enemy.knockback(projectile.x, projectile.y, 150);
                    
                    // 添加投射物命中效果
                    this.scene.add.circle(
                        projectile.x,
                        projectile.y,
                        10,
                        0xffff00,
                        0.7
                    ).setDepth(5);
                    
                    // 添加命中动画
                    this.scene.tweens.add({
                        targets: projectile,
                        alpha: 0,
                        scale: 1.5,
                        duration: 100,
                        onComplete: () => projectile.destroy()
                    });

                    if (!enemy.isAlive() && this.callbacks) {
                        this.callbacks.onEnemyDeath(enemySprite.x, enemySprite.y);
                    }
                }
            });
        });
    }

    setCurrentWave(wave: number): void {
        this.currentWave = wave;
    }
}
