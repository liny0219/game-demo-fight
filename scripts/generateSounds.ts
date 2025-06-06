import { SoundGenerator } from '../src/utils/SoundGenerator';

async function main() {
    try {
        console.log('开始生成音效文件...');
        await SoundGenerator.generateSoundFiles();
        console.log('音效文件生成完成！');
    } catch (error) {
        console.error('生成音效文件时出错:', error);
        process.exit(1);
    }
}

main();
