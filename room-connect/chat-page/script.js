//First we declare all the references that we are going to use
const textArea = document.getElementById("chatInput");
const arrowButton = document.getElementById("Arrow Button");

const chatWindow = document.getElementById("Chat Window");
const inputChatWindow = document.getElementById("Input Chat Window");

const loadingImage = document.getElementById("Loading Image");

/* These variables are used to determine the difference in height between one line and two lines of text
We use these values for calculating styling */
let oneLine = document.getElementById("oneLineHeight");
let twoLine = document.getElementById("twoLineHeight")

//Declare default values for message styling
let diff = 9; //This differs from line diff as it represents the space between messages
let topPercentage = 2;

//Calculate what the difference in line heights is
let oneLineHeight = oneLine.scrollHeight;
let twoLineHeight = twoLine.scrollHeight;
let lineDiff = twoLineHeight - oneLineHeight;

//Declare default values for loading image rotation
let degree = 0;
let rotateAnimation;

//Declare default values for message handling
var person = 2;

//Declare default values for the websocket connection
let roomKey;
let client;
const autoReconnectDelay = 5000;

//Disables the chat window
function disable() {
    loadingImage.style.display = "block";

    //Rotate animation for the loading symbol
    rotateAnimation = setInterval(() => {
        let rotate = `rotate(${degree + 3}deg)`;
        degree += 3;
        loadingImage.style.transform = rotate;
    }, 10);

    chatWindow.style.opacity = "0.5";
    inputChatWindow.style.opacity = "0.5";
    textArea.setAttribute('readonly', true);
    arrowButton.active = false;
}

//Enables the chat window
function enable() {
    loadingImage.style.display = "none";
    clearInterval(rotateAnimation);

    chatWindow.style.opacity = "1";
    inputChatWindow.style.opacity = "1";
    textArea.removeAttribute('readonly');
    arrowButton.active = true;
}

//First disable the chat window because the websocket starts unconnected
disable();

//Recalculates the difference between lines every time the screen gets resized
window.addEventListener('resize', (event) => {
    oneLineHeight = oneLine.scrollHeight;
    twoLineHeight = twoLine.scrollHeight;

    lineDiff = twoLineHeight - oneLineHeight;
    lineDiff = lineDiff == 0 ? 1 : lineDiff;
});

//Arrow button animations for mouse over and click
arrowButton.onmouseover = () => {
    arrowUI("over");
}

arrowButton.onmouseleave = () => {
    arrowUI("leave");
}

arrowButton.onmousedown = () => {
    arrowUI("down");
}

arrowButton.onmouseup = () => {
    arrowUI("up");
}

function arrowUI(event) {
    if (!arrowButton.active) return;

    let path = "../../images/"
    switch (event) {
        case "over":
            path += "arrowHover.png";
            break;
        case "leave":
            path += "arrow.png"
            break;
        case "down":
            path += "arrowPress.png";
            break;
        case "up":
            path += "arrowHover.png"
            break;
        default:
            path += "arrow.png"
    }
    arrowButton.src = path;
}

//Adds the onclick function
arrowButton.onclick = () => {
    //Checks if chat window is disabled
    if (!arrowButton.active) return;
    handleMessage();
}

//Makes it so you can press enter to send messages
textArea.addEventListener("keypress", (e) => {
    //Checks if chat window is disabled
    if (!arrowButton.active) return;

    if (e.key == "Enter") {
        handleMessage();
    }
});

function handleMessage() {
    //Doesn't let you send a message if not connected to the websocket server
    if (!client.connected) {
        alert("Not connected to the server");
        return;
    }

    //Gets actual message content
    let value = textArea.value;
    //Clears the text area
    textArea.value = "";

    //Removes whitespace from front and end
    value = value.trim();
    //If it was nothing but whitespace ignore the message
    if (value == "") {
        return;
    }

    //Also sends the room key so the server can send the message to the correct room
    let jsonText = `{"message": "${value}", "roomKey": "${roomKey}"}`;
    client.send(jsonText);

    //Displays the message just sent
    if (person != null) {
        if (person == 1) {
            createTextArea(value, "left");
        } else {
            createTextArea(value, "right");
        }
    }
}

