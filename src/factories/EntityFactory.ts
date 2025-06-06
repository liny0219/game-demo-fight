import 'phaser';
import { World } from '../ecs/World';
import { Entity } from '../ecs/Entity';
import { TransformComponent } from '../components/TransformComponent';
import { SpriteComponent } from '../components/SpriteComponent';
import { VelocityComponent } from '../components/VelocityComponent';
import { HealthComponent } from '../components/HealthComponent';
import { HealthBarComponent } from '../components/HealthBarComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { ProjectileComponent } from '../components/ProjectileComponent';

export class EntityFactory {
    private world: World;
    private scene: Phaser.Scene;

    constructor(world: World, scene: Phaser.Scene) {
        this.world = world;
        this.scene = scene;
    }

    createPlayer(x: number, y: number): Entity {
        const entity = this.world.createEntity();

        // 添加基础组件
        entity.addComponent(new TransformComponent(x, y));
        entity.addComponent(new SpriteComponent(this.scene, x, y, 'player'));
        entity.addComponent(new VelocityComponent(0, 0, 200));
        entity.addComponent(new HealthComponent(100));
        entity.addComponent(new HealthBarComponent(this.scene, 50, 6, -25, 100));
        entity.addComponent(new PlayerComponent());

        // 设置精灵属性
        const sprite = entity.getComponent(SpriteComponent)!;
        sprite.setSize(32, 32);

        return entity;
    }

    createEnemy(x: number, y: number, health: number = 200): Entity {
        const entity = this.world.createEntity();

        // 添加基础组件
        entity.addComponent(new TransformComponent(x, y));
        entity.addComponent(new SpriteComponent(this.scene, x, y, 'enemy'));
        entity.addComponent(new VelocityComponent(0, 0, 100));
        
        // 敌人的健康组件 - 没有无敌帧机制
        const enemyHealth = new HealthComponent(health);
        // 确保敌人永远不会有无敌时间
        enemyHealth.isInvincible = false;
        enemyHealth.invincibleTime = 0;
        entity.addComponent(enemyHealth);
        
        entity.addComponent(new HealthBarComponent(this.scene, 32, 4, -20, 100));
        entity.addComponent(new EnemyComponent());

        // 设置精灵属性
        const sprite = entity.getComponent(SpriteComponent)!;
        sprite.setSize(32, 32);

        return entity;
    }

    createProjectile(x: number, y: number, vx: number, vy: number): Entity {
        const entity = this.world.createEntity();

        // 添加基础组件
        entity.addComponent(new TransformComponent(x, y));
        entity.addComponent(new SpriteComponent(this.scene, x, y, 'projectile'));
        entity.addComponent(new VelocityComponent(vx, vy, 400));
        entity.addComponent(new ProjectileComponent(30, 3000)); // 30伤害，3秒生命周期

        // 设置精灵属性
        const sprite = entity.getComponent(SpriteComponent)!;
        sprite.setSize(8, 8);
        sprite.setDepth(1);

        return entity;
    }

    createAttackBox(x: number, y: number, width: number = 50, height: number = 50): Entity {
        const entity = this.world.createEntity();

        // 添加基础组件
        entity.addComponent(new TransformComponent(x, y));
        
        // 创建一个临时的可视化攻击框（调试用）
        const attackBox = this.scene.add.rectangle(x, y, width, height, 0xff0000, 0.3);
        attackBox.setDepth(2);

        // 设置销毁定时器
        this.scene.time.delayedCall(200, () => {
            attackBox.destroy();
            this.world.removeEntity(entity);
        });

        return entity;
    }
} 