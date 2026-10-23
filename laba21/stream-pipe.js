const fs = require('fs');
const { pipeline, Transform } = require('stream');

fs.writeFileSync('input.txt', 'A'.repeat(1024));

console.log('   Демонстрация pipe()');
console.log('Чтение: input.txt');
console.log('Запись: output-pipe.txt');

const read1 = fs.createReadStream('input.txt');
const write1 = fs.createWriteStream('output-pipe.txt');

read1.pipe(write1);

write1.on('finish', function() {
    console.log('Копирование завершено');
    const stats = fs.statSync('output-pipe.txt');
    console.log(`Размер: ${stats.size} байт`);
    setTimeout(part2, 100);
});

function part2() {
    console.log('\n   Демонстрация pipe() с ошибкой ');
    console.log('Чтение: missing.txt');

    const read2 = fs.createReadStream('missing.txt');
    const write2 = fs.createWriteStream('output-err.txt');

    read2.on('error', function(err) {
        console.log('Ошибка: ENOENT: no such file or directory');
        console.log('Внимание: pipe() не закрыл целевой поток!');
        console.log('Возможна утечка памяти.');

        setTimeout(part3, 100);
    });

    read2.pipe(write2);
}

function part3() {
    console.log('\n   Демонстрация pipeline()');
    console.log('Чтение: input.txt');
    console.log('Запись: output-pipeline.txt');

    pipeline(
        fs.createReadStream('input.txt'),
        fs.createWriteStream('output-pipeline.txt'),
        function(err) {
            if (err) {
                console.log('Ошибка:', err.message);
            } else {
                console.log('Копирование завершено');
                setTimeout(part4, 100);
            }
        }
    );
}

function part4() {
    console.log('\n   Демонстрация pipeline() с ошибкой');
    console.log('Чтение: missing.txt');

    pipeline(
        fs.createReadStream('missing.txt'),
        fs.createWriteStream('output-err2.txt'),
        function(err) {
            if (err) {
                console.log('Ошибка: ENOENT: no such file or directory');
                console.log('Все потоки автоматически закрыты');
                console.log('Утечек нет');
                setTimeout(part5, 100);
            }
        }
    );
}

function part5() {
    console.log('\n   Цепочка потоков');
    console.log('input.txt → uppercase → reverse → output-chain.txt');

    const upperCaseTransform = new Transform({
        transform(chunk, encoding, callback) {
            this.push(chunk.toString().toUpperCase());
            callback();
        }
    });

    const reverseTransform = new Transform({
        transform(chunk, encoding, callback) {
            const reversed = chunk.toString().split('').reverse().join('');
            this.push(reversed);
            callback();
        }
    });

    pipeline(
        fs.createReadStream('input.txt'),
        upperCaseTransform,
        reverseTransform,
        fs.createWriteStream('output-chain.txt'),
        function(err) {
            if (err) {
                console.log('Ошибка:', err.message);
            } else {
                console.log('Обработка завершена');
            }
        }
    );
}
