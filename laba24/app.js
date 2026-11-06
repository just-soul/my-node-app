require('dotenv').config();
const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const { Pool } = require('pg');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = new Koa();
const router = new Router();
const pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const userSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    group_name: Joi.string().required(),
    age: Joi.number().min(16).max(100),
    course: Joi.number().min(1).max(4),
    password: Joi.string().min(6)
});

app.use(async (ctx, next) => {
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await next();
    console.log(`[${time}] ${ctx.method} ${ctx.url} ${ctx.status}`);
});

app.use(async (ctx, next) => {
    ctx.set('X-Group', '478');
    ctx.db = pool;
    await next();
});

app.use(bodyParser());

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = { error: err.message || 'Внутренняя ошибка сервера' };
        console.error('Ошибка:', err.message);
    }
});

router.get('/api/users', async (ctx) => {
    const { page = 1, limit = 10, sort = 'name', group_name, course, search } = ctx.query;

    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1 || l > 100) ctx.throw(400, 'Неверные параметры пагинации');

    let query = 'SELECT id, name, email, group_name, age, course FROM users WHERE 1=1';
    let values = [];
    let count = 1;

    if (group_name) {
        query += ` AND group_name = $${count++}`;
        values.push(group_name);
    }
    if (course) {
        query += ` AND course = $${count++}`;
        values.push(Number(course));
    }
    if (search) {
        query += ` AND (name ILIKE $${count} OR email ILIKE $${count})`;
        values.push(`%${search}%`);
        count++;
    }

    const allowedSorts = ['name', 'age', 'course'];
    let sortField = 'name';
    let sortOrder = 'ASC';

    if (sort) {
        if (sort.startsWith('-')) {
            sortField = sort.slice(1);
            sortOrder = 'DESC';
        } else {
            sortField = sort;
        }
        if (!allowedSorts.includes(sortField)) sortField = 'name';
    }
    query += ` ORDER BY ${sortField} ${sortOrder}`;

    query += ` LIMIT $${count++} OFFSET $${count++}`;
    values.push(l, (p - 1) * l);

    const result = await ctx.db.query(query, values);

    const totalRes = await ctx.db.query('SELECT COUNT(*) FROM users');
    const total = Number(totalRes.rows[0].count);

    ctx.body = {
        data: result.rows,
        pagination: { total, page: p, limit: l, pages: Math.ceil(total / l) }
    };
});

router.get('/api/users/stats', async (ctx) => {
    const stats = await ctx.db.query(`
        SELECT
            COUNT(*) as total,
            AVG(age) as average_age
        FROM users
    `);

    const byGroup = await ctx.db.query(`
        SELECT group_name, COUNT(*) as count
        FROM users GROUP BY group_name
    `);

    ctx.body = {
        total: Number(stats.rows[0].total),
        averageAge: Number(stats.rows[0].average_age || 0).toFixed(1),
        byGroup: byGroup.rows
    };
});

router.post('/api/users', async (ctx) => {
    const { error, value } = userSchema.validate(ctx.request.body);
    if (error) {
        ctx.status = 400;
        ctx.body = { error: 'Validation failed', details: error.details.map(d => d.message) };
        return;
    }

    const existing = await ctx.db.query('SELECT id FROM users WHERE email = $1', [value.email]);
    if (existing.rows.length > 0) {
        ctx.status = 409;
        ctx.body = { error: 'Пользователь с таким email уже существует' };
        return;
    }

    let hashedPassword = null;
    if (value.password) {
        hashedPassword = await bcrypt.hash(value.password, 10);
    }

    const result = await ctx.db.query(
        'INSERT INTO users (name, email, group_name, age, course, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, group_name',
        [value.name, value.email, value.group_name, value.age || null, value.course || null, hashedPassword]
    );

    ctx.status = 201;
    ctx.body = { data: result.rows[0] };
});

router.get('/api/users/:id', async (ctx) => {
    const result = await ctx.db.query('SELECT id, name, email, group_name, age, course FROM users WHERE id = $1', [ctx.params.id]);
    if (result.rows.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Пользователь не найден' };
        return;
    }
    ctx.body = { data: result.rows[0] };
});

router.put('/api/users/:id', async (ctx) => {
    const { name, email, group_name, age, course } = ctx.request.body;
    const result = await ctx.db.query(
        'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), group_name = COALESCE($3, group_name), age = COALESCE($4, age), course = COALESCE($5, course) WHERE id = $6 RETURNING id, name, email',
        [name, email, group_name, age, course, ctx.params.id]
    );

    if (result.rows.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Пользователь не найден' };
        return;
    }
    ctx.body = { data: result.rows[0] };
});

router.delete('/api/users/:id', async (ctx) => {
    const result = await ctx.db.query('DELETE FROM users WHERE id = $1', [ctx.params.id]);
    if (result.rowCount === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Пользователь не найден' };
        return;
    }
    ctx.body = { data: { deleted: true } };
});

router.post('/api/auth/register', async (ctx) => {
    const { name, email, password } = ctx.request.body;

    if (!name || !email || !password) {
        ctx.throw(400, 'Заполните name, email и password');
    }

    const existing = await ctx.db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) ctx.throw(409, 'Email уже занят');

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await ctx.db.query(
        'INSERT INTO users (name, email, group_name, password) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, '478', hashedPassword]
    );

    ctx.body = { message: 'Зарегистрирован', userId: result.rows[0].id };
});

router.post('/api/auth/login', async (ctx) => {
    const { email, password } = ctx.request.body;

    const result = await ctx.db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) ctx.throw(401, 'Неверный email или пароль');

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password || '');
    if (!isValid) ctx.throw(401, 'Неверный email или пароль');

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    ctx.body = { accessToken: token };
});

app.use(router.routes());

async function main() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            group_name VARCHAR(20) NOT NULL,
            age INT,
            course INT,
            password VARCHAR(100)
        )
    `);

    app.listen(3000, () => {
        console.log('PostgreSQL подключена');
        console.log('Koa-сервер на порту 3000');
        console.log('Группа: 478');
    });
}

main().catch(console.error);
