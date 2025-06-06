# ECS 架构游戏

这是一个将 OOP 架构的 Phaser.js 游戏重构为 ECS (Entity Component System) 架构的项目。

## 项目结构

```
src/
├── ecs/                    # ECS 核心框架
│   ├── Entity.ts          # 实体类
│   ├── Component.ts       # 组件基类
│   ├── System.ts          # 系统基类
│   └── World.ts           # 世界管理器
├── components/            # 游戏组件
│   ├── TransformComponent.ts      # 位置变换组件
│   ├── SpriteComponent.ts         # 精灵渲染组件
│   ├── VelocityComponent.ts       # 速度组件
│   ├── HealthComponent.ts         # 健康值组件
│   ├── HealthBarComponent.ts      # 血条显示组件
│   ├── PlayerComponent.ts         # 玩家标记组件
│   └── EnemyComponent.ts          # 敌人标记组件
├── systems/               # 游戏系统
│   ├── MovementSystem.ts          # 移动系统
│   ├── PlayerInputSystem.ts       # 玩家输入系统
│   ├── EnemyAISystem.ts           # 敌人AI系统
│   └── HealthBarSystem.ts         # 血条渲染系统
├── factories/             # 实体工厂
│   └── EntityFactory.ts          # 实体创建工厂
├── scenes/                # 游戏场景
│   ├── MainScene.ts               # 主游戏场景
│   └── GameOverScene.ts           # 游戏结束场景
├── config/                # 配置文件
│   └── gameConfig.ts              # 游戏配置
├── types/                 # 类型定义
│   └── index.ts                   # 类型定义文件
├── game.ts                # 游戏启动文件
└── index.ts               # 入口文件
```

## ECS 架构说明

### 实体 (Entity)
- 实体是游戏中的基本对象，只包含 ID 和组件集合
- 玩家、敌人、弹药都是实体
- 实体本身没有逻辑，只是组件的容器

### 组件 (Component)
- 组件只包含数据，不包含逻辑
- `TransformComponent`: 位置、旋转、缩放信息
- `SpriteComponent`: 精灵渲染相关数据
- `VelocityComponent`: 速度和移动相关数据
- `HealthComponent`: 健康值和生存状态
- `PlayerComponent`: 玩家特有的属性（技能冷却等）
- `EnemyComponent`: 敌人特有的属性（攻击力、AI状态等）

### 系统 (System)
- 系统包含游戏逻辑，处理特定组件组合的实体
- `MovementSystem`: 处理所有有移动能力的实体
- `PlayerInputSystem`: 处理玩家输入和控制
- `EnemyAISystem`: 处理敌人的人工智能行为
- `HealthBarSystem`: 渲染和更新血条显示

### 世界 (World)
- 管理所有实体和系统
- 提供实体查询功能
- 协调系统的更新循环

## 与 OOP 版本的主要区别

### 原 OOP 架构问题：
1. **紧耦合**: Player、Enemy 类包含大量职责，难以扩展
2. **代码重复**: 血条、移动、碰撞检测等逻辑在多个类中重复
3. **难以测试**: 大型类难以进行单元测试
4. **修改困难**: 添加新功能需要修改多个类

### ECS 架构优势：
1. **松耦合**: 组件和系统职责单一，易于理解和维护
2. **代码复用**: 系统可以处理任何有相应组件的实体
3. **易于扩展**: 添加新功能只需添加新组件和系统
4. **便于测试**: 每个组件和系统都可以独立测试
5. **性能优化**: 可以轻松实现数据局部性和批量处理

## 游戏功能

- **玩家控制**: 键盘 WASD/方向键移动，空格攻击，Shift 技能
- **触摸控制**: 触摸移动，点击攻击，长按技能
- **波次系统**: 逐波增加敌人数量和难度
- **血条系统**: 支持多管血量显示
- **碰撞检测**: 攻击和移动碰撞
- **得分系统**: 击杀敌人获得分数

## 如何运行

1. 安装依赖：`npm install`
2. 启动开发服务器：`npm start`
3. 在浏览器中打开游戏

## 技术栈

- **Phaser.js**: 2D 游戏引擎
- **TypeScript**: 类型安全的 JavaScript
- **ECS 架构**: 实体组件系统设计模式
- **Webpack**: 模块打包工具

## 扩展示例

添加新功能非常简单：

### 添加武器系统
1. 创建 `WeaponComponent` 组件
2. 创建 `WeaponSystem` 系统
3. 在 `EntityFactory` 中为实体添加武器组件

### 添加音效系统
1. 创建 `AudioComponent` 组件
2. 创建 `AudioSystem` 系统
3. 在需要音效的地方添加音频组件

这种架构使得游戏功能的添加和修改变得非常灵活和高效。 