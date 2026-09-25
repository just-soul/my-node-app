const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('fs');

const VARIANT = 6;
const SOURCE_DIR = path.join(__dirname, `source_${VARIANT}`);
const BACKUP_DIR = path.join(__dirname, `backup_${VARIANT}`);
const SYNC_REPORT = path.join(__dirname, `sync_report_${VARIANT}.txt`);

async function createTestStructure() {
    console.log('=== Создание тестовой структуры ===\n');

    // Создаём папки
    await fsp.mkdir(SOURCE_DIR, { recursive: true });
    await fsp.mkdir(path.join(SOURCE_DIR, 'docs'), { recursive: true });
    await fsp.mkdir(path.join(SOURCE_DIR, 'scripts'), { recursive: true });
    await fsp.mkdir(path.join(SOURCE_DIR, 'images'), { recursive: true });

    const manifest = [];
    const rootFiles = [
        { name: `notes_${VARIANT}.txt`, content: 'Текстовый файл с заметками', size: 200 },
        { name: `script_${VARIANT}.js`, content: 'console.log("Hello");', size: 150 },
        { name: `config_${VARIANT}.json`, content: '{"variant": 6}', size: 100 },
        { name: `picture_${VARIANT}.jpg`, content: 'JPG', size: 300 },
        { name: `photo_${VARIANT}.png`, content: 'PNG', size: 400 },
        { name: `animation_${VARIANT}.gif`, content: 'GIF', size: 250 },
    ];

    for (const file of rootFiles) {
        const filePath = path.join(SOURCE_DIR, file.name);
        await fsp.writeFile(filePath, file.content.padEnd(file.size, ' '));
        manifest.push({ name: file.name, size: file.size, path: `./${file.name}` });
    }
    const subFiles = {
        docs: [
            { name: `readme_${VARIANT}.md`, size: 300 },
            { name: `guide_${VARIANT}.txt`, size: 500 },
        ],
        scripts: [
            { name: `app_${VARIANT}.js`, size: 800 },
            { name: `utils_${VARIANT}.js`, size: 600 },
            { name: `data_${VARIANT}.json`, size: 400 },
        ],
        images: [
            { name: `logo_${VARIANT}.png`, size: 1500 },
            { name: `banner_${VARIANT}.jpg`, size: 2000 },
        ],
    };

    for (const [folder, files] of Object.entries(subFiles)) {
        for (const file of files) {
            const filePath = path.join(SOURCE_DIR, folder, file.name);
            await fsp.writeFile(filePath, `Содержимое ${file.name}`.padEnd(file.size, ' '));
            manifest.push({ name: file.name, size: file.size, path: `./${folder}/${file.name}` });
        }
    }

    const bigFilePath = path.join(SOURCE_DIR, 'big_file.txt');
    const bigContent = 'A'.repeat(600 * 1024); 
    await fsp.writeFile(bigFilePath, bigContent);
    manifest.push({ name: 'big_file.txt', size: 600 * 1024, path: './big_file.txt' });
    const manifestPath = path.join(SOURCE_DIR, 'manifest.json');
    await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`Создана структура: ${SOURCE_DIR}`);
    console.log(`Файлов: ${manifest.length + 1}`);
    console.log(`Подпапок: 3\n`);
}
const STREAM_EXTENSIONS = ['.txt', '.js', '.json'];
const COPY_EXTENSIONS = ['.jpg', '.png', '.gif'];
const CHUNK_SIZE = 512 * 1024; 
const MD5_THRESHOLD = 500 * 1024; 

async function copyFile(src, dest) {
    const ext = path.extname(src).toLowerCase();
    const stats = await fsp.stat(src);
    const size = stats.size;

    await fsp.mkdir(path.dirname(dest), { recursive: true });

    if (size > 1024 * 1024) {
        await copyInChunks(src, dest);
        return 'chunks';
    }

    if (STREAM_EXTENSIONS.includes(ext)) {
        await pipeline(createReadStream(src), createWriteStream(dest));
        return 'stream';
    }

    if (COPY_EXTENSIONS.includes(ext)) {
        await fsp.copyFile(src, dest);
        return 'regular';
    }
    
    await fsp.copyFile(src, dest);
    return 'regular';
}

