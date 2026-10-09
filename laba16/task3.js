const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);

    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[${time}] ${req.method} ${req.path} ${res.statusCode} - ${ms}ms`);
    });

    next();
});
-
app.use(compression());

const limiter = rateLimit({
    windowMs: 60 * 1000,   
    max: 100,              
    message: { error: 'слишком много запросов', status: 429 },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

let books = [
    { id: 1, title: 'Никита', author: 'Мiша', year: 8332 }
];
let nextId = 2;

app.get('/api/books', (req, res) => {
    res.json(books);
});

app.get('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);

    if (!book) {
        const err = new Error('книга не найдена');
        err.status = 404;
        throw err;
    }

    res.json(book);
});

app.post('/api/books', (req, res) => {
    const { title, author, year } = req.body;

    if (!title || !author || !year) {
        const err = new Error('нужны title, author, year');
        err.status = 400;
        throw err;
    }

    const book = { id: nextId++, title, author, year };
    books.push(book);
    res.status(201).json(book);
});

app.get('/error', (req, res) => {
    throw new Error('тестовая ошибка');
});

app.get('/async-error', async (req, res) => {
    throw new Error('асинхронная ошибка');
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        error: err.message || 'внутренняя ошибка сервера',
        status: err.status || 500
    });
});

app.listen(3000, () => {
    console.log('сервер запущен на порту 3000');
});
