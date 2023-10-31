let chatSquare = document.getElementById("Chat Square");
chatSquare.style.display = "none";

let leftTextArea = document.getElementById("Left Return Text Area");
let rightTextArea = document.getElementById("Right Return Text Area");

let textArea = document.getElementById("chatInput");
let arrowButton = document.getElementById("Arrow Button");

let counter = 0;
arrowButton.onclick = () => {
    let value = textArea.value;
    let jsonText = `{"message": "${value}", "roomKey": "${roomKey}"}`;

    client.send(jsonText);
}

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
        try {
            var jsonData = JSON.parse(message.data);
        } catch (e) {
            if (message.data == "ping") return;

            console.log("Message data was not sent in JSON format");
            console.error(e);
            return;
        } finally {
            client.send('pong');
        }

        if (jsonData.type == "Error") {
            alert(jsonData.message);
            return;
        } else if (jsonData.type == "Message") {
            if (jsonData.person == 1) {
                leftTextArea.innerHTML = "Person 1: " + jsonData.message; 
            } else {
                rightTextArea.innerHTML = "Person 2: " + jsonData.message;
            }
        }
    };
}

setUpSocket();