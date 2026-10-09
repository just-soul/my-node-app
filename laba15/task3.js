const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
    const start = Date.now();
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);

    await next();

    const ms = Date.now() - start;
    console.log(`[${time}] ${ctx.method} ${ctx.path} - ${ms}ms`);
});

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            error: err.message || 'внутренняя ошибка сервера',
            status: ctx.status
        };
    }
});
async function auth(ctx, next) {
    const header = ctx.headers.authorization;

    if (!header) {
        ctx.status = 401;
        ctx.body = { error: 'нет заголовка Authorization' };
        return;
    }

    await next();
}

router.get('/', (ctx) => {
    ctx.body = { message: 'главная страница' };
});

router.get('/protected', auth, (ctx) => {
    ctx.body = { message: 'доступ разрешён', token: ctx.headers.authorization };
});

router.get('/error', () => {
    throw new Error('тестовая ошибка');
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000, () => {
    console.log('сервер запущен на 3000');
});
