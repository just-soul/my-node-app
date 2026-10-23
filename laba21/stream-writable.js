const { Writable } = require('stream');

console.log('	Демонстрация Writable-потока		');

let count = 0;

const myWritable = new Writable({
    highWaterMark: 16,
    write(chunk, encoding, callback) {
        count++;
        console.log(`[WRITE] ${chunk.toString()}`);
        callback();
    }
});

myWritable.on('drain', function() {
    console.log('[DRAIN] Буфер освобожден, продолжаем запись');
});

myWritable.on('finish', function() {
    console.log(`\n[FINISH] Все данные записаны`);
    console.log(`Всего записано: ${count} чанка`);
});

console.log(`write() вернул: ${myWritable.write("Группа: 478")}`);
console.log(`write() вернул: ${myWritable.write("Студент: Дема Илья")}`);
console.log(`write() вернул: ${myWritable.write("Лабораторная работа: №21")} <- буфер переполнен!`);

myWritable.once('drain', function() {
    console.log(`write() вернул: ${myWritable.write("Тема: Потоки в Node.js")}`);
    myWritable.end();
});
