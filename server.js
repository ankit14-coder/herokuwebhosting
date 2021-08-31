const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessages = require('./utils/messages');

const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

const botName= "ChatCord Bot";

io.on('connection', socket => {
    console.log('New websocket Connection...');

    socket.on('joinRoom',({username,room})=>{

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessages(botName,
            'Welcome to ChatCord!'));
        socket.broadcast.to(user.room).emit('message',
            formatMessages(botName,` ${user.username} Joined The chat`)
            );
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    

    

    //Listen For chat Message
    socket.on('chatMessage', msg=>{
        const user = getCurrentUser(socket.id);

        console.log(msg);
        io.to(user.room).emit('message',formatMessages(user.username, msg));
    });

    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`)
            );

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

    
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));