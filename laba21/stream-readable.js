const { Readable } = require('stream');

console.log('	Демонстрация Readable-потока		');

const data = [
    "Группа: 478",
    "Студент: Дема Илья",
    "Лабораторная работа: №21",
    "Тема: Потоки в Node.js"
];

let index = 0;

const myReadable = new Readable({
    highWaterMark: 1,
    read() {
        if (index < data.length) {
            this.push(data[index]);
            index++;
        } else {
            this.push(null);
        }
    }
});

let count = 0;

myReadable.on('data', function(chunk) {
    count++;
    console.log(`[CHUNK ${count}] ${chunk.toString()}`);
});

myReadable.on('end', function() {
    console.log(`\n[END] Поток завершен`);
    console.log(`Всего получено чанков: ${count}`);
});
