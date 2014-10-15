include(0,
    ["/socket.io/socket.io.js",        
    "js/input/NetworkedInput.js",
    "js/input/ButtonAndAxisInput.js",
    "js/input/KeyboardInput.js"],
    webRTCTest);

function webRTCTest(){
    var ctrls = findEverything(),
        socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        }),
        peer = new RTCPeerConnection(null),
        channel = null,
        index = null;

    peer.addEventListener("datachannel", function(evt){
        channel = evt.channel;
        setChannelEvents();
    }, false);

    peer.addEventListener("icecandidate", function(evt){
        if(evt.candidate){
            socket.emit("ice", evt.candidate);
        }
    }, false);
    
    socket.on("connect", function(){
        socket.emit("handshake", "peer");        
    });
    
    socket.on("handshakeComplete", function(name){
        if(name === "peer"){
            socket.emit("joinRequest", "webrtc-demo");
        }
    });
    
    socket.on("user", function(count){
        if(index === null){
            index = count - 1;
        }

        if(index === 0 && count > 1){
            if(channel === null){
                channel = peer.createDataChannel("data-channel-main", {
                    reliable: false,
                    ordered: false
                });
                setChannelEvents();
            }
            peer.createOffer(sdpCreated, console.error.bind(console, "createOffer error"));
        }
    });
    
    socket.on("ice", function(candidate){
        peer.addIceCandidate(new RTCIceCandidate(candidate)); 
    });
    
    socket.on("offer", function(offer){
        sdpReceived(offer, function(){
            peer.createAnswer(
                sdpCreated,
                console.error.bind(console, "createAnswer error"));
        });
    });
    
    socket.on("answer", sdpReceived);
    
    ctrls.input.addEventListener("change", function(){
        if(channel !== null){
            showMessage(">: " + ctrls.input.value);
            channel.send(ctrls.input.value);
            ctrls.input.value = "";
        }
    }, false);
    
    function sdpReceived(sdp, thunk){
        var remote = new RTCSessionDescription(sdp);
        peer.setRemoteDescription(remote, thunk);
    }
    
    function sdpCreated(sdp){
        peer.setLocalDescription(sdp, function(){
            socket.emit(sdp.type, sdp);
        });
    }
    
    function showMessage(msg){
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(msg));
        ctrls.output.appendChild(div);
        return div;
    }
    
    function setChannelEvents(){
        channel.addEventListener("message", function(evt){
            showMessage("<: " + evt.data);
        }, false);
        channel.addEventListener("close", function(){
            ctrls.input.disabled = true;
        }, false);
        channel.addEventListener("error", console.error.bind(console, "channel error"), false);
        channel.addEventListener("open", function(){
            ctrls.input.disabled = false;
        }, false);
    }
}