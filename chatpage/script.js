let client = new WebSocket("wss://node-websocket-server-a4uv.onrender.com/ws/", ['echo-protocol']);
client.onopen = () => {
    console.log("Connection Established");
}

let textArea = document.getElementById("chatTextArea");
let sendButton = document.getElementById("sendButton");
sendButton.onclick = () => {
    let value = textArea.value;
    let jsonText = `{"message": ${value}}`;

    client.send(jsonText);
}

let returnTextArea = document.getElementById("returnTextArea");
client.onmessage = (message) => {
    returnTextArea.innerHTML = message.data;
};