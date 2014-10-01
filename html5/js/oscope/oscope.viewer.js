var ctrls = findEverything(),
    formState = getSetting("formState"),
	prog = new LoadingProgress(
		"manifest/js/oscope/oscope.viewer.js",
		"/socket.io/socket.io.js",
		displayProgress,
		postScriptLoad);

function displayProgress(file){
    ctrls.status.innerHTML = fmt(
        "Loading, please wait... $1 $2", 
        file, 
        prog.makeSize(FileState.STARTED | FileState.ERRORED | FileState.COMPLETE , "progress")
    );
}

function postScriptLoad(progress){
    var SLIDE_SPEED = 100;
        socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        }), 
        gScope = ctrls.scope.getContext("2d"),
        gNames = ctrls.names.getContext("2d"),        
        valueState = {},
        min = Number.MAX_VALUE,
        max = Number.MIN_VALUE,
        lt = 0;

    socket.emit("handshake", "oscope");

    function lerp(v){
        if(min == max){
            return ctrls.scope.height / 2;
        }
        else{
            return (v - min) * ctrls.scope.height / (max - min);
        }
    }
    
    function animate(t){
        requestAnimationFrame(animate);
        dt = (t - lt) * 0.001;
        lt = t;
        
        for(var key in valueState){
            var value = valueState[key];
            min = Math.min(min, value.current);
            max = Math.max(max, value.current);
        }
        
        var x = Math.round(SLIDE_SPEED * dt);
        gScope.fillStyle = "slategrey";
        gScope.drawImage(ctrls.scope, x, 0);
        gScope.fillRect(0, 0, x, ctrls.scope.height);
        gNames.clearRect(0, 0, ctrls.names.width, ctrls.names.height);
        gNames.fillStyle = "white";
        gNames.textAlign = "right";
        gNames.textBaseline = "top";
        gNames.fillText(max, ctrls.names.width, 0);
        gNames.textBaseline = "bottom";
        gNames.fillText(min, ctrls.names.width, ctrls.names.height);
        for(var key in valueState){
            var value = valueState[key];
            if(value.last != null){
                var y = ctrls.scope.height - lerp(value.current);
                gScope.strokeStyle = value.color;
                gScope.beginPath();
                gScope.moveTo(0, ctrls.scope.height - lerp(value.last));
                gScope.lineTo(x, y);
                gScope.stroke();
                gNames.textBaseline = "middle";
                gNames.textAlign = "right";
                gNames.fillStyle = value.color;
                gNames.fillText(key, ctrls.names.width, y);
            }
            value.last = value.current;
        }
    }

    function start(){
    }

    function stop(){
    }

    function toggle(){
    }

    var colors = [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
        "#00ffff",
    ];
    function setValue(value){
        if(valueState[value.name] == null){
            var c = "#ffffff";
            if(colors.length > 0){
                c = colors.shift();
            }
            valueState[value.name] = {
                color: c
            };
        }
        valueState[value.name].current = value.value;
    }
    
    function setAppKey(){
        if(ctrls.appKey.value){
            socket.emit("appKey", ctrls.appKey.value);
            valueState = {};
            ctrls.setAppKeyButton.style.display = "none";
        }
        else{
            alert("Please enter an app key first");
        }
    }

    socket.on("handshakeFailed", console.warn.bind(console));
    socket.on("disconnect", console.error.bind(console));
    socket.on("value", setValue);

    ctrls.setAppKeyButton.addEventListener("click", setAppKey, false);
    
    window.addEventListener("beforeunload", function(){
        var state = readForm(ctrls);
        setSetting("formState", state);
    }, false);    

    writeForm(ctrls, formState);
    if(ctrls.appKey.value.length > 0){
        setAppKey();
    }
    gScope.fillStyle = "#ffffff";
    gNames.font = "12px Arial";
    ctrls.status.style.display = "none";
    requestAnimationFrame(animate);
}
