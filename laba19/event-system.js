const EventEmitter = require('events');

const emitter = new EventEmitter();

emitter.on('greet',function(name){
	console.log(`[greet] Привет, ${name}!`);
});

emitter.on('info', function() {
	console.log(`[info] Группа: 478`);
});

emitter.on('bye', function() {
	console.log(`[bye] До свидания!`);
});

emitter.emit('greet', 'Илья');
emitter.emit('info');
emitter.emit('bye');

console.log(`Событие "unknown" без слушателей: ${emitter.emit('unknown')}`);
console.log(`Событие "greet" со слушателями: ${emitter.emit('greet', 'Илья')}`);


console.log('\n		Сравнение on и once		');

let once = 0;
emitter.on('tick', function(){
	console.log(`\n[tick #1] on-слушатель`);
});

emitter.once('tick', function(){
	once++;
	console.log(`[tick #1] once-слушатель`);
});

emitter.on('tick', function(){
	console.log(`[tick #2] on-слушатель`);
});

emitter.on('tick', function(){
	console.log(`[tick #3] on-слушатель`);
});
emitter.emit('tick');

console.log(`on-слушатель вызван: ${emitter.listenerCount('tick')} раза`);
console.log(`once-слушатель вызван: ${once} раз`);

console.log('\n		Управление подписками		');
const misha_sperma_AYE = function(){
	console.log('Hello, Wolrd!');
};
emitter.on('nekit', misha_sperma_AYE);
emitter.on('nekit', function(){});
emitter.on('nekit', function(){});
console.log(`\nСлушателей до удаления: ${emitter.listenerCount('nekit')}`);
emitter.removeListener('nekit',misha_sperma_AYE);
console.log(`Слушателей после удаления одного: ${emitter.listenerCount('nekit')}`);
emitter.removeAllListeners('nekit');
console.log(`Слушателей после removeAllListeners: ${emitter.listenerCount('nekit')}`);

console.log('\n		порядок вызова		');
emitter.on('list', function(){
	console.log('1.первый слушатель (группа 478)');	
});
emitter.on('list', function(){
	console.log('2.первый слушатель');	
});
emitter.on('list', function(){
	console.log('3.первый слушатель');	
});
console.log(`\n${emitter.listeners('list')}	`);

console.log('\n		Подключение к базе данных		');

class DatabaseConnection extends EventEmitter {
    connect() {
        this.emit('connect');
    }
    query(sql) {
        this.emit('query', sql);
    }
    close() {
        this.emit('close');
    }
    error(msg) {
        this.emit('error', new Error(msg));
    }
}

const db = new DatabaseConnection();
db.on('connect', function() {
    console.log('[EVENT] Соединение установлено');
});

db.on('query', function(sql) {
    console.log(`[EVENT] Выполнение запроса: ${sql}`);
});

db.on('close', function() {
    console.log('[EVENT] Соединение закрыто');
});

db.on('error', function(err) {
    console.log(`[EVENT] Ошибка: ${err.message}`);
});

console.log('[EVENT] Подключение к БД...');
db.connect();

db.query('SELECT * FROM students');
console.log('[EVENT] Результат: 50 записей');

db.query('INSERT INTO students');
console.log('[EVENT] Результат: 1 запись добавлена');

console.log('[EVENT] Закрытие соединения');
db.close();

console.log('\n 	 Демонстрация ошибки		 ');
db.error('Connection timeout');

console.log('\n 		 Демонстрация падения без слушателя 	');
try {
    const db2 = new DatabaseConnection();
    db2.error('Fatal database error'); 
} catch (e) {
    console.log('(без слушателя error — процесс упал бы с исключением)');
}
