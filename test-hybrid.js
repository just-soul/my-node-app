const FileManager = require('./fileOperations');

const fileManager = new FileManager('./test-data');

console.log('=== СМЕШАННЫЙ ПОДХОД ===');

fileManager.createFile('test1.txt', 'Привет!', (err, filePath) => {
    if (err) {
        console.log('Ошибка создания:', err.message);
        return;
    }

    console.log('Файл создан:', filePath);

    fileManager.readFile('test1.txt', (err, data) => {
        if (err) {
            console.log('Ошибка чтения:', err.message);
            return;
        }

        console.log('Содержимое:', data);
        testPromises();
    });
});

async function testPromises() {
    try {
        const stats = await fileManager.getFileStats('test1.txt');

        console.log('Размер файла:', stats.size);
        console.log('Дата создания:', stats.created);

        const files = await fileManager.listFiles();

        console.log('Файлы:', files);

        await fileManager.createFile('test2.txt', 'Второй файл');

        console.log('Второй файл создан');

        await fileManager.deleteFile('test2.txt');

        console.log('Второй файл удалён');
    } catch (error) {
        console.log('Ошибка:', error.message);
    }
}
