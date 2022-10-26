require('dotenv').config();
const app = require('express')();
const https = require('https');
const fs = require('fs');
const https_options = {
        key: fs.readFileSync('/home/ubuntu/socket_io/ssl/privkey.pem'),
        cert: fs.readFileSync('/home/ubuntu/socket_io/ssl/fullchain.pem'),
        requestCert: true,
        ca:[
	  fs.readFileSync('/home/ubuntu/apps/myapp/shared/ssl/socket_cert.pem')
	]};
const server = https.createServer(https_options, app);

const ios = require('socket.io')(server,{
  cors: {
    origin: ["https://idol.gotechjsc.com", "https://idol-front.gotechjsc.com"],
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
    next(); 
})

const EVENTS = {
  connection: 'connection',
  disconnect: 'disconnect',
  USER_SEND: 'USER_SEND',
  JOIN_CONVERSATION: 'JOIN_CONVERSATION',
  LEAVE_CONVERSATION: 'LEAVE_CONVERSATION',
  CONVERSATION_SEND: 'CONVERSATION_SEND',
}

let sequenceNumberByClient = new Map();
ios.on(EVENTS.connection, (socket) => {
  let conversation = null
  console.log('[[CONNECTION]] ', Date.now(), socket.id)
  sequenceNumberByClient.set(socket, 1);

  socket.on(EVENTS.USER_SEND, (...args) => {
    console.log(socket.rooms, ...args)
    if (!conversation) return

    socket.to(conversation).emit(EVENTS.CONVERSATION_SEND, args)
  });

  socket.on(EVENTS.JOIN_CONVERSATION, ({ conversation_id }) => {
    if (!conversation_id) return

    conversation && socket.leave(conversation)
    conversation = `CONVERSATION::${conversation_id}`
    socket.join(conversation)
  });

  socket.on(EVENTS.disconnect, () => {
    sequenceNumberByClient.delete(socket);
    console.info(`Client gone [id=${socket.id}]`);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Socket.IO server running at port: ${port}/`);
});

const io = require("socket.io-client");
const ioClient = io(`https://idol.gotechjsc.com:${port}`, {
  key: readFileSync("/home/ubuntu/apps/myapp/shared/ssl/socket_key.pem"),
  cert: readFileSync("/home/ubuntu/apps/myapp/shared/ssl/socket_cert.pem"),
  ca: [
    readFileSync("/home/ubuntu/socket_io/ssl/fullchain.pem")
  ],
  secure: true,
  reconnection: true,
  rejectUnauthorized: false
});
ioClient.on(EVENTS.CONVERSATION_SEND, (msg) => console.info('Simulated client: ' + msg));
