require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function main() {
    try {
        await client.connect();
        const db = client.db('478');
        const students = db.collection('students');
        const buildInfo = await db.admin().command({ buildInfo: 1 });
        console.log('Версия MongoDB:', buildInfo.version);

        const dbList = await db.admin().listDatabases();
        console.log('Список БД:', dbList.databases.map(d => d.name).join(', '));

        console.log('\n   Heartbeat');
        client.on('serverHeartbeatSucceeded', () => {
            console.log('[HEARTBEAT] Успешно: ' + new Date().toISOString());
        });
        await new Promise(r => setTimeout(r, 2000));

        await students.deleteMany({});

        console.log('\n  INSERT');
        const insertOneResult = await students.insertOne({
            name: 'Danik',
            group_name: '478',
            course: 2,
            grade: 4.5,
            created_at: new Date()
        });
        console.log('Вставлен: insertedId=' + insertOneResult.insertedId);

        const insertManyResult = await students.insertMany([
            { name: 'Ilya', group_name: '478', course: 2, grade: 3.8, created_at: new Date() },
            { name: 'Den', group_name: '478', course: 3, grade: 4.2, created_at: new Date() }
        ]);
        console.log('Вставлено 2 документа');

        console.log('\n   SELECT');
        const allDocs = await students.find({}).toArray();
        console.log('Все документы (' + allDocs.length + '):');
        for (let doc of allDocs) {
            console.log(`{ name: "${doc.name}", group: "${doc.group_name}", grade: ${doc.grade} }`);
        }

        const filtered = await students.find({ group_name: '478' }).sort({ grade: -1 }).toArray();
        console.log('\nС фильтром по группе (сортировка по grade):');
        for (let doc of filtered) {
            console.log(`{ name: "${doc.name}", grade: ${doc.grade} }`);
        }

        const projected = await students.find({}, { projection: { name: 1, grade: 1, _id: 0 } }).toArray();
        console.log('\nС проекцией (только name, grade):');
        for (let doc of projected) {
            console.log(`{ name: "${doc.name}", grade: ${doc.grade} }`);
        }

        console.log('\n   UPDATE');
        const updateOneResult = await students.updateOne(
            { name: 'Danik' },
            { $set: { grade: 4.8 } }
        );
        console.log(`updateOne: matchedCount=${updateOneResult.matchedCount}, modifiedCount=${updateOneResult.modifiedCount}`);

        const updateManyResult = await students.updateMany(
            { group_name: '478' },
            { $inc: { course: 1 } }
        );
        console.log(`updateMany (course+1): matchedCount=${updateManyResult.matchedCount}`);

        console.log('\n   DELETE');
        const deleteOneResult = await students.deleteOne({ name: 'Ilya' });
        console.log(`deleteOne: deletedCount=${deleteOneResult.deletedCount}`);

        const deleteManyResult = await students.deleteMany({ grade: { $lt: 4.0 } });
        console.log(`deleteMany (grade < 4.0): deletedCount=${deleteManyResult.deletedCount}`);

        console.log('\n Генерация 10000 документов');
        const bulkDocs = [];
        for (let i = 0; i < 10000; i++) {
            bulkDocs.push({
                name: `Студент_${i}`,
                group_name: i % 2 === 0 ? '478' : '478',
                course: (i % 4) + 1,
                grade: 3 + Math.random() * 2
            });
        }
        await students.insertMany(bulkDocs);
        console.log('Документы добавлены');

        console.log('\n   Курсоры (for await)');
        let count = 0;
        const cursor = students.find({}).batchSize(1000);
        for await (const doc of cursor) {
            count++;
        }
        console.log(`Итерация через for await: получено ${count} документов`);

        console.log('\n  Агрегации');
        const avgGrades = await students.aggregate([
            { $group: { _id: '$group_name', avgGrade: { $avg: '$grade' } } }
        ]).toArray();
        console.log('Средний балл по группам:');
        for (let item of avgGrades) {
            console.log(`  ${item._id}: ${item.avgGrade.toFixed(2)}`);
        }

        const countByCourse = await students.aggregate([
            { $group: { _id: '$course', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).toArray();
        console.log('Количество по курсам:');
        for (let item of countByCourse) {
            console.log(`  ${item._id} курс: ${item.count}`);
        }

        await db.collection('groups').deleteMany({});
        await db.collection('groups').insertMany([
            { group_name: '478', curator: 'Misha' },
            { group_name: '478', curator: 'Nekit' }
        ]);
        const lookupResult = await students.aggregate([
            { $match: { group_name: '478' } },
            { $limit: 1 },
            { $lookup: { from: 'groups', localField: 'group_name', foreignField: 'group_name', as: 'group_info' } },
            { $unwind: '$group_info' },
            { $project: { group_name: 1, 'group_info.curator': 1, _id: 0 } }
        ]).toArray();
        console.log('$lookup (JOIN с groups):');
        for (let item of lookupResult) {
            console.log(`  { group_name: "${item.group_name}", curator: "${item.group_info.curator}" }`);
        }

        console.log('\n  Индексы');
        await students.createIndex({ group_name: 1 });
        console.log('Создан индекс: group_name_1');

        await students.createIndex({ group_name: 1, grade: -1 });
        console.log('Создан индекс: group_name_1_grade_-1');

        const explainNoIndex = await students.find({ name: 'Студент_100' }).explain('executionStats');
        console.log('\nexplain() без индекса:');
        console.log(`  executionTimeMillis: ${explainNoIndex.executionStats.executionTimeMillis}`);
        console.log(`  totalDocsExamined: ${explainNoIndex.executionStats.totalDocsExamined}`);

        await students.createIndex({ name: 1 });
        const explainWithIndex = await students.find({ name: 'Студент_100' }).explain('executionStats');
        console.log('\nexplain() с индексом:');
        console.log(`  executionTimeMillis: ${explainWithIndex.executionStats.executionTimeMillis}`);
        console.log(`  totalDocsExamined: ${explainWithIndex.executionStats.totalDocsExamined}`);

        console.log('\n  Текстовый поиск');
        await students.createIndex({ name: 'text' });
        console.log('Создан текстовый индекс: name_text');

        const textSearch = await students.find({ $text: { $search: 'Misha' } }).toArray();
        console.log(`find({ $text: { $search: "Misha" } }):`);
        console.log(`  Найдено: ${textSearch.length} документов`);

    } catch (err) {
        console.error('Ошибка:', err.message);
    } finally {
        await client.close();
        console.log('\nСоединение закрыто');
    }
}

main();
