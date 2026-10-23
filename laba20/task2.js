const http = require('http');

const server = http.createServer((req, res) => {
    res.setHeader('X-Powered-By', 'Node.js');
    res.setHeader('X-Group', '478');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.url === '/headers') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            headers: req.headers,
            method: req.method,
            url: req.url,
            httpVersion: req.httpVersion
        }, null, 2));

    } else if (req.url === '/headers/set') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>Заголовки установлены</h1>');

    } else if (req.url === '/headers/check') {
        const hasContentType = res.hasHeader('Content-Type');
        const hasXGroup = res.hasHeader('X-Group');
        const hasUnknown = res.hasHeader('X-Unknown');

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ hasContentType, hasXGroup, hasUnknown }));

    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
