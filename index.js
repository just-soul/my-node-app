const http = require('http');

const fio = "";
const group = 478;
const journal_number = 6; 

const EventEmitter = require('events');
const fs = require('fs');
const {setupLogger} = require('./logger')
class AppServer extends EventEmitter{
	start(port){
		this.server = http.createServer((req, res)=>{
			setTimeout(()=>{
				this.emit('request:received',{url: req.url, method: req.method});},2000);
				res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
			 	res.end(`
    				<p>ФИО: ${fio}</p>
					<p>ГРУППА: ${group}</p>
					<p>ЧИСЛО ПИ:  ${journal_number} ${piValue}</p>
    				`);
    				});

		this.server.listen(port, ()=>{
			this.emit('server:started', port);});
		}
		stop(){
			setTimeout(()=>{
				this.server.close(()=>{
					this.emit('server:stopped');
					});

				},10000);
			}	
		}	
  
function PI(precision) {
	const pi = 355/113
	return pi.toFixed(precision);
}
const piValue = PI(journal_number);

const server = new AppServer();
setupLogger(server);
server.on('server:started',(port)=>{
	console.log(`Сервер запущен на порту: ${port}`);
}); 
server.on('request:received',(req) =>{
	console.log(`Получен запрос: ${req.url} ${req.method}`);
});
server.on('server:stopped',()=>{
	console.log(`Сервер остановлен`);
});
server.start(8080);
server.stop();
    //   http://localhost:8080

