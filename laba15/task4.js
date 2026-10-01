const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

let students = [
    { id: 1, name: 'илюша', group: '478', course: 2 },
    { id: 2, name: 'некит', group: '478', course: 3 },
    { id: 3, name: 'миша', group: '3210', course: 1 }
];
let nextId = 4;

router.get('/students', (ctx) => {
    const { group } = ctx.query;

    if (group) {
        ctx.body = students.filter(s => s.group === group);
        return;
    }

    ctx.body = students;
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

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
    console.log('сервер запущен на 3000');
});
