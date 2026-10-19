const http = require('http');

let students = [
    { id: 1, name: 'Мiша', group: '478' },
    { id: 2, name: 'Некит', group: '478' }
];
let nextId = 3;

function parseBody(req) {
    return new Promise(resolve => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({}); }
        });
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method;

    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (path === '/api/students' && method === 'GET') {
        const group = url.searchParams.get('group');
        let result = students;
        if (group) {
            result = students.filter(s => s.group === group);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

    } else if (path.match(/^\/api\/students\/\d+$/) && method === 'GET') {
        const id = Number(path.split('/').pop());
        const student = students.find(s => s.id === id);
        if (student) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(student));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }

    } else if (path === '/api/students' && method === 'POST') {
        const body = await parseBody(req);
        const newStudent = { id: nextId++, name: body.name || 'Unknown', group: body.group || 'ББМО-01-23' };
        students.push(newStudent);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newStudent));

    } else if (path.match(/^\/api\/students\/\d+$/) && method === 'PUT') {
        const id = Number(path.split('/').pop());
        const student = students.find(s => s.id === id);
        if (student) {
            const body = await parseBody(req);
            if (body.name) student.name = body.name;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(student));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }

    } else if (path.match(/^\/api\/students\/\d+$/) && method === 'DELETE') {
        const id = Number(path.split('/').pop());
        const index = students.findIndex(s => s.id === id);
        if (index !== -1) {
            students.splice(index, 1);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ deleted: true, id }));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }

    } else if (path.match(/^\/api\/students(\/\d+)?$/)) {
        res.writeHead(405);
        res.end('Method Not Allowed');

    } else {
        res.writeHead(404);
        res.end('Not Found');
    }

    console.log(`[${time}] [478] ${method} ${path} ${res.statusCode}`);
});

server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
