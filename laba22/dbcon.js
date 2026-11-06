require('dotenv').config();
const { Client, Pool } = require('pg');
const QueryStream = require('pg-query-stream');
const pool = new Pool({
    host: process.env.DB_HOST,
    port: 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10
});

async function task1() {

    console.log('\n  одиночное соединение ');
    const client = new Client({
        host: process.env.DB_HOST,
        port: 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await client.connect();
        console.log('Подключение установлено');

        const res = await client.query('SELECT version(), current_database(), current_user');
        console.log('Версия БД:', res.rows[0].version.split(',')[0]);
        console.log('Текущая БД:', res.rows[0].current_database);
        console.log('Пользователь:', res.rows[0].current_user);
        await client.end();
        console.log('Соединение закрыто');
    } catch (err) {
        console.log('Ошибка подключения:', err.code);
    }

    console.log('\n  Пул соединений ');
    console.log('Пул создан (лимит: 10)');

    const poolRes = await pool.query('SELECT version(), current_database()');
    console.log('Версия БД:', poolRes.rows[0].version.split(',')[0]);
    console.log('Текущая БД:', poolRes.rows[0].current_database);
    console.log('Соединений в пуле: 10');
    console.log('Пул готов к работе');
}

async function task2() {
    console.log('\n    Создание таблицы');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            group_name VARCHAR(20) NOT NULL,
            course INT NOT NULL,
            grade NUMERIC(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Таблица students создана');

    console.log('\n  INSERT');
    const res1 = await pool.query(
        'INSERT INTO students (name, group_name, course, grade) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Misha', '478', 2, 4.50]
    );
    const id1 = res1.rows[0].id;
    console.log(`Вставлен студент: id=${id1}, rowCount=${res1.rowCount}`);

    const res2 = await pool.query(
        'INSERT INTO students (name, group_name, course, grade) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8) RETURNING id',
        ['Misha', '478', 2, 3.80, 'Nekit', '478', 3, 4.20]
    );
    console.log(`Вставлено 2 студента: rowCount=${res2.rowCount}`);

    console.log('\n  SELECT');
    const all = await pool.query('SELECT * FROM students');
    console.log('Все студенты:');
    for (let s of all.rows) {
        console.log(`id=${s.id}, name=${s.name}, group=${s.group_name}, grade=${s.grade}`);
    }

    console.log('\nСтуденты группы 478 (сортировка по grade):');
    const sorted = await pool.query('SELECT * FROM students WHERE group_name = $1 ORDER BY grade DESC', ['ББМО-01-23']);
    for (let s of sorted.rows) {
        console.log(`id=${s.id}, name=${s.name}, grade=${s.grade}`);
    }

    console.log('\n   UPDATE');
    const upd = await pool.query('UPDATE students SET grade = $1 WHERE id = $2', [4.80, id1]);
    console.log(`Обновлён студент id=${id1}: rowCount=${upd.rowCount}`);

    console.log('\n   DELETE');
    const del = await pool.query('DELETE FROM students WHERE id = $1', [id1]);
    console.log(`Удалён студент id=${id1}: rowCount=${del.rowCount}`);

    console.log('\n   Защита от SQL-инъекции');
    const attack = "' OR 1=1; DROP TABLE students; --";
    const safe = await pool.query('SELECT * FROM students WHERE name = $1', [attack]);
    console.log(`Попытка инъекции: "${attack}"`);
    console.log('Параметризованный запрос безопасен (найдено строк: ' + safe.rowCount + ')');
}

async function task3() {
    console.log('\n  Ошибки, Транзакции, Стриминг');

    console.log('\n    Демонстрация ошибок');
    const badClient = new Client({ host: 'localhost', port: 9999 });
    try {
        await badClient.connect();
    } catch (err) {
        console.log(`[${err.code}] Сервер недоступен: localhost:9999`);
    }

    const badPass = new Client({
        host: process.env.DB_HOST, port: 5432, user: process.env.DB_USER,
        password: 'wrong_pass', database: process.env.DB_NAME
    });
    try {
        await badPass.connect();
    } catch (err) {
        console.log(`[${err.code}] Неверный пароль для пользователя ${process.env.DB_USER}`);
    }

    try {
        await pool.query('SELECT * FRM students');
    } catch (err) {
        console.log(`[${err.code}] Синтаксическая ошибка: ${err.message}`);
    }

    await pool.query('CREATE TABLE IF NOT EXISTS test_dup (id INT PRIMARY KEY)');
    await pool.query('INSERT INTO test_dup VALUES (1)');
    try {
        await pool.query('INSERT INTO test_dup VALUES (1)');
    } catch (err) {
        console.log(`[${err.code}] Дублирование ключа: id=1`);
    }

    try {
        await pool.query('INSERT INTO students (name, group_name) VALUES (NULL, $1)', ['test']);
    } catch (err) {
        console.log(`[${err.code}] NULL в NOT NULL столбце: name`);
    }

    console.log('\n  Транзакция');
    const txClient = await pool.connect();
    try {
        await txClient.query('BEGIN');
        console.log('Начало транзакции');

        await txClient.query('INSERT INTO students (name, group_name, course) VALUES ($1, $2, $3)', ['Транзакт1', '478', 1]);
        console.log('INSERT 1 выполнен');

        await txClient.query('INSERT INTO students (name, group_name, course) VALUES ($1, $2, $3)', ['Транзакт2', '478', 1]);
        console.log('INSERT 2 выполнен');
        throw new Error('Искусственная ошибка для отката');
    } catch (e) {
        await txClient.query('ROLLBACK');
        console.log(`Ошибка: ${e.message}`);
        console.log('Rollback выполнен');
    } finally {
        txClient.release();
        console.log('Соединение возвращено в пул');
    }

    console.log('\n  Потоковый запрос');
    console.log('Генерация данных...');

    for (let i = 0; i < 50; i++) {
        await pool.query('INSERT INTO students (name, group_name, course, grade) VALUES ($1, $2, $3, $4)',
        [`Студент_${i}`, '478', 2, 3.5]);
    }

    console.log('Чтение записей через stream...');
    let count = 0;

    const streamClient = await pool.connect();
    const query = new QueryStream('SELECT * FROM students');
    const stream = streamClient.query(query);

    stream.on('data', function(row) {
        count++;
    });

    stream.on('end', function() {
        console.log(`[STREAM] Получено: ${count} записей`);
        streamClient.release();
        console.log('\nВсе задания выполнены');
        pool.end();
        process.exit(0);
    });
}

async function main() {
    await task1();
    await task2();
    await task3();
}

main();
