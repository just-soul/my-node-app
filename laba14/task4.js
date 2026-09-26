const fs = require('fs');
const path = require('path');
const HybridFileManager = require('../fileOperationsHybrid');

const DIR = './measure-data';
const N = 200; 
if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
}

const fm = new HybridFileManager(DIR);
function testSync() {
    console.time('SYNC');
    for (let i = 0; i < N; i++) {
        fs.writeFileSync(path.join(DIR, `sync_${i}.txt`), `data ${i}`);
    }
    console.timeEnd('SYNC');
}
function testCallbacks() {
    return new Promise((resolve) => {
        console.time('CALLBACKS');
        let completed = 0;

        for (let i = 0; i < N; i++) {
            fm.createFile(`cb_${i}.txt`, `data ${i}`, (err) => {
                if (err) {
                    console.error('Ошибка:', err.message);
                }
                completed++;
                if (completed === N) {
                    console.timeEnd('CALLBACKS');
                    resolve();
                }
            });
        }
    });
}
async function testPromises() {
    console.time('PROMISES');
    const promises = [];
    for (let i = 0; i < N; i++) {
        promises.push(fm.createFile(`pr_${i}.txt`, `data ${i}`));
    }
    await Promise.all(promises);
    console.timeEnd('PROMISES');
}
function cleanup() {
    const files = fs.readdirSync(DIR);
    for (const file of files) {
        fs.unlinkSync(path.join(DIR, file));
    }
    console.log('\nДиректория очищена.');
}
(async () => {
    console.log(`=== Сравнение производительности (${N} файлов) ===\n`);

    testSync();
    await testCallbacks();
    await testPromises();

    cleanup();
})();
