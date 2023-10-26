let textArea = document.getElementById("chatInput");
let sendButton = document.getElementById("sendButton");
sendButton.onclick = () => {
    console.log("hi");

    let value = textArea.value;
    let jsonText = `{"message": "${value}", "roomKey": "${roomKey}"}`;

    client.send(jsonText);
}

let returnTextArea = document.getElementById("Return Text Area");

let roomKey;
let client;
async function setUpSocket() {
    roomKey = await sessionStorage.getItem('Room Key');
    console.log(roomKey);


    client = new WebSocket("wss://node-websocket-server-a4uv.onrender.com/ws/", ['echo-protocol', roomKey]);
    client.onopen = () => {
        console.log("Connection Established");
    }

    client.onmessage = (message) => {
        if (message.data == 'ping') {
            client.send('pong');
            return;
        }

        returnTextArea.innerHTML = message.data;
    };
}

setUpSocket();