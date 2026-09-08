const http = require('http');

const fio = "Дема Илья Максимович";
const group = 478;
const journal_number = 6;  

function PI(precision) {
	const pi = 355/113
	return pi.toFixed(precision);
}
const piValue = PI(journal_number);



const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
    	<p>ФИО: ${fio}</p>
		<p>ГРУППА: ${group}</p>
		<p>ЧИСЛО ПИ: ${journal_number} ${piValue}</p>
    	`);
});

server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
