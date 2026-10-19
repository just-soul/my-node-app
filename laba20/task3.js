const http = require('http');

const MAX_SIZE = 1024 * 1024; 

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/echo') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
            if (body.length > MAX_SIZE) {
                res.writeHead(413, { 'Content-Type': 'text/plain' });
                res.end('Payload Too Large');
                req.destroy();
            }
        });

        req.on('end', () => {
            if (res.writableEnded) return;

            const contentType = req.headers['content-type'] || '';

            if (contentType.includes('application/json')) {
                try {
                    const json = JSON.parse(body);
                    json.group = '478'; 
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(json));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(body);
            }
        });

        req.on('error', () => {
            res.writeHead(500);
            res.end('Error');
        });

    } else if (req.method === 'POST' && req.url === '/form') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const result = {};
            for (const [key, value] of params) {
                result[key] = value;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
