var peers = [],
        channels = [],
        myIndex = null;

include(0,
        ["/socket.io/socket.io.js",
            "js/input/NetworkedInput.js",
            "js/input/ButtonAndAxisInput.js",
            "js/input/KeyboardInput.js"],
        webRTCTest);

function webRTCTest() {
    var ctrls = findEverything(),
            socket = io.connect(document.location.hostname, {
                "reconnect": true,
                "reconnection delay": 1000,
                "max reconnection attempts": 60
            });

    function showMessage(msg) {
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(msg));
        ctrls.output.appendChild(div);
        return div;
    }

    function setChannelEvents(index) {
        console.log(channels[index]);
        channels[index].addEventListener("message", function (evt) {
            showMessage(fmt("< ($1): $2", index, evt.data));
        }, false);
        channels[index].addEventListener("open", function () {
            ctrls.input.disabled = false;
        }, false);

        function closer(name) {
            channels[index] = null;
            peers[index] = null;
            ctrls.input.disabled = (filter(channels, function (c) {
                return c;
            }).length === 0);
        }

        channels[index].addEventListener("error", closer.bind(this, "errored"), false);
        channels[index].addEventListener("close", closer.bind(this, "closed"), false);
    }

    ctrls.input.addEventListener("change", function () {
        for (var i = 0; i < channels.length; ++i) {
            var channel = channels[i];
            if (channel && channel.readyState === "open") {
                channel.send(ctrls.input.value);
            }
        }
        showMessage(fmt("> ($1): $2", myIndex, ctrls.input.value));
        ctrls.input.value = "";
    }, false);

    window.addEventListener("unload", function () {
        channels.forEach(function(channel){
            if (channel && channel.readyState === "open") {
                channel.close();
            }
        });
        peers.forEach(function(peer){
            if(peer){
                console.log(peer);
                peer.close();
            }
        });
    });

    socket.on("connect", function () {
        socket.emit("handshake", "peer");
    });

    socket.on("handshakeComplete", function (name) {
        if (name === "peer") {
            socket.emit("joinRequest", "webrtc-demo");
        }
    });

    socket.on("user", function (index, theirIndex) {
        try {
            if (myIndex === null) {
                myIndex = index;
            }
            if (!peers[theirIndex]) {
                var peer = new RTCPeerConnection({
                    iceServers: [
                        "stun.l.google.com:19302",
                        "stun1.l.google.com:19302",
                        "stun2.l.google.com:19302",
                        "stun3.l.google.com:19302",
                        "stun4.l.google.com:19302"
                    ].map(function(o){
                        return {url: "stun:" + o};
                    })
                });
                peers[theirIndex] = peer;

                peer.addEventListener("icecandidate", function (evt) {
                    if (evt.candidate) {
                        evt.candidate.fromIndex = myIndex;
                        evt.candidate.toIndex = theirIndex;
                        socket.emit("ice", evt.candidate);
                    }
                }, false);

                function descriptionCreated(description) {
                    description.fromIndex = myIndex;
                    description.toIndex = theirIndex;
                    peers[theirIndex].setLocalDescription(description, function () {
                        socket.emit(description.type, description);
                    });
                }

                function descriptionReceived(description, thunk) {
                    if (description.fromIndex === theirIndex) {
                        var remote = new RTCSessionDescription(description);
                        peers[theirIndex].setRemoteDescription(remote, thunk);
                    }
                }

                socket.on("ice", function (ice) {
                    if (ice.fromIndex === theirIndex) {
                        peers[theirIndex].addIceCandidate(new RTCIceCandidate(ice));
                    }
                });

                if (myIndex < theirIndex) {
                    var channel = peer.createDataChannel("data-channel-" + myIndex + "-to-" + theirIndex, {
                        id: myIndex,
                        ordered: false,
                        maxRetransmits: 0
                    });
                    channels[theirIndex] = channel;
                    setChannelEvents(theirIndex);

                    socket.on("answer", function (answer) {
                        if (answer.fromIndex === theirIndex) {
                            descriptionReceived(answer);
                        }
                    });

                    peer.createOffer(descriptionCreated, console.error.bind(console, "createOffer error"));
                }
                else {
                    peer.addEventListener("datachannel", function (evt) {
                        if (evt.channel.id === theirIndex) {
                            channels[evt.channel.id] = evt.channel;
                            setChannelEvents(theirIndex);
                        }
                    }, false);

                    socket.on("offer", function (offer) {
                        if (offer.fromIndex === theirIndex) {
                            descriptionReceived(offer, function () {
                                peers[theirIndex].createAnswer(
                                        descriptionCreated,
                                        console.error.bind(console, "createAnswer error"));
                            });
                        }
                    });
                }
            }
        }
        catch (exp) {
            console.error(exp);
        }
    });
}