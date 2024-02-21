/*
    This project uses the following packages and referenced these sources.
    https://webRTC.org - Webrtc for video connection
    https://www.npmjs.com/package/express - ExpressJS for HTTP servers
    https://www.npmjs.com/package/websocket - websocket package for WebSockets
    https://www.npmjs.com/package/nodemon - Nodemon for hosting local servers during development
    https://stackoverflow.com/questions/14273978/integrating-websockets-with-a-standard-http-server - Stack Overflow post where the majority of the websocket server code
    was taken from
*/


//Called when client wants to create a room
async function createRoom() {
    //Creates a unique id with a random hexadecimal number
    //Not actually unique, but its very unlikely for them to be the same
    var uid = Math.random().toString(16).slice(9);

    //Sets the uid in session storage
    //We use session storage because we only have to store it until the browser closes
    await sessionStorage.setItem(uid, true);
    await sessionStorage.setItem("Room Key", uid);
    
    //Takes you to the actual room page
    let editedString = window.location.href.replace(/index.html/, '');
    window.location.href = editedString + 'chat-page/index.html';
}

let roomKeyInput = document.getElementById("Room Key Input");

//Called when the client joins a room with a room key
async function joinRoom() {
    //Reads the input
    let uid = roomKeyInput.value;
    console.log(uid);

    //Sets the room key for this session
    await sessionStorage.setItem("Room Key", uid);

    //Takes you to the room page
    let editedString = window.location.href.replace(/index.html/, '');
    window.location.href = editedString + 'chat-page/index.html';
}

//Sets up the close button for the join room popup
let xButton = document.getElementById("X Button");
xButton.onclick = () => {
    popUp();
}

let joinRoomPopupDiv = document.getElementById('Join Room Popup Div');
joinRoomPopupDiv.style.display = 'none';

function popUp() {
    if (joinRoomPopupDiv.style.display === 'none') {
        joinRoomPopupDiv.style.display = 'block';
    } else {
        joinRoomPopupDiv.style.display = 'none';
    }
}