const express = require('express');
const app = express();
app.get('/', (req, res) => {
    const now = new Date().toLocaleString('ru-RU');

    res.send(`
        <h1>Лабораторная работа №16</h1>
        <p>Группа: 478</p>
        <p>Дата и время: ${now}</p>
        <p>Привет! Это сервер на Express.js.</p>
        <h3>Доступные маршруты:</h3>
        <ul>
            <li><a href="/">/</a> - главная</li>
            <li><a href="/about">/about</a> - о разработчике</li>
            <li><a href="/contacts">/contacts</a> - контакты</li>
        </ul>
    `);
});
app.get('/about', (req, res) => {
    res.send(`
        <h1>О разработчике</h1>
        <p>Студент: Дема Илья</p>
        <p>Группа: 478</p>
        <p>Курс: 4</p>
    `);
});
app.get('/contacts', (req, res) => {
    res.send(`
        <h1>Контакты</h1>
        <p>Email: student@example.com</p>
        <p>Telegram: @student</p>
    `);
});
app.listen(3000, () => {
    console.log('сервер запущен на порту 3000');
});
