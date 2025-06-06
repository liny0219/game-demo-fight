import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'images');

interface ImageConfig {
    name: string;
    width: number;
    height: number;
    color: string;
}

const images: ImageConfig[] = [
    { name: 'player', width: 32, height: 32, color: '#00ff00' },
    { name: 'enemy', width: 32, height: 32, color: '#ff0000' },
    { name: 'projectile', width: 10, height: 10, color: '#00ffff' },
    { name: 'attack_box', width: 40, height: 40, color: '#ffff00' }
];

async function generateImage(config: ImageConfig): Promise<void> {
    const canvas = createCanvas(config.width, config.height);
    const ctx = canvas.getContext('2d');

    // 绘制形状
    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, config.width, config.height);

    // 添加边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, config.width - 2, config.height - 2);

    // 保存为PNG文件
    const buffer = canvas.toBuffer('image/png');
    const filePath = path.join(ASSETS_DIR, `${config.name}.png`);
    fs.writeFileSync(filePath, buffer);
}

async function main() {
    // 确保目录存在
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    console.log('开始生成图片资源...');

    // 生成所有图片
    for (const config of images) {
        await generateImage(config);
        console.log(`生成图片: ${config.name}.png`);
    }

    console.log('图片资源生成完成！');
}

main().catch(console.error);
