import 'phaser';
import gameConfig from './config/gameConfig';

window.addEventListener('load', () => {
    // 创建游戏实例
    const game = new Phaser.Game(gameConfig);

    // 添加调试信息
    console.log('%c游戏日志系统初始化 (ECS版本)', 'color: #4CAF50; font-weight: bold');
    console.log('%c[' + new Date().toLocaleTimeString() + '] [System] ECS 游戏初始化', 'color: #666666');

    // 监听游戏事件
    game.events.on('ready', () => {
        console.log('%c[' + new Date().toLocaleTimeString() + '] [System] ECS 游戏引擎就绪', 'color: #666666');
    });

    game.events.on('boot', () => {
        console.log('%c[' + new Date().toLocaleTimeString() + '] [System] ECS 游戏启动', 'color: #666666');
    });

    game.events.once('destroy', () => {
        console.log('%c[' + new Date().toLocaleTimeString() + '] [System] ECS 游戏销毁', 'color: #666666');
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        game.scale.refresh();
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            const activeScene = game.scene.getScenes(true)[0];
            if (activeScene) {
                game.scene.pause(activeScene);
            }
        } else {
            const activeScene = game.scene.getScenes(true)[0];
            if (activeScene) {
                game.scene.resume(activeScene);
            }
        }
    });

    // 页面加载完成
    console.log('%c[' + new Date().toLocaleTimeString() + '] [System] ECS 游戏启动完成', 'color: #666666');
    console.log('%c ECS 游戏页面加载完成', 'color: #4CAF50; font-weight: bold');
}); 