const http = require('http');

const server = http.createServer((req, res) => {
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
        <h1>	Лабораторная работа №20	</h1>
        <p>Группа: 478</p>`);
    } else if (req.url === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
        <h1>О нас</h1>
        <p>Группа: 478</p>
        <p>Студент: Дема Илья</p>`);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
    }

    console.log(`[${time}] ${req.method} ${req.url} ${res.statusCode}`);
});

server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
