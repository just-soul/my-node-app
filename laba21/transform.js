const { Transform, Readable, Writable, pipeline } = require('stream');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const upperCase = new Transform({
        transform(chunk, encoding, callback) {
            const input = chunk.toString();
            console.log(`Вход: "${input}"`);
            const output = `[478] ${input.toUpperCase()}`;
            this.push(output);
            callback();
        }
    });

    upperCase.on('data', function(chunk) {
        console.log(`Выход: "${chunk.toString()}"`);
    });

    upperCase.write("группа 478");
    upperCase.write("студент Misha");

    await sleep(100);

    console.log('\n   Демонстрация Object Mode');
    const students = [
        { id: 1, name: "Misha", group: "478" },
        { id: 2, name: "Nekit", group: "478" },
        { id: 3, name: "Миша", group: "322" }
    ];

    for (let s of students) {
        console.log(`[OBJECT] { id: ${s.id}, name: "${s.name}", group: "${s.group}" }`);
    }

    console.log('После фильтрации (478):');
    for (let s of students) {
        if (s.group === '478') {
            console.log(`[OBJECT] { id: ${s.id}, name: "${s.name}", group: "${s.group}" }`);
        }
    }

    await sleep(100);

    console.log('\n    Демонстрация async iterator');
    const asyncSource = Readable.from(["Данные 1", "Данные 2", "Данные 3"]);
    let chunkCount = 0;

    for await (const chunk of asyncSource) {
        chunkCount++;
        console.log(`[ASYNC] Получен чанк ${chunkCount}: "${chunk.toString()}"`);
    }
    console.log('[ASYNC] Поток завершён');

    await sleep(100);

    console.log('\n    Цепочка Transform');
    console.log('Читаем -> UpperCase -> Filter -> Записываем');

    const lines = [];
    for (let i = 1; i <= 10; i++) lines.push(`строка ${i}`);

    let processed = 0;
    let filtered = 0;

    const t1 = new Transform({
        transform(chunk, encoding, callback) {
            processed++;
            this.push(chunk.toString().toUpperCase());
            callback();
        }
    });

    const t2 = new Transform({
        transform(chunk, encoding, callback) {
            if (chunk.toString().includes('1')) {
                this.push(chunk);
            } else {
                filtered++;
            }
            callback();
        }
    });

    const w = new Writable({
        write(chunk, encoding, callback) {
            callback();
        }
    });

    pipeline(Readable.from(lines), t1, t2, w, function(err) {
        if (err) console.log(err);
        console.log(`Обработано ${processed} строк, отфильтровано ${filtered}`);
    });
}

main();
