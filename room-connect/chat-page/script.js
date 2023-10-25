let textArea = document.getElementById("chatTextArea");
let sendButton = document.getElementById("sendButton");
sendButton.onclick = () => {
    let value = textArea.value;
    let jsonText = `{"message": "${value}", "roomKey": "${roomKey}"}`;

    console.log(jsonText);

    client.send(jsonText);
}

let returnTextArea = document.getElementById("returnTextArea");

let roomKey;
let client;
async function setUpSocket() {
    roomKey = await sessionStorage.getItem('Room Key');

    client = new WebSocket("wss://node-websocket-server-a4uv.onrender.com/ws/", ['echo-protocol', roomKey]);
    client.onopen = () => {
        console.log("Connection Established");
    }

    client.onmessage = (message) => {
        returnTextArea.innerHTML = message.data;
    };
}

setUpSocket();