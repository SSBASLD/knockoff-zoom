let client = new WebSocket('ws://localhost:8080', ['echo-protocol']);
client.onopen = () => {
    console.log("hi");
}
client.onmessage = function (event) {
    console.log(event.data);
}