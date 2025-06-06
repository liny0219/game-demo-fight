# 游戏架构设计文档

## 概述

本文档详细描述了基于Phaser.js和ECS（Entity-Component-System）架构的2D动作游戏的完整设计方案。游戏包含玩家控制、敌人AI、碰撞检测、攻击系统、视觉效果等核心功能模块。

## 目录

1. [整体ECS架构](#1-整体ecs架构)
2. [游戏主循环时序](#2-游戏主循环时序)
3. [碰撞检测系统](#3-碰撞检测系统)
4. [攻击判定系统](#4-攻击判定系统)
5. [敌人AI和视觉系统](#5-敌人ai和视觉系统)
6. [边界检测和移动系统](#6-边界检测和移动系统)
7. [数据流和系统依赖](#7-数据流和系统依赖)
8. [游戏状态机](#8-游戏状态机)
9. [技术规格](#9-技术规格)

---

## 1. 整体ECS架构

```mermaid
graph TB
    subgraph "ECS架构"
        World["🌍 World<br/>世界管理器"]
        
        subgraph "实体层 (Entities)"
            Player["👤 Player Entity<br/>玩家实体"]
            Enemy["👹 Enemy Entity<br/>敌人实体"]
            Projectile["🚀 Projectile Entity<br/>投射物实体"]
            AttackBox["⚔️ AttackBox Entity<br/>攻击框实体"]
        end
        
        subgraph "组件层 (Components)"
            Transform["📍 TransformComponent<br/>位置组件"]
            Velocity["🏃 VelocityComponent<br/>速度组件"]
            Sprite["🎨 SpriteComponent<br/>精灵组件"]
            Health["❤️ HealthComponent<br/>生命值组件"]
            PlayerComp["🎮 PlayerComponent<br/>玩家组件"]
            EnemyComp["👾 EnemyComponent<br/>敌人组件"]
            ProjectileComp["💥 ProjectileComponent<br/>投射物组件"]
            HealthBar["📊 HealthBarComponent<br/>血条组件"]
        end
        
        subgraph "系统层 (Systems)"
            InputSys["🎯 PlayerInputSystem<br/>玩家输入系统"]
            MoveSys["🚶 MovementSystem<br/>移动系统"]
            AISys["🤖 EnemyAISystem<br/>敌人AI系统"]
            VisualSys["✨ EnemyVisualSystem<br/>敌人视觉系统"]
            CollisionSys["💥 CollisionSystem<br/>碰撞系统"]
            ProjectileSys["🚀 ProjectileSystem<br/>投射物系统"]
            HealthSys["📊 HealthBarSystem<br/>血条系统"]
            UpdateSys["🔄 ComponentUpdateSystem<br/>组件更新系统"]
        end
    end
    
    World --> Player
    World --> Enemy
    World --> Projectile
    World --> AttackBox
    
    Player --> Transform
    Player --> Velocity
    Player --> Sprite
    Player --> Health
    Player --> PlayerComp
    
    Enemy --> Transform
    Enemy --> Velocity
    Enemy --> Sprite
    Enemy --> Health
    Enemy --> EnemyComp
    Enemy --> HealthBar
    
    Projectile --> Transform
    Projectile --> Velocity
    Projectile --> Sprite
    Projectile --> ProjectileComp
    
    InputSys --> PlayerComp
    MoveSys --> Transform
    MoveSys --> Velocity
    AISys --> EnemyComp
    VisualSys --> EnemyComp
    CollisionSys --> Health
    ProjectileSys --> ProjectileComp
    HealthSys --> HealthBar
```

### 架构说明

**ECS架构优势**：
- **模块化设计**：每个系统专注单一职责
- **高可扩展性**：添加新功能只需新增组件或系统
- **数据驱动**：组件存储数据，系统处理逻辑
- **性能优化**：系统可以批量处理相同类型的实体

**核心实体类型**：
- `Player Entity`：玩家角色，包含移动、攻击、生命值等功能
- `Enemy Entity`：敌人实体，具有AI追击、弹跳动画、血条显示
- `Projectile Entity`：投射物实体，用于远程攻击
- `AttackBox Entity`：攻击判定框，用于近战攻击范围检测

---

## 2. 游戏主循环时序

```mermaid
sequenceDiagram
    participant Main as 🎮 MainScene
    participant World as 🌍 World
    participant Input as 🎯 InputSystem
    participant Move as 🚶 MovementSystem
    participant AI as 🤖 EnemyAISystem
    participant Visual as ✨ VisualSystem
    participant Collision as 💥 CollisionSystem
    participant Projectile as 🚀 ProjectileSystem
    participant Health as 📊 HealthSystem
    participant Update as 🔄 UpdateSystem
    
    Note over Main: 每帧更新循环 (60 FPS)
    
    Main->>World: update(deltaTime)
    
    Note over World: 按顺序执行所有系统
    
    World->>Input: update(deltaTime)
    Note over Input: 处理键盘/触摸输入<br/>设置玩家速度和攻击
    
    World->>Move: update(deltaTime)
    Note over Move: 更新所有实体位置<br/>应用边界检测
    
    World->>AI: update(deltaTime)
    Note over AI: 敌人追击玩家<br/>设置敌人移动方向
    
    World->>Visual: update(deltaTime)
    Note over Visual: 更新敌人弹跳动画<br/>应用缩放效果
    
    World->>Collision: update(deltaTime)
    Note over Collision: 检测所有碰撞<br/>处理伤害和击退
    
    World->>Projectile: update(deltaTime)
    Note over Projectile: 更新投射物生命周期<br/>边界检测和销毁
    
    World->>Health: update(deltaTime)
    Note over Health: 更新血条显示<br/>同步血量变化
    
    World->>Update: update(deltaTime)
    Note over Update: 更新组件状态<br/>处理冷却时间
```

### 执行顺序说明

**系统执行优先级**：
1. **输入系统**：最先处理用户输入，设置移动和攻击意图
2. **移动系统**：根据速度更新所有实体位置，应用边界检测
3. **AI系统**：敌人根据玩家位置计算追击方向
4. **视觉系统**：更新敌人弹跳动画和视觉效果
5. **碰撞系统**：检测各种碰撞并处理伤害
6. **投射物系统**：管理投射物生命周期和边界检测
7. **血条系统**：同步显示生命值变化
8. **更新系统**：处理冷却时间和其他状态更新

---

## 3. 碰撞检测系统

```mermaid
flowchart TD
    Start["🎯 CollisionSystem.update()"]
    
    subgraph "玩家-敌人碰撞检测"
        GetPlayer["获取玩家实体"]
        GetEnemies["获取所有敌人实体"]
        HasPlayer{"玩家存在?"}
        LoopEnemies["遍历每个敌人"]
        CalcDistance["计算距离<br/>Phaser.Math.Distance.Between()"]
        CheckCollision{"距离 < 30px?"}
        CheckInvincible{"玩家无敌?"}
        ApplyDamage["对玩家造成伤害<br/>设置无敌时间1秒"]
        CreateEffects["创建受伤特效<br/>屏幕震动+光晕护盾"]
        ApplyKnockback["应用击退效果"]
        CheckDeath{"玩家死亡?"}
        PlayerDeath["触发玩家死亡事件"]
    end
    
    subgraph "投射物-敌人碰撞检测"
        GetProjectiles["获取所有投射物"]
        GetEnemies2["获取所有敌人实体"]
        LoopProjectiles["遍历每个投射物"]
        ValidateComponents{"组件完整?"}
        LoopEnemies2["遍历每个敌人"]
        ValidateEnemyComp{"敌人组件完整?"}
        CalcProjDistance["计算投射物-敌人距离"]
        CheckProjCollision{"距离 < 20px?"}
        ApplyProjDamage["对敌人造成伤害<br/>忽略无敌帧"]
        ApplyEnemyKnockback["应用敌人击退"]
        CreateEnemyEffects["创建敌人受伤特效"]
        CreateHitEffect["创建投射物命中特效"]
        MarkProjectile["标记投射物待删除"]
        CheckEnemyDeath{"敌人死亡?"}
        EnemyDeath["触发敌人死亡事件"]
        RemoveProjectiles["批量删除投射物"]
    end
    
    Start --> GetPlayer
    GetPlayer --> HasPlayer
    HasPlayer -->|是| GetEnemies
    HasPlayer -->|否| GetProjectiles
    GetEnemies --> LoopEnemies
    LoopEnemies --> CalcDistance
    CalcDistance --> CheckCollision
    CheckCollision -->|是| CheckInvincible
    CheckCollision -->|否| LoopEnemies
    CheckInvincible -->|否| ApplyDamage
    CheckInvincible -->|是| LoopEnemies
    ApplyDamage --> CreateEffects
    CreateEffects --> ApplyKnockback
    ApplyKnockback --> CheckDeath
    CheckDeath -->|是| PlayerDeath
    CheckDeath -->|否| LoopEnemies
    PlayerDeath --> GetProjectiles
    
    GetProjectiles --> LoopProjectiles
    LoopProjectiles --> ValidateComponents
    ValidateComponents -->|是| LoopEnemies2
    ValidateComponents -->|否| LoopProjectiles
    LoopEnemies2 --> ValidateEnemyComp
    ValidateEnemyComp -->|是| CalcProjDistance
    ValidateEnemyComp -->|否| LoopEnemies2
    CalcProjDistance --> CheckProjCollision
    CheckProjCollision -->|是| ApplyProjDamage
    CheckProjCollision -->|否| LoopEnemies2
    ApplyProjDamage --> ApplyEnemyKnockback
    ApplyEnemyKnockback --> CreateEnemyEffects
    CreateEnemyEffects --> CreateHitEffect
    CreateHitEffect --> MarkProjectile
    MarkProjectile --> CheckEnemyDeath
    CheckEnemyDeath -->|是| EnemyDeath
    CheckEnemyDeath -->|否| LoopProjectiles
    EnemyDeath --> LoopProjectiles
    LoopProjectiles --> RemoveProjectiles
```

### 碰撞检测规格

**碰撞检测参数**：
- **玩家-敌人碰撞**：半径30像素，圆形检测
- **投射物-敌人碰撞**：半径20像素，圆形检测
- **碰撞算法**：使用`Phaser.Math.Distance.Between()`计算欧几里得距离

**伤害机制**：
- **敌人对玩家伤害**：考虑无敌帧，避免连续伤害
- **投射物对敌人伤害**：忽略无敌帧，立即生效
- **无敌时间**：玩家受伤后1秒无敌保护

**特效系统**：
- **玩家受伤**：青色护盾、屏幕震动、红色染色
- **敌人受伤**：橙红色闪烁、透明度变化
- **投射物命中**：爆炸特效、放射性火花

---

## 4. 攻击判定系统

```mermaid
flowchart TD
    subgraph "玩家输入处理"
        InputStart["🎯 PlayerInputSystem"]
        CheckInput{"检测输入"}
        KeyboardAttack["键盘: SPACE"]
        TouchAttack["触摸: 点击"]
        LongPress["长按 > 500ms"]
        SkillCooldown{"技能冷却完毕?"}
        AttackCooldown{"攻击冷却完毕?"}
        TriggerAttack["触发攻击"]
        TriggerSkill["触发技能"]
    end
    
    subgraph "近战攻击流程"
        MeleeStart["🗡️ 近战攻击"]
        GetPlayerPos["获取玩家位置"]
        GetDirection["获取移动方向"]
        CalcAttackPos["计算攻击位置<br/>pos + direction * 20px"]
        CreateAttackBox["创建攻击框实体"]
        CheckMeleeRange["检查攻击范围<br/>半径50px内敌人"]
        ApplyMeleeDamage["造成50点伤害"]
        MeleeKnockback["强力击退效果<br/>力度200"]
        MeleeEffects["创建敌人受伤特效"]
        AttackCooldownSet["设置攻击冷却"]
    end
    
    subgraph "远程技能流程"
        SkillStart["🚀 远程技能"]
        GetPlayerPos2["获取玩家位置"]
        GetDirection2["获取移动方向"]
        CreateProjectile["创建投射物实体"]
        SetProjectileVel["设置投射物速度<br/>400px/s"]
        ProjectileLifetime["设置生命周期3秒"]
        SkillCooldownSet["设置技能冷却5秒"]
    end
    
    subgraph "投射物命中判定"
        ProjUpdate["🎯 ProjectileSystem"]
        UpdateLifetime["更新生命周期"]
        CheckBounds{"超出边界?"}
        CheckExpired{"生命周期结束?"}
        CheckProjHit["检查与敌人碰撞<br/>距离 < 20px"]
        ProjDamage["造成30点伤害"]
        ProjKnockback["击退效果<br/>力度150"]
        ProjEffects["爆炸特效"]
        DestroyProjectile["销毁投射物"]
    end
    
    InputStart --> CheckInput
    CheckInput --> KeyboardAttack
    CheckInput --> TouchAttack
    TouchAttack --> LongPress
    KeyboardAttack --> AttackCooldown
    LongPress --> SkillCooldown
    AttackCooldown -->|是| TriggerAttack
    SkillCooldown -->|是| TriggerSkill
    
    TriggerAttack --> MeleeStart
    MeleeStart --> GetPlayerPos
    GetPlayerPos --> GetDirection
    GetDirection --> CalcAttackPos
    CalcAttackPos --> CreateAttackBox
    CreateAttackBox --> CheckMeleeRange
    CheckMeleeRange --> ApplyMeleeDamage
    ApplyMeleeDamage --> MeleeKnockback
    MeleeKnockback --> MeleeEffects
    MeleeEffects --> AttackCooldownSet
    
    TriggerSkill --> SkillStart
    SkillStart --> GetPlayerPos2
    GetPlayerPos2 --> GetDirection2
    GetDirection2 --> CreateProjectile
    CreateProjectile --> SetProjectileVel
    SetProjectileVel --> ProjectileLifetime
    ProjectileLifetime --> SkillCooldownSet
    
    CreateProjectile --> ProjUpdate
    ProjUpdate --> UpdateLifetime
    UpdateLifetime --> CheckBounds
    CheckBounds -->|是| DestroyProjectile
    UpdateLifetime --> CheckExpired
    CheckExpired -->|是| DestroyProjectile
    UpdateLifetime --> CheckProjHit
    CheckProjHit -->|是| ProjDamage
    ProjDamage --> ProjKnockback
    ProjKnockback --> ProjEffects
    ProjEffects --> DestroyProjectile
```

### 攻击系统规格

**输入映射**：
- **键盘攻击**：空格键触发近战攻击
- **触摸攻击**：短按触发近战，长按(>500ms)触发技能
- **方向检测**：根据最后移动方向确定攻击方向

**近战攻击**：
- **攻击范围**：50像素半径
- **攻击伤害**：50点
- **击退力度**：200像素/秒
- **攻击位置**：玩家位置 + 方向 × 20像素偏移

**远程技能**：
- **投射物速度**：400像素/秒
- **投射物伤害**：30点
- **击退力度**：150像素/秒
- **生命周期**：3秒
- **技能冷却**：5秒

---

## 5. 敌人AI和视觉系统

```mermaid
flowchart TD
    subgraph "敌人AI系统"
        AIStart["🤖 EnemyAISystem"]
        GetEnemies["获取所有敌人实体"]
        GetPlayer["获取玩家实体"]
        HasPlayer{"玩家存在?"}
        LoopEnemies["遍历每个敌人"]
        CheckKnockback{"敌人被击退中?"}
        CalcAngle["计算朝向玩家角度<br/>Phaser.Math.Angle.Between()"]
        SetVelocity["设置敌人速度<br/>cos(angle) * speed<br/>sin(angle) * speed"]
    end
    
    subgraph "敌人视觉系统"
        VisualStart["✨ EnemyVisualSystem"]
        GetVisualEnemies["获取需要视觉效果的敌人"]
        LoopVisualEnemies["遍历每个敌人"]
        CheckMovement["检测移动状态"]
        CalcTotalSpeed["计算总速度<br/>sqrt(vx² + vy²)"]
        SpeedThreshold{"速度 > 5px/s?"}
        SetMoving["设置为移动状态"]
        SetStatic["设置为静止状态"]
        UpdateBounce["更新弹跳动画"]
        ApplyScale["应用缩放到精灵"]
    end
    
    subgraph "弹跳动画计算"
        BounceStart["🎭 弹跳动画计算"]
        CheckEnabled{"弹跳启用?"}
        UpdateTime["更新弹跳时间<br/>time += deltaTime * frequency"]
        IsMovingCheck{"敌人移动中?"}
        IsKnockbackCheck{"被击退中?"}
        CalcCosWave["计算余弦波<br/>(1 + cos(time)) / 2"]
        CalcBounceValue["bounceValue = wave * intensity"]
        CalcTargetScale["targetScale = baseScale - bounceValue"]
        SmoothTransition["平滑过渡<br/>Phaser.Math.Linear(current, target, 0.15)"]
        ResetToBase["平滑回到基础缩放<br/>lerp factor: 0.08"]
    end
    
    AIStart --> GetEnemies
    GetEnemies --> GetPlayer
    GetPlayer --> HasPlayer
    HasPlayer -->|是| LoopEnemies
    HasPlayer -->|否| AIStart
    LoopEnemies --> CheckKnockback
    CheckKnockback -->|否| CalcAngle
    CheckKnockback -->|是| LoopEnemies
    CalcAngle --> SetVelocity
    SetVelocity --> LoopEnemies
    
    VisualStart --> GetVisualEnemies
    GetVisualEnemies --> LoopVisualEnemies
    LoopVisualEnemies --> CheckMovement
    CheckMovement --> CalcTotalSpeed
    CalcTotalSpeed --> SpeedThreshold
    SpeedThreshold -->|是| SetMoving
    SpeedThreshold -->|否| SetStatic
    SetMoving --> UpdateBounce
    SetStatic --> UpdateBounce
    UpdateBounce --> ApplyScale
    ApplyScale --> LoopVisualEnemies
    
    UpdateBounce --> BounceStart
    BounceStart --> CheckEnabled
    CheckEnabled -->|是| UpdateTime
    CheckEnabled -->|否| ResetToBase
    UpdateTime --> IsMovingCheck
    IsMovingCheck -->|是| IsKnockbackCheck
    IsMovingCheck -->|否| ResetToBase
    IsKnockbackCheck -->|否| CalcCosWave
    IsKnockbackCheck -->|是| ResetToBase
    CalcCosWave --> CalcBounceValue
    CalcBounceValue --> CalcTargetScale
    CalcTargetScale --> SmoothTransition
    SmoothTransition --> ApplyScale
```

### AI和视觉系统规格

**敌人AI行为**：
- **追击逻辑**：始终朝向玩家位置移动
- **角度计算**：使用`Phaser.Math.Angle.Between()`
- **击退响应**：被击退时停止追击行为
- **速度设置**：根据角度和移动速度设置X/Y分量

**弹跳动画系统**：
- **触发条件**：移动速度 > 5像素/秒
- **弹跳强度**：0.2 (20%缩放变化)
- **弹跳频率**：2.0 (0.5秒周期)
- **动画算法**：余弦波函数，范围[0.8, 1.0]
- **平滑过渡**：线性插值避免突兀变化

**状态管理**：
- **移动状态检测**：基于速度向量长度
- **击退状态优先级**：击退期间暂停弹跳
- **恢复机制**：静止时平滑回到基础缩放

---

## 6. 边界检测和移动系统

```mermaid
flowchart TD
    subgraph "移动系统边界检测"
        MoveStart["🚶 MovementSystem"]
        GetMovingEntities["获取所有移动实体<br/>(Transform + Velocity)"]
        LoopEntities["遍历每个实体"]
        ApplyFriction["应用摩擦力"]
        CalcNewPos["计算新位置<br/>newX = x + vx * deltaTime<br/>newY = y + vy * deltaTime"]
        CheckProjectile{"是投射物?"}
        ProjectilePath["投射物路径"]
        NonProjectilePath["非投射物路径"]
        UpdateProjPos["直接更新位置<br/>不做边界限制"]
        CheckBounds["边界检测"]
        ClampPosition["限制位置在边界内<br/>Math.max(min, Math.min(max, pos))"]
        CheckXBound{"X轴撞边界?"}
        CheckYBound{"Y轴撞边界?"}
        StopVX["停止X方向速度"]
        StopVY["停止Y方向速度"]
        UpdateSprite["更新精灵位置"]
    end
    
    subgraph "投射物边界检测"
        ProjSysStart["🚀 ProjectileSystem"]
        GetProjectiles["获取所有投射物"]
        LoopProjectiles["遍历每个投射物"]
        UpdateLifetime["更新生命周期"]
        CheckOutOfBounds["边界检测<br/>x < 0 || x > 800<br/>y < 0 || y > 600"]
        CheckExpired["检查是否过期<br/>lifetime >= maxLifetime"]
        RemoveEntity["销毁投射物实体"]
    end
    
    subgraph "边界定义"
        GameBounds["🎯 游戏边界"]
        PlayerBounds["👤 玩家/敌人边界<br/>X: [20, 780]<br/>Y: [20, 580]"]
        ProjectileBounds["🚀 投射物边界<br/>X: [0, 800]<br/>Y: [0, 600]"]
    end
    
    MoveStart --> GetMovingEntities
    GetMovingEntities --> LoopEntities
    LoopEntities --> ApplyFriction
    ApplyFriction --> CalcNewPos
    CalcNewPos --> CheckProjectile
    CheckProjectile -->|是| ProjectilePath
    CheckProjectile -->|否| NonProjectilePath
    
    ProjectilePath --> UpdateProjPos
    UpdateProjPos --> UpdateSprite
    
    NonProjectilePath --> CheckBounds
    CheckBounds --> ClampPosition
    ClampPosition --> CheckXBound
    CheckXBound -->|是| StopVX
    CheckXBound -->|否| CheckYBound
    StopVX --> CheckYBound
    CheckYBound -->|是| StopVY
    CheckYBound -->|否| UpdateSprite
    StopVY --> UpdateSprite
    UpdateSprite --> LoopEntities
    
    ProjSysStart --> GetProjectiles
    GetProjectiles --> LoopProjectiles
    LoopProjectiles --> UpdateLifetime
    UpdateLifetime --> CheckOutOfBounds
    CheckOutOfBounds -->|是| RemoveEntity
    UpdateLifetime --> CheckExpired
    CheckExpired -->|是| RemoveEntity
    RemoveEntity --> LoopProjectiles
    
    GameBounds --> PlayerBounds
    GameBounds --> ProjectileBounds
```

### 边界检测规格

**边界定义**：
- **游戏屏幕**：800×600像素
- **玩家/敌人活动区域**：[20,780] × [20,580]
- **投射物检测区域**：[0,800] × [0,600]

**系统职责分离**：
- **MovementSystem**：处理玩家和敌人的边界限制
- **ProjectileSystem**：专门处理投射物的边界检测和销毁
- **投射物特殊处理**：不受MovementSystem边界限制，可自由穿越边界后被销毁

**边界碰撞处理**：
- **位置限制**：使用`Math.max/min`限制在边界内
- **速度重置**：撞到边界时停止对应方向的速度
- **立即生效**：确保实体不会卡在边界上

---

## 7. 数据流和系统依赖

```mermaid
graph TD
    subgraph "输入层 Input Layer"
        Keyboard["⌨️ 键盘输入"]
        Touch["👆 触摸输入"]
        Mouse["🖱️ 鼠标输入"]
    end
    
    subgraph "系统层 System Layer"
        InputSys["🎯 PlayerInputSystem"]
        MoveSys["🚶 MovementSystem"]
        AISys["🤖 EnemyAISystem"]
        VisualSys["✨ EnemyVisualSystem"]
        CollisionSys["💥 CollisionSystem"]
        ProjectileSys["🚀 ProjectileSystem"]
        HealthSys["📊 HealthBarSystem"]
        UpdateSys["🔄 ComponentUpdateSystem"]
    end
    
    subgraph "数据层 Component Layer"
        Transform["📍 Transform<br/>位置数据"]
        Velocity["🏃 Velocity<br/>速度数据"]
        Health["❤️ Health<br/>生命值数据"]
        PlayerData["🎮 Player<br/>玩家数据"]
        EnemyData["👾 Enemy<br/>敌人数据"]
        ProjData["💥 Projectile<br/>投射物数据"]
    end
    
    subgraph "渲染层 Render Layer"
        Sprites["🎨 Phaser Sprites"]
        Effects["✨ Visual Effects"]
        UI["🖥️ UI Elements"]
    end
    
    subgraph "物理层 Physics Layer"
        BoundaryCheck["🔲 边界检测"]
        CollisionDetection["💥 碰撞检测"]
        MovementPhysics["⚡ 移动物理"]
    end
    
    %% 输入到系统
    Keyboard --> InputSys
    Touch --> InputSys
    Mouse --> InputSys
    
    %% 系统间依赖关系
    InputSys -->|设置速度| Velocity
    InputSys -->|触发攻击| PlayerData
    
    MoveSys -->|读取速度| Velocity
    MoveSys -->|更新位置| Transform
    MoveSys -->|边界检测| BoundaryCheck
    
    AISys -->|读取玩家位置| Transform
    AISys -->|设置敌人速度| Velocity
    AISys -->|更新AI状态| EnemyData
    
    VisualSys -->|读取速度| Velocity
    VisualSys -->|读取敌人状态| EnemyData
    VisualSys -->|更新缩放| Sprites
    
    CollisionSys -->|读取位置| Transform
    CollisionSys -->|应用伤害| Health
    CollisionSys -->|应用击退| Velocity
    CollisionSys -->|碰撞检测| CollisionDetection
    
    ProjectileSys -->|读取位置| Transform
    ProjectileSys -->|更新生命周期| ProjData
    ProjectileSys -->|边界检测| BoundaryCheck
    
    HealthSys -->|读取生命值| Health
    HealthSys -->|更新UI| UI
    
    UpdateSys -->|更新冷却| PlayerData
    UpdateSys -->|更新状态| EnemyData
    
    %% 系统到渲染
    MoveSys --> Sprites
    CollisionSys --> Effects
    HealthSys --> UI
    
    %% 物理层
    BoundaryCheck --> MovementPhysics
    CollisionDetection --> MovementPhysics
    
    %% 数据依赖
    Transform -.->|位置| CollisionDetection
    Velocity -.->|速度| MovementPhysics
    Health -.->|状态| UI
```

### 数据流分析

**数据层次结构**：
1. **输入层**：接收用户输入，转换为游戏指令
2. **系统层**：处理游戏逻辑，更新组件数据
3. **数据层**：存储游戏状态，组件化数据结构
4. **渲染层**：显示游戏画面，UI元素
5. **物理层**：处理物理计算，碰撞检测

**关键数据依赖**：
- **位置数据**：核心数据，被多个系统读取和修改
- **速度数据**：影响移动和碰撞计算
- **生命值数据**：决定实体存亡和UI显示
- **状态数据**：控制AI行为和视觉效果

---

## 8. 游戏状态机

```mermaid
stateDiagram-v2
    [*] --> GameInit: 游戏启动
    
    state GameInit {
        [*] --> LoadAssets: 加载资源
        LoadAssets --> CreateEntities: 创建实体
        CreateEntities --> InitSystems: 初始化系统
        InitSystems --> [*]: 完成初始化
    }
    
    GameInit --> GamePlaying: 开始游戏
    
    state GamePlaying {
        [*] --> InputProcessing: 处理输入
        
        state InputProcessing {
            [*] --> IdleInput: 等待输入
            IdleInput --> MovementInput: 移动输入
            IdleInput --> AttackInput: 攻击输入
            IdleInput --> SkillInput: 技能输入
            MovementInput --> IdleInput: 输入结束
            AttackInput --> MeleeAttack: 近战攻击
            SkillInput --> RangedAttack: 远程攻击
        }
        
        state MeleeAttack {
            [*] --> CreateAttackBox: 创建攻击框
            CreateAttackBox --> CheckMeleeHit: 检查命中
            CheckMeleeHit --> ApplyMeleeDamage: 应用伤害
            ApplyMeleeDamage --> [*]: 攻击完成
        }
        
        state RangedAttack {
            [*] --> CreateProjectile: 创建投射物
            CreateProjectile --> ProjectileFlying: 投射物飞行
            ProjectileFlying --> ProjectileHit: 命中目标
            ProjectileFlying --> ProjectileExpired: 生命周期结束
            ProjectileHit --> [*]: 投射物销毁
            ProjectileExpired --> [*]: 投射物销毁
        }
        
        state EnemyBehavior {
            [*] --> EnemyIdle: 敌人待机
            EnemyIdle --> EnemyChasing: 追击玩家
            EnemyChasing --> EnemyAttacking: 攻击玩家
            EnemyAttacking --> EnemyKnockback: 被击退
            EnemyKnockback --> EnemyChasing: 恢复追击
            EnemyChasing --> EnemyIdle: 失去目标
        }
        
        state CollisionDetection {
            [*] --> CheckPlayerEnemy: 玩家-敌人碰撞
            [*] --> CheckProjectileEnemy: 投射物-敌人碰撞
            CheckPlayerEnemy --> PlayerTakeDamage: 玩家受伤
            CheckProjectileEnemy --> EnemyTakeDamage: 敌人受伤
            PlayerTakeDamage --> CheckPlayerDeath: 检查玩家死亡
            EnemyTakeDamage --> CheckEnemyDeath: 检查敌人死亡
        }
        
        InputProcessing --> EnemyBehavior: 同时进行
        EnemyBehavior --> CollisionDetection: 移动后检测
        CollisionDetection --> InputProcessing: 下一帧
    }
    
    GamePlaying --> GameOver: 玩家死亡
    GamePlaying --> GameWin: 所有敌人消灭
    
    state GameOver {
        [*] --> ShowDeathEffect: 显示死亡特效
        ShowDeathEffect --> ShowGameOverUI: 显示结束界面
        ShowGameOverUI --> [*]: 等待重启
    }
    
    state GameWin {
        [*] --> ShowVictoryEffect: 显示胜利特效
        ShowVictoryEffect --> ShowWinUI: 显示胜利界面
        ShowWinUI --> [*]: 等待下一关
    }
    
    GameOver --> GameInit: 重新开始
    GameWin --> GameInit: 下一关
```

### 状态转换说明

**游戏生命周期**：
1. **初始化阶段**：加载资源、创建实体、初始化系统
2. **游戏进行**：主要游戏循环，处理所有游戏逻辑
3. **结束状态**：游戏胜利或失败，显示结果界面

**核心状态循环**：
- **输入处理** → **实体行为** → **碰撞检测** → **下一帧**
- 每个状态都有明确的进入和退出条件
- 支持并发状态处理（如输入和AI同时进行）

---

## 9. 技术规格

### 核心技术栈

**游戏引擎**：
- `Phaser.js 3.x` - 2D游戏引擎
- `TypeScript` - 类型安全的JavaScript
- `Webpack` - 模块打包和热重载

**架构模式**：
- `ECS (Entity-Component-System)` - 数据驱动架构
- `Observer Pattern` - 事件系统
- `Factory Pattern` - 实体创建

### 性能规格

**帧率目标**：60 FPS
**分辨率**：800×600像素
**最大实体数量**：100+敌人同时处理
**内存占用**：< 100MB

### 系统参数

**碰撞检测**：
- 玩家-敌人：30px半径
- 投射物-敌人：20px半径
- 近战攻击：50px半径

**伤害数值**：
- 敌人对玩家：25点
- 近战攻击：50点
- 远程投射物：30点

**移动速度**：
- 玩家速度：200px/s
- 敌人速度：100px/s
- 投射物速度：400px/s

**冷却时间**：
- 攻击冷却：200ms
- 技能冷却：5000ms
- 无敌时间：1000ms

**边界设置**：
- 游戏区域：800×600
- 玩家/敌人：[20,780]×[20,580]
- 投射物：[0,800]×[0,600]

### 扩展性设计

**模块化组件**：
- 新增实体类型只需添加对应组件
- 新增系统不影响现有逻辑
- 支持运行时动态添加/移除实体

**配置化参数**：
- 所有数值参数可外部配置
- 支持不同难度级别
- 易于平衡性调整

**事件驱动**：
- 松耦合的事件通信
- 易于添加新的游戏机制
- 支持复杂的状态依赖

---

## 总结

本架构设计实现了一个完整、可扩展的2D动作游戏系统。通过ECS架构确保了代码的模块化和可维护性，详细的流程图和状态机保证了系统的可理解性和调试便利性。

**核心优势**：
- 🏗️ **模块化设计**：清晰的职责分离
- ⚡ **高性能**：优化的碰撞检测和批量处理
- 🎨 **丰富特效**：完整的视觉反馈系统
- 🔧 **易于扩展**：支持快速添加新功能
- 📊 **数据驱动**：参数化配置，易于调整平衡性

该架构为后续的功能扩展（如多种敌人类型、技能系统、关卡设计等）提供了坚实的基础。 