const FileManagerPromises = require('./fileOperationsPromises');

async function testFileOperations() {
    const fm = new FileManagerPromises('./test-data');

    try {
        console.log('1. Создание файлов параллельно...');
        const paths = await fm.createMultipleFiles([
            { filename: 'file1.txt', content: 'Первый файл' },
            { filename: 'file2.txt', content: 'Второй файл' },
            { filename: 'file3.txt', content: 'Третий файл' }
        ]);
        console.log('Созданные файлы:', paths);

        console.log('\n2. Чтение одного файла...');
        const content = await fm.readFile('file1.txt');
        console.log(`Содержимое: "${content}"`);

        console.log('\n3. Статистика...');
        const stats = await fm.getFileStats('file1.txt');
        console.log(`Размер: ${stats.size} байт`);
        console.log(`Создан: ${stats.created}`);

        console.log('\n4. Список файлов...');
        const files = await fm.listFiles();
        files.forEach(f => console.log(` - ${f}`));

        console.log('\n5. Чтение нескольких файлов параллельно...');
        const contents = await fm.readMultipleFiles(['file1.txt', 'file2.txt', 'file3.txt']);
        Object.entries(contents).forEach(([name, text]) => {
            console.log(` - ${name}: "${text}"`);
        });

        console.log('\n6. Очистка...');
        for (const file of files) {
            await fm.deleteFile(file);
            console.log(`${file} удалён`);
        }

        console.log('\nВсе операции завершены!');
        console.log('Код стал намного чище и читаемее!');
    } catch (error) {
        console.error('Ошибка:', error.message);
    }
}

testFileOperations();
