function WebRTCSocket(proxyServer, connectionKey){
    var socket = io.connect(proxyServer, {
        "reconnect": true,
        "reconnection delay": 1000,
        "max reconnection attempts": 60
    }),
        peers = [],
        channels = [],
        listeners = {},
        myIndex = null;

    function setChannelEvents(index) {
        
        channels[index].addEventListener("open", function () {
            if(listeners.open){
                for(var i = 0; i < listeners.open.length; ++i){
                    var l = listeners.open[i];
                    if(l){
                        l.call(this);
                    }
                }
            }
        }, false);
        
        channels[index].addEventListener("message", function (evt) {
            var args = JSON.parse(evt.data),
                key = args.shift();
            if(listeners[key]){
                for(var i = 0; i < listeners[key].length; ++i){
                    var l = listeners[key][i];
                    if(l){
                        l.apply(this, args);
                    }
                }
            }
        }, false);

        function closer() {
            channels[index] = null;
            peers[index] = null;
            var closed = (filter(channels, function (c) {
                return c;
            }).length === 0);
            if(closed && listeners.close){
                for(var i = 0; i < listeners.close.length; ++i){
                    var l = listeners.close[i];
                    if(l){
                        l.call(this);
                    }
                }                
            }
        }

        channels[index].addEventListener("error", closer, false);
        channels[index].addEventListener("close", closer, false);
    }
    
    this.on = function(evt, thunk){
        if(!listeners[evt]){
            listeners[evt] = [];
        }
        listeners[evt].push(thunk);
    };
    
    this.emit = function(){
        var data = JSON.stringify(arr(arguments));
        
        for (var i = 0; i < channels.length; ++i) {
            var channel = channels[i];
            if (channel && channel.readyState === "open") {
                channel.send(data);
            }
        }
    };
    
    this.close = function(){
        channels.forEach(function(channel){
            if (channel && channel.readyState === "open") {
                channel.close();
            }
        });
        peers.forEach(function(peer){
            if(peer){
                peer.close();
            }
        });
    };   

    window.addEventListener("unload", this.close.bind(this));   
    

    socket.on("connect", function () {
        socket.emit("handshake", "peer");
    });

    socket.on("handshakeComplete", function (name) {
        if (name === "peer") {
            socket.emit("joinRequest", connectionKey);
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