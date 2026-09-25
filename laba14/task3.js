const fs = require('fs').promises;
const path = require('path');

const VARIANT = 6;
const IGNORED_DIRS = ['node_modules', '.git'];
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}
async function scanDirectory(dir, stats) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
        console.warn(`Не удалось прочитать ${dir}: ${err.message}`);
        return;
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && IGNORED_DIRS.includes(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            stats.folders++;
            await scanDirectory(fullPath, stats);
        } else if (entry.isFile()) {
            try {
                const fileStats = await fs.stat(fullPath);
                stats.files++;
                stats.totalSize += fileStats.size;

                const ext = path.extname(entry.name).toLowerCase() || '(без расширения)';
                if (!stats.byExtension[ext]) {
                    stats.byExtension[ext] = { count: 0, size: 0 };
                }
                stats.byExtension[ext].count++;
                stats.byExtension[ext].size += fileStats.size;

                stats.fileList.push({
                    name: entry.name,
                    path: fullPath,
                    size: fileStats.size
                });
            } catch (err) {
                console.warn(`Не удалось прочитать файл ${fullPath}: ${err.message}`);
            }
        }
    }
}

async function main() {
    const targetDir = process.argv[2] || '.';
    const absoluteDir = path.resolve(targetDir);

    console.log(`Анализ директории: ${absoluteDir}\n`);

    const stats = {
        files: 0,
        folders: 0,
        totalSize: 0,
        byExtension: {},
        fileList: []
    };

    try {
        await scanDirectory(absoluteDir, stats);
    } catch (err) {
        console.error('Ошибка сканирования:', err.message);
        return;
    }
    const sortedBySize = [...stats.fileList].sort((a, b) => b.size - a.size);
    const top5Largest = sortedBySize.slice(0, 5);
    const top5Smallest = [...stats.fileList]
        .sort((a, b) => a.size - b.size)
        .slice(0, 5);
    console.log(`Общее количество папок: ${stats.folders}`);
    console.log(`Общее количество файлов: ${stats.files}`);
    console.log(`Общий размер: ${formatSize(stats.totalSize)} (${stats.totalSize} байт)\n`);

    console.log('Расширения файлов:');
    const extEntries = Object.entries(stats.byExtension)
        .sort((a, b) => b[1].size - a[1].size);
    for (const [ext, data] of extEntries) {
        console.log(`  ${ext}: ${data.count} файл(ов) (${formatSize(data.size)})`);
    }

    console.log('\nТоп-5 самых больших файлов:');
    top5Largest.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`);
    });

    console.log('\nТоп-5 самых маленьких файлов:');
    top5Smallest.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.name} (${formatSize(f.size)}) - ${f.path}`);
    });
    const report = {
        variant: VARIANT,
        scannedDirectory: absoluteDir,
        scannedAt: new Date().toISOString(),
        totalFolders: stats.folders,
        totalFiles: stats.files,
        totalSizeBytes: stats.totalSize,
        totalSizeKB: (stats.totalSize / 1024).toFixed(2),
        totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2),
        byExtension: stats.byExtension,
        top5Largest: top5Largest.map(f => ({ name: f.name, path: f.path, size: f.size })),
        top5Smallest: top5Smallest.map(f => ({ name: f.name, path: f.path, size: f.size }))
    };

    const reportPath = path.join(__dirname, `report_${VARIANT}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nОтчет сохранен: report_${VARIANT}.json`);
}

main().catch(err => console.error('Ошибка:', err.message));
