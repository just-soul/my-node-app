const fs = require('fs').promises;
const path = require('path');

async function createStudentFile() {
    const variant = 6;
    const filename = `student_${variant}.txt`;
    const filePath = path.join(__dirname, filename);
    const fio = 'Dzema Ilya';
    const group = 478;
    const books = [
        '1. "Война и мир" - Л. Толстой',
        '2. "Преступление и наказание" - Ф. Достоевский',
        '3. "Мастер и Маргарита" - М. Булгаков',
        '4. "1984" - Дж. Оруэлл',
        '5. "Гарри Поттер" - Дж. Роулинг'
    ];
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');
    const lines = [
        `Студент: ${fio}`,
        `Группа: ${group}`,
        `Вариант: ${variant}`,
        `Дата: ${dateStr}`,
        '',
        'Любимые книги:',
        ...books
    ];

    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
    const content = await fs.readFile(filePath, 'utf8');
    const count = content.split('\n').filter(line => line.trim() !== '').length;
    await fs.appendFile(filePath, `\n\nКоличество записей: ${count}`, 'utf8');
    const finalContent = await fs.readFile(filePath, 'utf8');
    console.log(`Создан файл: ${filename}`);
    console.log('Содержимое файла:\n');
    console.log(finalContent);
}

createStudentFile().catch(err => console.error('Ошибка:', err.message));
