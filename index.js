require('dotenv').config();
const app = require('express')();
const https = require('https');
const fs = require('fs');
const https_options = {
          key: fs.readFileSync('ssl/privkey.pem'),
          cert: fs.readFileSync('ssl/fullchain.pem'),
          requestCert: true
	};
const server = https.createServer(https_options, app);

const io = require('socket.io')(server,{
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

io.on(EVENTS.connection, (socket) => {
  let conversation = null
  console.log('[[CONNECTION]] ', Date.now(), socket.id)

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
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Socket.IO server running at port: ${port}/`);
});
