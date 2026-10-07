const express = require('express');
const app = express();
app.use(express.json());

let books = [
    { id: 1, title: 'Парфюмер', author: 'Зюскинд', year: 1985, genre: 'Роман' },
    { id: 2, title: 'Его прощальный поклон', author: 'Артур Конан Дойл', year: 1917, genre: 'Детектив' },
    { id: 3, title: 'Сияние', author: 'Стивен Кинг', year: 1977, genre: 'Ужас' },
    { id: 4, title: 'Граф Монте-Кристо', author: 'Александр Дюма', year: 1844, genre: 'Роман' },
    { id: 5, title: 'Сто лет одиночества', author: 'Габриэль Гарсиа Маркес', year: 1967, genre: 'Роман' }
];
let nextId = 6;

app.get('/api/books/stats', (req, res) => {
    const byAuthor = {};
    const byGenre = {};

    for (const b of books) {
        byAuthor[b.author] = (byAuthor[b.author] || 0) + 1;
        byGenre[b.genre] = (byGenre[b.genre] || 0) + 1;
    }

    const years = books.map(b => b.year);

    res.json({
        total: books.length,
        byAuthor,
        byGenre,
        oldest: years.length ? Math.min(...years) : null,
        newest: years.length ? Math.max(...years) : null
    });
});
app.get('/api/books', (req, res) => {
    let result = [...books];

    const { author, year, yearFrom, yearTo, search, sort } = req.query;

    if (author) {
        result = result.filter(b =>
            b.author.toLowerCase().includes(author.toLowerCase())
        );
    }

    if (year) {
        result = result.filter(b => b.year === Number(year));
    }

    if (yearFrom) {
        result = result.filter(b => b.year >= Number(yearFrom));
    }
    if (yearTo) {
        result = result.filter(b => b.year <= Number(yearTo));
    }

    if (search) {
        const q = search.toLowerCase();
        result = result.filter(b =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q)
        );
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
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    result = result.slice(offset, offset + limit);

    res.json({ total, page, limit, data: result });
});

app.get('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);

    if (!book) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    res.json(book);
});

app.post('/api/books', (req, res) => {
    const { title, author, year, genre } = req.body;

    if (!title || !author || !year) {
        return res.status(400).json({ error: 'нужны title, author, year' });
    }
    if (typeof year !== 'number' || year < 0 || year > 2100) {
        return res.status(400).json({ error: 'год должен быть от 0 до 2100' });
    }

    const exists = books.find(b =>
        b.title.toLowerCase() === title.toLowerCase() &&
        b.author.toLowerCase() === author.toLowerCase()
    );
    if (exists) {
        return res.status(400).json({ error: 'такая книга уже есть' });
    }

    const book = { id: nextId++, title, author, year, genre: genre || 'не указан' };
    books.push(book);
    res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);

    if (!book) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    const { title, author, year, genre } = req.body;

    if (year !== undefined && (typeof year !== 'number' || year < 0 || year > 2100)) {
        return res.status(400).json({ error: 'год должен быть от 0 до 2100' });
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (year) book.year = year;
    if (genre) book.genre = genre;

    res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = books.findIndex(b => b.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    books.splice(index, 1);
    res.json({ message: 'книга удалена' });
});

app.listen(3000, () => {
    console.log('сервер запущен на порту 3000');
});
