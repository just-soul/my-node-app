const Koa = require('koa');
const app = new Koa();

app.use(async (ctx) => {
    const now = new Date().toLocaleString('ru-RU');

    ctx.type = 'text/html; charset=utf-8';
    ctx.body = `
        <h1>Лабораторная работа №15</h1>
        <p>Группа: ББМО-01-23</p>
        <p>Дата и время: ${now}</p>
        <p>Привет! Это сервер на Koa.js.</p>
    `;
});

app.listen(3000, () => {
    console.log('сервер запущен на порту 3000');
});
