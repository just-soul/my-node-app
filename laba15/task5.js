const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

const firstNames = ['миша', 'Петр', 'Анна', 'Мария', 'Алексей', 'Ольга', 'Дмитрий', 'Екатерина', 'Сергей', 'Наталья'];
const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Смирнов', 'Попов', 'Волков', 'Морозов', 'Новиков', 'Федоров'];
const groups = ['ББМО-01-23', 'ББМО-02-23', 'ББМО-03-23', 'ББМО-04-23'];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

let students = [];
for (let i = 1; i <= 50; i++) {
    students.push({
        id: i,
        name: `${randomItem(lastNames)} ${randomItem(firstNames)}`,
        group: randomItem(groups),
        course: Math.floor(Math.random() * 4) + 1
    });
}
let nextId = 51;

app.use(bodyParser());

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    console.log(`${ctx.method} ${ctx.url} - ${Date.now() - start}ms`);
});

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = { error: err.message, status: ctx.status };
    }
});

router.get('/students', (ctx) => {
    let result = [...students];
    const { search } = ctx.query;
    if (search) {
        result = result.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    const { sort } = ctx.query;
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
    const limit = Number(ctx.query.limit) || 10;
    const offset = Number(ctx.query.offset) || 0;
    result = result.slice(offset, offset + limit);

    ctx.body = { total, limit, offset, data: result };
});

router.get('/students/:id', (ctx) => {
    const id = Number(ctx.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        ctx.status = 404;
        ctx.body = { error: 'студент не найден' };
        return;
    }

    ctx.body = student;
});

router.post('/students', (ctx) => {
    const { name, group, course } = ctx.request.body;

    if (!name || !group || !course) {
        ctx.status = 400;
        ctx.body = { error: 'нужны name, group, course' };
        return;
    }

    const student = { id: nextId++, name, group, course };
    students.push(student);
    ctx.status = 201;
    ctx.body = student;
});

router.put('/students/:id', (ctx) => {
    const id = Number(ctx.params.id);
    const student = students.find(s => s.id === id);

    if (!student) {
        ctx.status = 404;
        ctx.body = { error: 'студент не найден' };
        return;
    }

    const { name, group, course } = ctx.request.body;
    if (name) student.name = name;
    if (group) student.group = group;
    if (course) student.course = course;

    ctx.body = student;
});

router.delete('/students/:id', (ctx) => {
    const id = Number(ctx.params.id);
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        ctx.status = 404;
        ctx.body = { error: 'студент не найден' };
        return;
    }

    students.splice(index, 1);
    ctx.body = { message: 'студент удалён' };
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
    console.log('сервер запущен на 3000');
    console.log(`сгенерировано студентов: ${students.length}`);
});
