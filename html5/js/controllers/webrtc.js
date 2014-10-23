include(0,
    ["lib/socket.io.js",
    "js/WebRTCSocket.js",
    "js/input/NetworkedInput.js",
    "js/input/ButtonAndAxisInput.js",
    "js/input/KeyboardInput.js"],
    webRTCTest);
    
function webRTCTest() {
    var ctrls = findEverything(),
        sock = new WebRTCSocket(document.location.hostname, 
            confirm("mesh?")
                ? undefined
                : confirm("hub?"));
    
    function showMessage(msg) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(msg));
        ctrls.output.appendChild(div);
        return div;
    }

    ctrls.input.addEventListener("change", function () {
        sock.emit("chat", ctrls.input.value);
        showMessage(fmt(">: $1", ctrls.input.value));
        ctrls.input.value = "";
    }, false);

    sock.on("open", function(){
        ctrls.input.disabled = false;
    });
    
    sock.on("closed", function(){
       ctrls.input.disabled = true; 
    });
    
    sock.on("chat", showMessage);
    
    sock.connect("webrtc-demo");
}