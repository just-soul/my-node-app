const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const GROUP = '478';
const PORT = 3000;
const HTTPS_PORT = 3443;

const metrics = {
    total: 0,
    byMethod: {},
    byStatus: {},
    startTime: Date.now()
};

const middlewares = [];

middlewares.push((req, res, next) => {
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const start = Date.now();

    res.setHeader('X-Group', GROUP);

    res.on('finish', () => {
        const ms = Date.now() - start;
        const log = `[${time}] [${GROUP}] ${req.method} ${req.url} ${res.statusCode} - ${ms}ms`;
        console.log(log);
        fs.appendFileSync('access.log', log + '\n');

        metrics.total++;
        metrics.byMethod[req.method] = (metrics.byMethod[req.method] || 0) + 1;
        metrics.byStatus[res.statusCode] = (metrics.byStatus[res.statusCode] || 0) + 1;
    });

    next();
});

function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const data = {
            group: GROUP,
            ...metrics,
            uptime: Math.floor((Date.now() - metrics.startTime) / 1000)
        };
        res.end(JSON.stringify(data, null, 2));
        return;
    }

    if (pathname.startsWith('/static/')) {
        let filePath = path.join(__dirname, 'public', pathname.replace('/static/', ''));
        
        const publicDir = path.join(__dirname, 'public');
        if (!filePath.startsWith(publicDir)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const stat = fs.statSync(filePath);
        const etag = `"${stat.size}-${stat.mtimeMs}"`;

        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, { 'Cache-Control': 'max-age=60', 'ETag': etag });
            res.end();
            return;
        }

        const ext = path.extname(filePath);
        const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'max-age=60',
            'ETag': etag
        });
        fs.createReadStream(filePath).pipe(res);
        return;
    }

    if (pathname === '/stream') {
        const bigFilePath = path.join(__dirname, 'big-file.zip');
        if (!fs.existsSync(bigFilePath)) {
            fs.writeFileSync(bigFilePath, Buffer.alloc(1024 * 1024 * 10, 'A')); 
        }
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        fs.createReadStream(bigFilePath).pipe(res);
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Сервер работает!\nГруппа: ${GROUP}\nHTTPS тоже доступен.`);
}

middlewares.push(handleRequest);

const mainServer = (req, res) => {
    let i = 0;
    function next() {
        if (i < middlewares.length) {
            middlewares[i++](req, res, next);
        }
    }
    next();
};

http.createServer(mainServer).listen(PORT, () => {
    console.log(`[INFO] HTTP-сервер запущен на порту ${PORT}`);
    console.log(`[INFO] Группа: ${GROUP}`);
});

try {
    const options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
    https.createServer(options, mainServer).listen(HTTPS_PORT, () => {
        console.log(`[INFO] HTTPS-сервер запущен на порту ${HTTPS_PORT}`);
    });
} catch (e) {
    console.log('[WARN] Сертификаты не найдены, HTTPS не запущен');
}

process.on('SIGINT', () => {
    console.log('\nОстановка сервера...');
    process.exit(0);
});
