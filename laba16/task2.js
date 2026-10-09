const express = require('express');
const app = express();

app.use(express.json());

let books = [
    { id: 1, title: 'Парфюмер', author: 'Патрик Зюскинд', year: 1985 },
    { id: 2, title: 'Его прощальный поклон', author: 'Артур Конан Дойл', year: 1917 }
];
let nextId = 3;

app.get('/api/books', (req, res) => {
    res.json(books);
});

app.get('/api/books/search', (req, res) => {
    const { author } = req.query;

    if (!author) {
        return res.status(400).json({ error: 'нужен параметр author' });
    }

    const found = books.filter(b =>
        b.author.toLowerCase().includes(author.toLowerCase())
    );
    res.json(found);
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
    const { title, author, year } = req.body;

    if (!title || !author || !year) {
        return res.status(400).json({ error: 'нужны title, author, year' });
    }

    const book = { id: nextId++, title, author, year };
    books.push(book);
    res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const book = books.find(b => b.id === id);

    if (!book) {
        return res.status(404).json({ error: 'книга не найдена' });
    }

    const { title, author, year } = req.body;

    if (!title && !author && !year) {
        return res.status(400).json({ error: 'нужно хоть одно поле' });
    }

    if (title) book.title = title;
    if (author) book.author = author;
    if (year) book.year = year;

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
