/* Type in terminal...
npm i socket.io@2.2.0 
*/
const path = require('path')
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const http = require('http')
const socketio = require('socket.io')
const { generateMessages, generateLocationUrl } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const port = process.env.PORT || 3000
const publicDir = path.join(__dirname, '../public')

const app = express()
const server = http.createServer(app) // Create http server to convert app express function to http
const io = socketio(server) // socketio take param as a http so we converted app express to http


app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')

app.use(express.json())
app.use(expressLayouts)
app.use(express.static(publicDir))

// Set up a io.on connection between server & client when new users make connection
io.on('connection', (socket) => { // connection is n built in event.
    console.log('New websocket connection')


    socket.on('join', ({ username, room }, callback) => {
        // socket.id --> generate a unique ID for every socket.
        const { error, user } = addUser({ id: socket.id, username, room }) // error & user const are return of addUser method.

        if (error) {
            return callback(error)
        }

        socket.join(user.room) // socket.join --> Let user join the specific room.
            // emit message from server to client
        socket.emit('message', generateMessages('Admin', 'Welcome!')) // message is an own event use it into chat.js file into public folder | welcome is an action to user

        socket.broadcast.to(user.room).emit('message', generateMessages('Admin', `${user.username} has joined!`)) // socket.broadcast.to(room).emit --> Send joined msg for all user into same room except the new user

        // To get all users into sidebar.
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback() // if callback is empty.. means no error.
    })

    // on message from client to server
    socket.on('sendMsg', (msg) => { // sendMsg is an own event
        const user = getUser(socket.id) // Get user by his ID
        if (user) {

            // Regx to Avoid empty msg.
            if (msg.match(/^\w+/i)) { // match --> like has .. | / / --> use regx | ^\w+ --> start with leter or char | i --> insensitive

                io.to(user.room).emit('message', generateMessages(user.username, msg)) // io.to().emit --> Send msg for all connected users into the same room
            }
        }
    })

    // Share location.
    socket.on('sendLocation', (coords, callback) => { // sendLocation is an own event
        const user = getUser(socket.id) // Get user by his ID

        if (user) {
            io.to(user.room).emit('locationMessage', generateLocationUrl(user.username, `https://www.google.com/maps?q=${coords.lat},${coords.long}`))
            callback() // call the acknowledge function that got from client to server to know that action was taken correctly or not.
        }
    })

    // Set up a socket.on disconnect from serverwhen users left the connection
    socket.on('disconnect', () => { // disconnect is n built in event.
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessages('Admin', `${user.username} has left!`)) // io.to().emit --> Send msg for all connected users in the same room

            // To get all users into sidebar.
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })

        }

    })
})

server.listen(port, () => {
    console.log('Conneting to port: ' + port)
})