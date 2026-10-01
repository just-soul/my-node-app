const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

let users = [
    { id: 1, name: 'Иванов Иван', group: 'ББМО-01-23' }
];
let nextId = 2;

router.get('/api/users', (ctx) => {
    ctx.body = users;
});

router.post('/api/users', (ctx) => {
    const { name, group } = ctx.request.body;

    if (!name || !group) {
        ctx.status = 400;
        ctx.body = { error: 'нужны name и group' };
        return;
    }

    const user = { id: nextId++, name, group };
    users.push(user);
    ctx.status = 201;
    ctx.body = user;
});

router.put('/api/users/:id', (ctx) => {
    const id = Number(ctx.params.id);
    const user = users.find(u => u.id === id);

    if (!user) {
        ctx.status = 404;
        ctx.body = { error: 'нет такого юзера' };
        return;
    }

    const { name, group } = ctx.request.body;

    if (!name || !group) {
        ctx.status = 400;
        ctx.body = { error: 'нужны name и group' };
        return;
    }

    user.name = name;
    user.group = group;
    ctx.body = user;
});

router.delete('/api/users/:id', (ctx) => {
    const id = Number(ctx.params.id);
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        ctx.status = 404;
        ctx.body = { error: 'нет такого юзера' };
        return;
    }

    users.splice(index, 1);
    ctx.body = { message: 'удалён' };
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
    console.log('сервер запущен на 3000');
});
