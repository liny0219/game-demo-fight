// 游戏中使用的枚举和类型定义

export enum GameState {
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over'
}

export interface Vector2 {
    x: number;
    y: number;
}

export interface GameData {
    score: number;
    wave: number;
    level?: number;
}

export interface WaveConfig {
    enemyCount: number;
    enemyHealth: number;
    spawnDelay: number;
}

export interface PlayerStats {
    health: number;
    maxHealth: number;
    attackDamage: number;
    movementSpeed: number;
    skillCooldown: number;
}

export interface EnemyStats {
    health: number;
    maxHealth: number;
    attackDamage: number;
    movementSpeed: number;
    attackRange: number;
}

// ECS 相关类型
export interface ComponentClass<T> {
    new (...args: any[]): T;
}

export interface SystemInterface {
    update(deltaTime: number): void;
    enabled: boolean;
    setEnabled(enabled: boolean): void;
    destroy?(): void;
} 