// ECS 核心
export { Entity } from './ecs/Entity';
export { Component } from './ecs/Component';
export { System } from './ecs/System';
export { World } from './ecs/World';

// 组件
export { TransformComponent } from './components/TransformComponent';
export { SpriteComponent } from './components/SpriteComponent';
export { VelocityComponent } from './components/VelocityComponent';
export { HealthComponent } from './components/HealthComponent';
export { HealthBarComponent } from './components/HealthBarComponent';
export { PlayerComponent } from './components/PlayerComponent';
export { EnemyComponent } from './components/EnemyComponent';

// 系统
export { MovementSystem } from './systems/MovementSystem';
export { PlayerInputSystem } from './systems/PlayerInputSystem';
export { EnemyAISystem } from './systems/EnemyAISystem';
export { HealthBarSystem } from './systems/HealthBarSystem';
export { CollisionSystem } from './systems/CollisionSystem';
export { ComponentUpdateSystem } from './systems/ComponentUpdateSystem';

// 工厂
export { EntityFactory } from './factories/EntityFactory';

// 场景
export { MainScene } from './scenes/MainScene';
export { GameOverScene } from './scenes/GameOverScene';

// 配置
export { default as gameConfig } from './config/gameConfig';

// 类型
export * from './types';

// 游戏启动
import './game';