async function copyInChunks(src, dest) {
    return new Promise((resolve, reject) => {
        const readStream = createReadStream(src, { highWaterMark: CHUNK_SIZE });
        const writeStream = createWriteStream(dest);
        readStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
        readStream.pipe(writeStream);
    });
}

async function copyDirectory(src, dest) {
    console.log('=== Копирование с фильтрацией ===\n');

    const stats = { stream: 0, regular: 0, chunks: 0, total: 0 };
    const allFiles = await getAllFiles(src);

    for (const file of allFiles) {
        const relPath = path.relative(src, file);
        const destPath = path.join(dest, relPath);
        const type = await copyFile(file, destPath);
        stats[type]++;
        stats.total++;
        console.log(`[${stats.total}/${allFiles.length}] ${relPath} (${type})`);
    }

    console.log(`\nКопирование завершено!`);
    console.log(`  Всего: ${stats.total}`);
    console.log(`  Потоками: ${stats.stream}`);
    console.log(`  Обычно: ${stats.regular}`);
    console.log(`  Чанками: ${stats.chunks}\n`);

    return stats;
}

async function getAllFiles(dir) {
    const result = [];
    const entries = await fsp.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            result.push(...(await getAllFiles(fullPath)));
        } else {
            result.push(fullPath);
        }
    }
    return result;
}

async function getMD5(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = createReadStream(filePath);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

async function syncDirectories(src, dest) {
    console.log('=== Сравнение директорий ===\n');

    const srcFiles = await getAllFiles(src);
    const destFiles = await getAllFiles(dest);

    const srcRel = new Set(srcFiles.map(f => path.relative(src, f)));
    const destRel = new Set(destFiles.map(f => path.relative(dest, f)));

    const added = [];
    const removed = [];
    const modified = [];
    const same = [];

    // Проверяем файлы из source
    for (const file of srcFiles) {
        const rel = path.relative(src, file);
        const destFile = path.join(dest, rel);

        if (!destRel.has(rel)) {
            added.push(rel);
            continue;
        }

        const srcStats = await fsp.stat(file);
        const destStats = await fsp.stat(destFile);

        let isModified = srcStats.size !== destStats.size;
        if (!isModified && srcStats.size > MD5_THRESHOLD) {
            const srcHash = await getMD5(file);
            const destHash = await getMD5(destFile);
            isModified = srcHash !== destHash;
            console.log(`MD5 check: ${rel} (${srcHash.slice(0, 8)}... vs ${destHash.slice(0, 8)}...)`);
        }

        if (isModified) {
            modified.push(rel);
        } else {
            same.push(rel);
        }
    }
    for (const rel of destRel) {
        if (!srcRel.has(rel)) {
            removed.push(rel);
        }
    }
    const report = [
        '=== Отчёт синхронизации ===',
        `Дата: ${new Date().toISOString()}`,
        `Source: ${src}`,
        `Backup: ${dest}`,
        '',
        `Совпадают: ${same.length}`,
        `Изменены: ${modified.length}`,
        `Добавлены: ${added.length}`,
        `Удалены: ${removed.length}`,
        '',
    ];

    if (modified.length) {
        report.push('--- Изменённые ---');
        report.push(...modified);
    }
    if (added.length) {
        report.push('\n--- Добавленные ---');
        report.push(...added);
    }
    if (removed.length) {
        report.push('\n--- Удалённые ---');
        report.push(...removed);
    }

    await fsp.writeFile(SYNC_REPORT, report.join('\n'));

    console.log(`Совпадают: ${same.length}`);
    console.log(`Изменены: ${modified.length}`);
    console.log(`Добавлены: ${added.length}`);
    console.log(`Удалены: ${removed.length}`);
    console.log(`\nОтчёт сохранён: ${SYNC_REPORT}\n`);
}
async function main() {
    const start = Date.now();

    try {
        // Очищаем предыдущие прогоны
        await fsp.rm(SOURCE_DIR, { recursive: true, force: true });
        await fsp.rm(BACKUP_DIR, { recursive: true, force: true });

        await createTestStructure();
        await copyDirectory(SOURCE_DIR, BACKUP_DIR);
        await syncDirectories(SOURCE_DIR, BACKUP_DIR);

        console.log(`Время выполнения: ${((Date.now() - start) / 1000).toFixed(2)} сек`);
    } catch (err) {
        console.error('Ошибка:', err.message);
        console.error(err.stack);
    }
}

main();