function createTextArea(value, side) {
    let numOfLines;
    if (side == "left") {
        //Creates a blue person image and gives it the correct position and size
        let bluePerson = document.createElement("img");
        bluePerson.className = "person";
        bluePerson.src = "../../images/BluePerson.png"
        bluePerson.style.left = "7%";
        bluePerson.style.top = `${topPercentage}%`;
        //Adds it to the chat window
        chatWindow.appendChild(bluePerson);
    
        //Creates the text div
        let leftTextArea = document.createElement("div");
        leftTextArea.className = "leftTextArea";
    
        //Gives the text area the message contents 
        leftTextArea.innerHTML += value;
        leftTextArea.style.top = `${topPercentage}%`;
    
        chatWindow.appendChild(leftTextArea);
    
        //Calculates the number of lines the message is
        let heightLineDivision = Math.floor((leftTextArea.scrollHeight - oneLineHeight) / lineDiff);
        numOfLines = heightLineDivision + 1;
    } else if (side == "right") {
        //Creates a green person image and gives it the correct position and size
        let greenPerson = document.createElement("img");
        greenPerson.className = "person";
        greenPerson.src = "../../images/GreenPerson.png"
        greenPerson.style.left = "92%";
        greenPerson.style.top = `${topPercentage}%`;
        chatWindow.appendChild(greenPerson);

        //Creates text div
        let rightTextArea = document.createElement("div");
        rightTextArea.className = "rightTextArea";
    
        //Gives the text area the message contents
        rightTextArea.innerHTML += value;
        rightTextArea.style.top = `${topPercentage}%`;
    
        chatWindow.appendChild(rightTextArea);
    
        //Calculates number of lines
        let heightLineDivision = Math.floor((rightTextArea.scrollHeight - oneLineHeight) / lineDiff);
        numOfLines = heightLineDivision + 1;
    }
    
    //Increases the position of the next message by a set amount depending on how many lines there are
    topPercentage += diff + 3*((numOfLines - 2) < 0 ? 0 : numOfLines - 2);

    //Sets the chat windows
    chatWindow.scrollTop = chatWindow.scrollHeight - chatWindow.clientHeight;
}

async function setUpSocket() {
    //First gets the actual room key from session storage
    roomKey = await sessionStorage.getItem('Room Key');
    console.log(roomKey);

    //Connects the websocket
    client = new WebSocket("wss://node-websocket-server-a4uv.onrender.com/ws/", ['echo-protocol', roomKey]);
    client.onopen = () => {
        //When the websocket opens enable the chat window
        enable();
        client.connected = true;
        console.log("Connection Established");
    }

    client.onclose = function(e) {
        //When it closes, disable the chat window
        disable();
        console.log('echo-protocol Client Closed');
        console.log(e.reason);

        setTimeout(() => {
            setUpSocket();
        }, autoReconnectDelay)
    };

    client.onmessage = (message) => {
        try {
            var jsonData = JSON.parse(message.data);
        } catch (e) {
            //We know this will return an error so simply ignore it
            if (message.data == "ping") { 
                return;
            }

            console.log("Message data was not sent in JSON format");
            console.error(e);
            return;
        } finally {
            //It doesn't matter what, if the server sends something, ping them back
            //This is so the heartbeat is more consistent and doesn't have to send as many messages
            client.send('pong');
        }

        if (jsonData.type == "Error") {
            //Alerts the client of the error
            alert(jsonData.message);
            return;
        } else if (jsonData.type == "Message") {
            //Logs the message
            if (jsonData.person == 1) {
                createTextArea(jsonData.message, "left");
            } else {
                createTextArea(jsonData.message, "right");
            }
        } else if (jsonData.type == "Info") {
            //The server tells the client what number person they were (AKA the order they entered the room)
            person = jsonData.person;

            //Post all the previous messages that were recorded in the server
            for (let message of jsonData.message) {
                if (message.person == 1) {
                    createTextArea(message.message, "left");
                } else {
                    createTextArea(message.message, "right");
                }
            }
        }
    };
}

setUpSocket();