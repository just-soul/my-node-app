const path = require('path');
const fs = require('fs');

const filepath = path.join(__dirname, 'logs.txt');
const timeout = new Date().toLocaleTimeString();
const stream = fs.createWriteStream(filepath, { flags: 'a', encoding: 'utf8' });

function setupLogger(server) {
    server.on('server:started', (port) => {
        stream.write(`[${timeout}] server:started: localhost:${port}\n`);
    });

    server.on('server:stopped', () => {
    	console.log('сервер остановлен');
        stream.write(`[${timeout}] server:stopped: localhost: Сервер отключен\n`);
        process.exit(0);
    });

    server.on('request:received', (req) => {
        const url = req.url;
        const method = req.method;
        stream.write(`[${timeout}] request:received: ${url} ${method}\n`);
    });
}

module.exports = { setupLogger };
