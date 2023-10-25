async function createRoom() {
    var uid = "id" + Math.random().toString(16).slice(2)
    await sessionStorage.setItem(uid, true);
    await sessionStorage.setItem("Room Key", uid);
    
    let editedString = window.location.href.replace(/index.html/, '');
    window.location.href = editedString + 'chat-page/index.html';
}

let roomKeyInput = document.getElementById("Room Key Input");
async function joinRoom() {
    let uid = roomKeyInput.textContent;

    if (sessionStorage.getItem(uid) != null) {
        await sessionStorage.setItem("Room Key", uid);

        let editedString = window.location.href.replace(/index.html/, '');
        window.location.href = editedString + 'chat-page/index.html';
    } else {
        alert("No room exists with that room code!");
        return;
    }
}

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