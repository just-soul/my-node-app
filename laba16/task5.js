const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

const JWT_SECRET = 'lab16-secret-key';

const titles = ['Парфюмер', 'Сияние', '1984', 'Мастер и Маргарита', 'Война и мир', 'Гарри Поттер', 'Хоббит', 'Дюна', 'Оно', 'Метро 2033'];
const authors = ['Зюскинд', 'Кинг', 'Оруэлл', 'Булгаков', 'Толстой', 'Роулинг', 'Толкин', 'Герберт', 'Кинг', 'Глуховский'];
const genres = ['роман', 'ужас', 'антиутопия', 'фэнтези', 'фантастика'];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateISBN() {
    return '978-' + Math.floor(Math.random() * 1000000000);
}

let books = [];
for (let i = 1; i <= 100; i++) {
    books.push({
        id: i,
        title: randomItem(titles),
        author: randomItem(authors),
        year: 1900 + Math.floor(Math.random() * 120),
        genre: randomItem(genres),
        isbn: generateISBN(),
        available: Math.random() > 0.3,
        reviews: []
    });
}
let nextBookId = 101;
let users = [
    {
        id: 1,
        email: 'admin@example.com',
        password: bcrypt.hashSync('admin123', 10),
        name: 'Админ',
        role: 'admin'
    }
];
let nextUserId = 2;

app.use((req, res, next) => {
    const start = Date.now();
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);

    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[${time}] ${req.method} ${req.path} ${res.statusCode} - ${ms}ms`);
    });

    next();
});

function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'нет токена' });
    }

    const token = header.slice(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'невалидный токен' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'доступ только для админов' });
    }
    next();
}

app.post('/auth/register', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'нужны email, password, name' });
    }

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'email уже занят' });
    }

    const user = {
        id: nextUserId++,
        email,
        password: bcrypt.hashSync(password, 10),
        name,
        role: 'user'
    };

    users.push(user);
    res.status(201).json({ message: 'зарегистрирован', user: { id: user.id, email, name } });
});

app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'нужны email и password' });
    }

    const user = users.find(u => u.email === email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'неверный email или пароль' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token });
});

app.get('/api/books', auth, (req, res) => {
    let result = [...books];

    const { search, genre, available, sort, limit, page } = req.query;

    if (search) {
        const q = search.toLowerCase();
        result = result.filter(b =>
            b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
        );
    }

    if (genre) {
        result = result.filter(b => b.genre === genre);
    }

    if (available === 'true') {
        result = result.filter(b => b.available);
    }

    if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.slice(1) : sort;
        result.sort((a, b) => {
            if (a[field] < b[field]) return desc ? 1 : -1;
            if (a[field] > b[field]) return desc ? -1 : 1;
            return 0;
        });
    }

    const total = result.length;
    const l = Number(limit) || 10;
    const p = Number(page) || 1;
    const offset = (p - 1) * l;

    result = result.slice(offset, offset + l);

    res.json({ total, page: p, limit: l, data: result });
});

app.get('/api/books/:id', auth, (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);

    if (!book) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    res.json(book);
});

app.post('/api/books', auth, adminOnly, (req, res) => {
    const { title, author, year, genre } = req.body;

    if (!title || !author || !year) {
        return res.status(400).json({ error: 'нужны title, author, year' });
    }

    const book = {
        id: nextBookId++,
        title, author, year,
        genre: genre || 'не указан',
        isbn: generateISBN(),
        available: true,
        reviews: []
    };

    books.push(book);
    res.status(201).json(book);
});

app.put('/api/books/:id', auth, (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);

    if (!book) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    const { title, author, year, genre, available } = req.body;
    if (title) book.title = title;
    if (author) book.author = author;
    if (year) book.year = year;
    if (genre) book.genre = genre;
    if (available !== undefined) book.available = available;

    res.json(book);
});

app.delete('/api/books/:id', auth, adminOnly, (req, res) => {
    const id = Number(req.params.id);
    const index = books.findIndex(b => b.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    books.splice(index, 1);
    res.json({ message: 'книга удалена' });
});

app.post('/api/books/:id/reviews', auth, (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);

    if (!book) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    const { text, rating } = req.body;
    if (!text || !rating) {
        return res.status(400).json({ error: 'нужны text и rating' });
    }

    const review = {
        user: req.user.email,
        text,
        rating,
        date: new Date().toISOString()
    };

    book.reviews.push(review);
    res.status(201).json(review);
});
app.get('/api/books/export', auth, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=books.json');
    res.send(JSON.stringify(books, null, 2));
});

app.post('/api/books/import', auth, adminOnly, (req, res) => {
    const imported = req.body;

    if (!Array.isArray(imported)) {
        return res.status(400).json({ error: 'нужен массив книг' });
    }

    let count = 0;
    for (const b of imported) {
        if (b.title && b.author && b.year) {
            books.push({
                id: nextBookId++,
                title: b.title,
                author: b.author,
                year: b.year,
                genre: b.genre || 'не указан',
                isbn: generateISBN(),
                available: true,
                reviews: []
            });
            count++;
        }
    }

    res.json({ imported: count });
});

app.get('/api/books/recommendations', auth, (req, res) => {
    const { genre } = req.query;

    if (!genre) {
        return res.status(400).json({ error: 'нужен параметр genre' });
    }

    const recommended = books
        .filter(b => b.genre === genre && b.available)
        .slice(0, 5);

    res.json(recommended);
});

app.get('/api/books/available', auth, (req, res) => {
    res.json(books.filter(b => b.available));
});

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'API для управления библиотекой (ЛР 16)'
        },
        servers: [{ url: 'http://localhost:3000' }]
    },
    apis: ['./task5.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(3000, () => {
    console.log('сервер запущен на порту 3000');
    console.log('документация: http://localhost:3000/api-docs');
    console.log(`книг: ${books.length}, пользователей: ${users.length}`);
});
