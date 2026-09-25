const fs = require('fs').promises;
const path = require('path');

const VARIANT = 6;
const ROOT = path.join(__dirname, `project_${VARIANT}`);

async function mkdirp(dir) {
    await fs.mkdir(dir, { recursive: true });
}
async function createInfo(folder, description) {
    const infoPath = path.join(folder, 'info.txt');
    await fs.writeFile(infoPath, description, 'utf8');
}
async function createReadme(folder) {
    const readmePath = path.join(folder, 'README.md');
    const dateStr = new Date().toISOString().slice(0, 10);
    await fs.writeFile(readmePath, `Создано: ${dateStr}\n`, 'utf8');
}
async function printTree(dir, prefix = '') {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        console.log(`${prefix}${branch}${entry.name}`);
        if (entry.isDirectory()) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            await printTree(path.join(dir, entry.name), newPrefix);
        }
    }
}

async function main() {
    try {
        const structure = {
            'src/modules': 'Здесь хранятся модули приложения',
            'src/components': 'Компоненты интерфейса',
            'src/utils': 'Утилиты и вспомогательные функции',
            'data/input': 'Входные данные',
            'data/output': 'Выходные данные',
            'data/temp': 'Временные файлы'
        };
        for (const [rel, description] of Object.entries(structure)) {
            const folder = path.join(ROOT, rel);
            await mkdirp(folder);
            await createInfo(folder, description);
            await createReadme(folder); 
        }

        console.log('=== Исходное дерево ===');
        console.log(`project_${VARIANT}/`);
        await printTree(ROOT);
        await fs.rename(
            path.join(ROOT, 'data/output'),
            path.join(ROOT, 'data/results')
        );
        console.log('\nПапка data/output переименована в data/results');
        await fs.rm(path.join(ROOT, 'data/temp'), { recursive: true, force: true });
        console.log('Папка data/temp удалена');

        console.log('\n=== Обновлённое дерево ===');
        console.log(`project_${VARIANT}/`);
        await printTree(ROOT);

    } catch (err) {
        console.error('Ошибка:', err.message);
    }
}

main();
