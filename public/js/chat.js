// io() is a function came from "socket.io/socket.io.js" into chat
const socket = io()

// Elements.
const $MsgForm = document.querySelector('#msg-form')
const $MsgFormInput = $MsgForm.querySelector('input')
const $MsgFormBtn = $MsgForm.querySelector('button')
const $SendLocationBtn = document.querySelector('#send-location')
const $Messages = document.querySelector('#messages')
const $Sidebar = document.querySelector('#sidebar')

// Templates.
const messageTemplate = document.querySelector('#message-template').innerHTML // innerHTML --> work with html tags that into this ID
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideTemplate = document.querySelector('#sidebar-template').innerHTML

// http://localhost:3000/chat.html?username=user1&room=room1 | location.search.substring(1) should return username=user1&room=room1 without the question mark [ ? ].
const { username, room } = Qs.parse(location.search.substring(1)) // Qs is a lib inserted into chat.html that work with query.

const autoScroll = () => {
    // New message element
    const $newMessage = $Messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $Messages.offsetHeight

    // Height of messages container
    const containerHeight = $Messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $Messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $Messages.scrollTop = $Messages.scrollHeight
    }
}

socket.on('message', (msg) => { // on message from server to client
    const html = Mustache.render(messageTemplate, { // Mustache is a lib inserted into chat.html that render the template with dynamic key:value
        username: msg.username,
        msgTemp: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm A') // moment is a lib inserted into chat.html that formation time.
    })

    // insertAdjacentHTML means get html tags [from html const] and put it into Messages const that empty div into chat.html
    $Messages.insertAdjacentHTML('beforeend', html) // beforeend is internal event that means put a new message into the end of div [Messages start from top to bottom]
    autoScroll()
})

socket.on('locationMessage', (location) => {
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        locationUrl: location.url,
        createdAt: moment(location.createdAt).format('h:mm A')
    })

    $Messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sideTemplate, {
        room,
        users
    })

    $Sidebar.innerHTML = html // don't use insertAdjacentHTML to prevent repeated of room name & users.  Just use newest information
})

// Prevent user to send the same msg twice.
$MsgForm.addEventListener('submit', (e) => {
    e.preventDefault() // Prevent making full page refresh 

    $MsgFormBtn.setAttribute('disabled', 'disabled') // disable btn to prevent user click twice on it & send the same msg twice

    const msg = e.target.elements.inputMsg.value // Get value of input by its name 'inputMsg' Check input into chat.html

    socket.emit('sendMsg', msg) // emit msg from client to server

    $MsgFormBtn.removeAttribute('disabled') // remove 'disabled' atrribute to make btn enable after sending the msg.
    $MsgFormInput.value = '' // Reset value of input to make box clear from old message
    $MsgFormInput.focus() // Set cursor of input after sending a msg
})

$SendLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { // Check if client's browser doesn't support the geo location so appear alert.
        return alert('Your browser does not support the geo location!')
    }

    $SendLocationBtn.setAttribute('disabled', 'disabled') // disable btn to prevent user click twice on it & send the same msg twice


    navigator.geolocation.getCurrentPosition((position) => { // navigator.geolocation.getCurrentPosition --> Get the current location 
        // console.log(position) // Check it to get lat & long

        const lat = position.coords.latitude
        const long = position.coords.longitude

        // Third param is a callback function called acknowledge function from the client to server.
        socket.emit('sendLocation', { lat, long }, () => { // acknowledge function --> response from server to client to inform him that the action was taken correctly.

            console.log('Location shared!')

            $SendLocationBtn.removeAttribute('disabled') // remove 'disabled' atrribute to make btn enable after sending the msg.
        })


    })
})

socket.emit('join', { username, room }, (error) => {

        if (error) {
            alert(error)
                // location.href supported from developers.
            location.href = '/' // '/' --> go to root page
        }

    }) // Get username & room to join the user into the specific room