var isDebug = false, isLocal = document.location.hostname === "localhost",
    ctrls = findEverything(), tabs = makeTabSet(ctrls.options), login,
    prog = new LoadingProgress(
        "manifest/js/controllers/holodeck.js",
        "lib/three/three.js",
        "lib/three/StereoEffect.js",
        "lib/three/OculusRiftEffect.js",
        "lib/three/AnaglyphEffect.js",
        "lib/three/ColladaLoader.js",
        "lib/physics/cannon.min.js",
        "lib/leap-0.6.3.min.js",
        "lib/sha512.js",
        "lib/socket.io.js",
        "js/oscope/oscope.client.js",
        "js/WebRTCSocket.js",
        "js/ModelLoader.js",
        "js/input/NetworkedInput.js",
        "js/input/ButtonAndAxisInput.js",
        "js/input/SpeechInput.js",
        "js/input/GamepadInput.js",
        "js/input/KeyboardInput.js",
        "js/input/MotionInput.js",
        "js/input/MouseInput.js",
        "js/input/TouchInput.js",
        "js/input/LeapMotionInput.js",
        "js/output/Audio3DOutput.js",
        "js/output/SpeechOutput.js",
        "js/vui/vui.js",
        displayProgress,
        postScriptLoad);
        
function closeReloadMessage(showLogin){
    ctrls.downloadProgress.style.opacity = 0;
    ctrls.appCacheMessage.style.display = "none";
    ctrls.loginForm.style.display = showLogin ? "" : "none";
    prog.start();
}
        
function showReload(message){    
    ctrls.appCacheMessage.innerHTML = "";
    var reloadButton = document.createElement("a");
    reloadButton.innerHTML = message;
    reloadButton.className = "primary button";
    reloadButton.addEventListener("click", function(){
        document.location = document.location.href;
    }, false);
    ctrls.appCacheMessage.appendChild(reloadButton);
    
    var dismissButton = document.createElement("a");
    dismissButton.innerHTML = "Dismiss.";
    dismissButton.className = "secondary button";
    dismissButton.addEventListener("click", closeReloadMessage.bind(window, false), false);
    ctrls.appCacheMessage.appendChild(dismissButton);
};

applicationCache.addEventListener("error", showReload.bind(window, "Error downloading update. Try again."), false);

applicationCache.addEventListener("updateready", showReload.bind(window, "Download complete. Reload application."), false);

applicationCache.addEventListener("downloading", function(){ 
    ctrls.appCacheMessage.innerHTML = "Downloading update now... please wait.";
}, false);

applicationCache.addEventListener("noupdate", function(){ 
    ctrls.appCacheMessage.innerHTML = "No update found.";
    closeReloadMessage(true);
}, false);

applicationCache.addEventListener("cached", function(){ 
    ctrls.appCacheMessage.innerHTML = "Application cached.";
    closeReloadMessage(true);
}, false);

applicationCache.addEventListener("progress", function(evt){ 
    var p = evt.loaded / evt.total,
        q = sigfig(p, 3);
    ctrls.downloadProgress.style.opacity = 1 - q;
    ctrls.appCacheMessage.innerHTML = fmt("Checking for application update $1... please wait", pct(q * 100));
}, false);

applicationCache.addEventListener("checking", function(){ 
    ctrls.appCacheMessage.innerHTML = "Checking for application update... please wait.";
}, false);

function displayProgress(file){
    var p = prog.makeSize(FileState.STARTED | FileState.ERRORED | FileState.COMPLETE , "progress", true);
    var q = prog.makeSize(FileState.STARTED | FileState.ERRORED | FileState.COMPLETE , "progress", false);
    ctrls.loadingProgress.style.opacity = p;
    if(typeof(file) !== "string"){
        file = fmt(
            "<br>$1:<br>[msg] $2<br>[line] $3<br>[col] $4<br>[file] $5",
            typeof(file),
            file.message,
            file.line,
            file.column,
            file.sourceURL.match(/[^\/\\]*$/)[0]
        );
    }
    ctrls.loadingMessage.innerHTML
        = ctrls.connectButton.innerHTML
        = fmt("Loading, please wait... $1 $2", file, q);
    if(prog.isDone()){
        ctrls.loading.style.display = "none";
        ctrls.connectButton.addEventListener("click", login, false);
        ctrls.connectButton.innerHTML = "Connect";
        ctrls.connectButton.className = "primary button";
        ctrls.loadingMessage.innerHTML = "Loading complete!";
        setTimeout(function(){
            ctrls.loadingMessage.style.visibility = "hidden";
        }, 2000);

        if(ctrls.autoLogin.checked
            && ctrls.loginForm.style.display === ""
            && ctrls.userNameField.value.length > 0
            && ctrls.passwordField.value.length > 0){
            login();
        }
    }
}

function postScriptLoad(progress){
    var socket = io.connect(document.location.hostname, {
        "reconnect": true,
        "reconnection delay": 1000,
        "max reconnection attempts": 60
    });
    socket.on("handshakeFailed", function(controllers){
        console.warn("Failed to connect to websocket server. Available socket controllers are:", controllers);
    });
    socket.on("handshakeComplete", function(controller){
        if(controller === "demo"){
            startGame(socket, progress);
        }
    });
    socket.emit("handshake", "demo");
}
    
function startGame(socket, progress){ 
    var BG_COLOR = 0x000000,
        CHAT_TEXT_SIZE = 0.25, 
        NO_HMD_SMARTPHONE = "Smartphone - no HMD",
        PLAYER_HEIGHT = 6.5,
        RIGHT = new THREE.Vector3(-1, 0, 0),
        GRAVITY = 9.8, 
        SPEED = 15,
        deviceStates = new StateList(ctrls.deviceTypes, ctrls, [
            { name: "-- select device type --" },
            { name: "PC", values:{
                speechEnable: {checked: false},
                speechTransmit: {checked: false},
                speechReceive: {checked: false},
                keyboardEnable: {checked: true},
                keyboardTransmit: {checked: true},
                keyboardReceive: {checked: false},
                mouseEnable: {checked: true},
                mouseTransmit: {checked: true},
                mouseReceive: {checked: false},
                gamepadEnable: {checked: true},
                gamepadTransmit: {checked: true},
                gamepadReceive: {checked: false},
                leapEnable: {checked: true},
                leapTransmit: {checked: true},
                leapReceive: {checked: false},
                touchEnable: {checked: false},
                touchTransmit: {checked: false},
                touchReceive: {checked: true},
                headEnable: {checked: false},
                headTransmit: {checked: false},
                headReceive: {checked: true},
                renderingStyle: {value: "regular" },
                defaultDisplay: {checked: true}
            }},
            { name: "Smartphone HMD", values:{
                speechEnable: {checked: false},
                speechTransmit: {checked: false},
                speechReceive: {checked: true},
                keyboardEnable: {checked: false},
                keyboardTransmit: {checked: false},
                keyboardReceive: {checked: true},
                mouseEnable: {checked: false},
                mouseTransmit: {checked: false},
                mouseReceive: {checked: true},
                gamepadEnable: {checked: false},
                gamepadTransmit: {checked: false},
                gamepadReceive: {checked: true},
                leapEnable: {checked: false},
                leapTransmit: {checked: false},
                leapReceive: {checked: true},
                touchEnable: {checked: false},
                touchTransmit: {checked: false},
                touchReceive: {checked: true},
                headEnable: {checked: true},
                headTransmit: {checked: true},
                headReceive: {checked: false},
                renderingStyle: {value: "rift" },
                defaultDisplay: {checked: false}
            }},
            { name: NO_HMD_SMARTPHONE, values:{
                speechEnable: {checked: false},
                speechTransmit: {checked: false},
                speechReceive: {checked: true},
                keyboardEnable: {checked: false},
                keyboardTransmit: {checked: false},
                keyboardReceive: {checked: true},
                mouseEnable: {checked: false},
                mouseTransmit: {checked: false},
                mouseReceive: {checked: true},
                gamepadEnable: {checked: false},
                gamepadTransmit: {checked: false},
                gamepadReceive: {checked: true},
                leapEnable: {checked: false},
                leapTransmit: {checked: false},
                leapReceive: {checked: true},
                touchEnable: {checked: true},
                touchTransmit: {checked: true},
                touchReceive: {checked: false},
                headEnable: {checked: true},
                headTransmit: {checked: true},
                headReceive: {checked: false},
                renderingStyle: {value: "regular" },
                defaultDisplay: {checked: true}
            }}
        ], readSettings),
        formState = getSetting("formState"),
        testPoint = new THREE.Vector3(),
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7),
        direction = new THREE.Vector3(),
        orientation = new THREE.Euler(0, 0, 0, "YZX"),      
        focused = true,
        wasFocused = false,
        autoWalking = false,
        startHeading = 0,
        dt = 0, 
        lt = 0, 
        frame = 0, 
        dFrame = 0.125,
        heading = 0, 
        pitch = 0, 
        roll = 0, 
        strafe = 0, 
        drive = 0,
        DEFAULT_USER_NAME = "CURRENT_USER_OFFLINE",
        drawDistance = 500,
        userName = DEFAULT_USER_NAME, 
        chatLines = [],
        users = {}, 
        onground = false,
        audio3d = new Audio3DOutput(),
        oscope = new Oscope("demo"),
        scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        repeater = new SpeechOutput.Character(),
        lastText = null,
        lastNote = null,
        lastRenderingType = null,
        currentUser = null,
        clickSound = null,
        camera = null, 
        effect = null,
        head = null,
        keyboard = null,
        mouse = null,
        gamepad = null,
        touch = null,
        speech = null,
        leap = null,
        hand = null,
        proxy = null,
        hideControlsTimeout = null;

    tabs.style.width = pct(100);
    renderer.setClearColor(BG_COLOR);
    writeForm(ctrls, formState);
    oscope.connect();
    proxy = new WebRTCSocket(socket, ctrls.defaultDisplay.checked);
    
    socket.on("typing", showTyping.bind(window, false, false));
    socket.on("chat", showChat);    
    socket.on("userJoin", addUser);
    socket.on("userState", updateUserState.bind(window, false));
    socket.on("userLeft", userLeft);
    socket.on("loginFailed", loginFailed);
    socket.on("userList", listUsers);
    socket.on("disconnect", msg.bind(window));
    
    function readSettings(){
        for(var key in ctrls){
            if(key !== "deviceTypes"){
                var evt = new Event("change");
                ctrls[key].dispatchEvent(evt);
            }
        }
    }
    
    function loginFailed(){
        ctrls.connectButton.innerHTML = "Login failed. Try again.";
        ctrls.connectButton.className = "primary button";
        msg("Incorrect user name or password!");
    }
    
    function showControls(){
        ctrls.onScreenControls.style.display = "";
        if(hideControlsTimeout !== null){
            clearTimeout(hideControlsTimeout);
        }
        hideControlsTimeout = setTimeout(hideControls, 3000);
    }
    
    function hideControls(){
        ctrls.onScreenControls.style.display = "none";
        hideControlsTimeout = null;
    }

    function msg(){
        var txt = fmt.apply(window, map(arguments, function(v){ return v ? v.toString() : ""; }));
        if(isDebug){
            console.log(txt);
        }
        else if(currentUser){
            showChat(txt);
        }
        else {
            alert(txt);
        }
    }

    function ask(txt, force){
        if(isDebug){
            return force;
        }
        else{
            return confirm(txt);
        }
    }
        
    function waitForResources(t){
        lt = t;
        if(camera && currentUser){
            leap.start();
            requestAnimationFrame(animate);
        }
        else{
            requestAnimationFrame(waitForResources);
        }
    }

    function animate(t){
        requestAnimationFrame(animate);
        dt = (t - lt) * 0.001;
        lt = t;
        
        if(wasFocused && focused){
            head.update(dt);
            keyboard.update(dt);
            mouse.update(dt);
            gamepad.update(dt);
            touch.update(dt);
            speech.update(dt);
            leap.update(dt);

            pitch = head.getValue("pitch") 
                + mouse.getValue("pitch")
                + gamepad.getValue("pitch");
            roll = head.getValue("roll");
            heading = head.getValue("heading")
                    + touch.getValue("heading")
                    + mouse.getValue("heading")
                    + gamepad.getValue("heading")
                    + startHeading;
            if(ctrls.defaultDisplay.checked){
                THREE.AnimationHandler.update(dt);

                //
                // update user position and view
                //

                currentUser.dHeading = (heading - currentUser.heading) / dt;
                strafe = keyboard.getValue("strafeRight")
                    + keyboard.getValue("strafeLeft")
                    + gamepad.getValue("strafe");
                drive = keyboard.getValue("driveBack")
                    + keyboard.getValue("driveForward")
                    + gamepad.getValue("drive")
                    + touch.getValue("drive");

                if(onground || currentUser.position.y < -0.5){                
                    if(autoWalking){
                        strafe = 0;
                        drive = -0.5;
                    }
                    if(strafe || drive){
                        len = SPEED * Math.min(1, 1 / Math.sqrt(drive * drive + strafe * strafe));
                    }
                    else{
                        len = 0;
                    }

                    strafe *= len;
                    drive *= len;
                    len = strafe * Math.cos(currentUser.heading) + drive * Math.sin(currentUser.heading);
                    drive = drive * Math.cos(currentUser.heading) - strafe * Math.sin(currentUser.heading);
                    strafe = len;
                    currentUser.velocity.x = currentUser.velocity.x * 0.9 + strafe * 0.1;
                    currentUser.velocity.z = currentUser.velocity.z * 0.9 + drive * 0.1;
                }

                currentUser.velocity.y -= dt * GRAVITY;

                //
                // do collision detection
                //
                var len = currentUser.velocity.length() * dt;
                direction.copy(currentUser.velocity);
                direction.normalize();
                testPoint.copy(currentUser.position);
                testPoint.y += PLAYER_HEIGHT / 2;
                raycaster.set(testPoint, direction);
                raycaster.far = len;
                intersections = raycaster.intersectObject(scene, true);
                for(var i = 0; i < intersections.length; ++i){
                    var inter = intersections[i];
                    if(inter.object.parent.isSolid){
                        testPoint.copy(inter.face.normal);
                        testPoint.applyEuler(inter.object.parent.rotation);
                        currentUser.velocity.reflect(testPoint);
                        var d = testPoint.dot(camera.up);
                        if(d > 0.75){
                            currentUser.position.y = inter.point.y + 0.0125;
                            currentUser.velocity.y = 0.1;
                            onground = true;
                        }
                    }
                }

                // ground test
                testPoint.copy(currentUser.position);
                testPoint.y += 1;
                direction.set(0, -1, 0);
                raycaster.set(testPoint, direction);
                raycaster.far = 1;
                intersections = raycaster.intersectObject(scene, true);
                for(var i = 0; i < intersections.length; ++i){
                    var inter = intersections[i];
                    if(inter.object.parent.isSolid){
                        testPoint.copy(inter.face.normal);
                        testPoint.applyEuler(inter.object.parent.rotation);
                        currentUser.position.y = inter.point.y + 0.0125;
                        currentUser.velocity.y = 0.1;
                        onground = true;
                    }
                }

                //
                // send a network update of the user's position, if it's been enough 
                // time since the last update (don'dt want to flood the server).
                //
                frame += dt;
                if(frame > dFrame){
                    frame -= dFrame;
                    var state = {
                        x: currentUser.position.x,
                        y: currentUser.position.y,
                        z: currentUser.position.z,
                        dx: currentUser.velocity.x,
                        dy: currentUser.velocity.y,
                        dz: currentUser.velocity.z,
                        heading: currentUser.heading,
                        dHeading: (currentUser.heading - currentUser.lastHeading) / dFrame,
                        isRunning: currentUser.velocity.length() > 0
                    };
                    currentUser.lastHeading = currentUser.heading;
                    socket.emit("userState", state);
                }
            }

            //
            // update avatars
            //
            for(var key in users){
                var user = users[key];
                testPoint.copy(user.velocity);
                testPoint.multiplyScalar(dt);
                user.position.add(testPoint);
                user.heading += user.dHeading * dt;
                user.rotation.set(0, user.heading, 0, "XYZ");
                if(user !== currentUser){ 
                    // we have to offset the rotation of the name so the user
                    // can read it.
                    user.nameObj.rotation.set(0, currentUser.heading - user.heading, 0, "XYZ");
                }
                if(!user.animation.isPlaying && user.velocity.length() >= 2){
                    user.animation.play();                
                }
                else if(user.animation.isPlaying && user.velocity.length() < 2){
                    user.animation.stop();
                }
            }

            //
            // place pointer
            //
            var pointerDistance = leap.getValue("HAND0Z") + mouse.getValue("pointerDistance") + 10;
            direction.set(
                leap.getValue("HAND0X"),
                leap.getValue("HAND0Y"),
                -pointerDistance)
                .applyAxisAngle(RIGHT, -pitch)
                .applyAxisAngle(camera.up, currentUser.heading);

            testPoint.copy(currentUser.position);
            testPoint.y += PLAYER_HEIGHT;
            hand.position.copy(testPoint)
                .add(direction);

            for(var j = 0; j < mainScene.buttons.length; ++j){
                var btn = mainScene.buttons[j];
                btn.wasPressed = btn.pressed;
                btn.pressed = false;
                btn.color.g = 0;
                btn.color.r = 0.5;
                btn.cap.position.y = btn.rest.y;
                
                direction.copy(btn.cap.position)
                    .add(btn.position)
                    .sub(camera.position);
                var len = direction.length();
                var box = 0.5;
                if(pointerDistance - box <= len && len <= pointerDistance + box){
                    btn.color.g = 0.5;
                
                    testPoint.copy(hand.position)
                        .sub(camera.position)
                        .normalize();

                    direction.normalize();
                    var dot = direction.dot(testPoint);
                    if(0.99 < dot){
                        testPoint.copy(hand.position);
                        var TEST_HEIGHT = 3;
                        var MAX_PRESS = -0.1;
                        testPoint.y += TEST_HEIGHT;
                        direction.set(0, -1, 0);
                        raycaster.set(testPoint, direction);
                        raycaster.far = TEST_HEIGHT * 2;
                        var intersections = raycaster.intersectObject(btn.cap.children[0]);
                        if(intersections.length > 0){
                            var inter = intersections[0];
                            var pressY = Math.max(MAX_PRESS, (hand.position.y - inter.point.y));
                            if(MAX_PRESS <= pressY && pressY <= 0){
                                btn.color.r = (1 + pressY) * 0.5 / MAX_PRESS;
                                btn.cap.position.y = btn.rest.y + pressY;
                                btn.pressed = pressY === MAX_PRESS;
                            }
                            hand.position.copy(inter.point);
                        }
                    }
                }
                if(!btn.wasPressed && btn.pressed){
                    btn.fireEvents("click");
                }
            }

            //
            // update audio
            //
            testPoint.copy(currentUser.position);
            testPoint.divideScalar(10);
            audio3d.setPosition(testPoint.x, testPoint.y, testPoint.z);
            audio3d.setVelocity(currentUser.velocity.x, currentUser.velocity.y, currentUser.velocity.z);
            testPoint.normalize();
            audio3d.setOrientation(testPoint.x, testPoint.y, testPoint.z, 0, 1, 0);

            //
            // update the camera
            //
            orientation.set(pitch, heading, roll, "YZX");
            camera.rotation.copy(orientation);
            camera.position.copy(currentUser.position);
            camera.position.y += PLAYER_HEIGHT;

            //
            // draw
            //
            if (effect){
                effect.render(scene, camera);
            }
            else {
                renderer.render(scene, camera);
            }
        }
        
        wasFocused = focused;
    }

    function setSize(w, h){
        if(camera){
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }

        chooseRenderingEffect(ctrls.renderingStyle.value);

        renderer.setSize(w, h);
        if (effect){
            effect.setSize(w, h);
        }
    }

    login = function(){
        if(socket){
            userName = ctrls.userNameField.value;
            var password = ctrls.passwordField.value;
            if(userName && password){
                socket.once("salt", function(salt){
                    var hash = CryptoJS.SHA512(salt + password).toString();
                    socket.emit("hash", hash);
                });
                ctrls.connectButton.innerHTML = "Connecting...";
                ctrls.connectButton.className = "secondary button";
                socket.emit("login", {
                    userName: userName,
                    email: ctrls.emailField.value
                });
            }
            else{
                msg("Please complete the form");
            }
        }
        else{
            msg("No socket available");
        }
    };
    
    function showOptions(){
        keyboard.pause(true);
        ctrls.options.style.display = "";
        mouse.exitPointerLock();
    }
    
    function hideOptions(){        
        keyboard.pause(false);
        ctrls.options.style.display = "none";
        requestFullScreen();
        mouse.requestPointerLock();
        showControls();

        if(head.isEnabled() || head.isReceiving()){
            mouse.enable("pitch", false);
            gamepad.enable("pitch", false);
        }
        else{
            mouse.enable("pitch", true);
            gamepad.enable("pitch", true);            
        }
    }

    function toggleOptions(){
        var show = ctrls.options.style.display !== "";
        if(show){
            showOptions();
        }
        else{
            hideOptions();
        }
    }

    function chooseRenderingEffect(type){
        switch(type){
            case "anaglyph": effect = new THREE.AnaglyphEffect(renderer, 5, window.innerWidth, window.innerHeight); break;
            case "stereo": effect = new THREE.StereoEffect(renderer); break;
            case "rift": effect = new THREE.OculusRiftEffect(renderer, {
                worldFactor: 1,
                HMD: {
                    hResolution: screen.availWidth,
                    vResolution: screen.availHeight,
                    hScreenSize: 0.126,
                    vScreenSize: 0.075,
                    interpupillaryDistance: 0.064,
                    lensSeparationDistance: 0.064,
                    eyeToScreenDistance: 0.051,
                    distortionK: [1, 0.22, 0.06, 0.0],
                    chromaAbParameter: [0.996, -0.004, 1.014, 0.0]
                }
            }); break;
            default: 
                effect = null;
                type = "regular";
                break;
        }
        
        if(ctrls.renderingStyle.value !== type){
            ctrls.renderingStyle.value = type;
        }
        
        if((lastRenderingType === "rift" || lastRenderingType === "stereo")
            && (type === "anaglyph" || type === "regular")){
            alert("The page must reload to enable the new settings.");
            document.location = document.location.href;
        }
        lastRenderingType = type;
    }
    
    function readChatBox(){
        showTyping(true, true, ctrls.textEntry.value);
        ctrls.textEntry.value = "";
    }
    
    function shutdown(){
        speech.enable(false);
        var state = readForm(ctrls);
        setSetting("formState", state);
    }
    
    function resetLocation(){
        currentUser.position.set(0, 2, 0);
        currentUser.velocity.set(0, 0, 0);
    }

    function showTyping(isLocal, isComplete, text){
        if(currentUser){
            if(lastText){
                currentUser.remove(lastText);
                lastText = null;
            }

            if(isComplete){
                socket.emit("chat", text);
            }
            else{
                if(isLocal){
                    socket.emit("typing", text);
                }
                if(text !== null && text !== undefined){
                    var textObj= new VUI.Text(
                        text, 0.125,
                        "white", "transparent",
                        0, PLAYER_HEIGHT, -4,
                        "right");
                    lastText = textObj;
                    currentUser.add(textObj);
                    if(clickSound){
                        audio3d.playBufferImmediate(clickSound, 0.5);
                    }
                }
            }
        }
    }

    function speechChat(){
        showTyping(true, true, speech.getValue("chat"));
    }

    function shiftLines(){
        for(var i = 0; i < chatLines.length; ++i){
            chatLines[i].position.y = PLAYER_HEIGHT + (chatLines.length - i) * CHAT_TEXT_SIZE * 1.333 - 1;
        }
    }

    function showChat(msg){
        msg = typeof(msg) === "string" ? msg : fmt("[$1]: $2", msg.userName, msg.text);
        if(currentUser){
            if(userName === msg.userName){
                showTyping(true, false, null);
            }
            var textObj= new VUI.Text(
                msg, CHAT_TEXT_SIZE,
                "white", "transparent",
                -2, 0, -5, "left");
            currentUser.add(textObj);
            chatLines.push(textObj);
            shiftLines();
            setTimeout(function(){
                currentUser.remove(textObj);
                chatLines.shift();
                shiftLines();
            }, 3000);
        }
        
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(msg));
        ctrls.chatLog.appendChild(div);
        ctrls.chatLog.scrollTop = ctrls.chatLog.scrollHeight;
        
        if(!focused && window.Notification){
            makeNotification(msg);
        }
    }
    
    function makeNotification(msg){
        if (Notification.permission === "granted") {
            if(lastNote !== null){
                msg = lastNote.body + "\n" + msg;
                lastNote.close();
                lastNote = null;
            }
            lastNote = new Notification(document.title, {
                icon: "../ico/chat.png",
                body: msg
            });
            lastNote.addEventListener("close", function(){
                lastNote = null;
            }, false);
            return lastNote;
        }
    };

    function reload(){
        if (isFullScreenMode()){
            document.location = document.location.href;
        }
        else {
            mouse.requestPointerLock();
            toggleFullScreen();
        }
    }

    function updateUserState(firstTime, userState){
        var user = user || users[userState.userName];
        if(!user){
            addUser(userState);
        }
        else{
            if(firstTime){
                user.position.set(
                    userState.x, 
                    // just in case the user falls through the world, 
                    // reloading will get them back to level.
                    Math.max(0, userState.y), 
                    userState.z);
                user.lastHeading = user.heading = userState.heading;
                user.dHeading = 0;
                if(userState.userName === userName){
                    startHeading = user.heading;
                }
            }
            else{
                user.velocity.set(
                    ((userState.x + userState.dx * dFrame) - user.position.x) / dFrame,
                    ((userState.y + userState.dy * dFrame) - user.position.y) / dFrame,
                    ((userState.z + userState.dz * dFrame) - user.position.z) / dFrame);
                user.dHeading = ((userState.heading + userState.dHeading * dFrame) - user.heading) / dFrame;
            }
        }
    }

    function addUser(userState){
        var user = null;
        if(!users[userState.userName]){
            if(userName === DEFAULT_USER_NAME
                || userState.userName !== userName){
                user = new THREE.Object3D();        
                var model = bearModel.clone();
                user.animation = model.animation;
                model.position.z = 1.33;
                user.add(model);

                user.nameObj = new VUI.Text(
                    userState.userName, 0.5,
                    "white", "transparent",
                    0, PLAYER_HEIGHT + 2.5, 0, 
                    "center");
                user.add(user.nameObj);

                user.velocity = new THREE.Vector3();

                if(userState.userName === DEFAULT_USER_NAME){
                    currentUser = user;
                }
                else{
                    msg("$1 has joined", userState.userName);
                }

                scene.add(user);
            }
            else{                
                delete users[DEFAULT_USER_NAME];
                user = currentUser;
            }
        }
        else {
            user = users[userState.userName];
        }
        
        users[userState.userName] = user;
        
        user.heading = userState.heading;
        updateUserState(true, userState);
    }
    
    function userLeft(userName){
        if(users[userName]){
            msg("$1 has disconnected", userName);
            scene.remove(users[userName]);
            delete users[userName];
        }
    }
    
    function listUsers(users){
        ctrls.connectButton.className = "secondary button";
        ctrls.connectButton.innerHTML = "Connected";
        proxy.connect(userName);
        users.sort(function(a){ return (a.userName === userName) ? -1 : 1;});
        for(var i = 0; i < users.length; ++i){
            updateUserState(true, users[i]);
        }
    }

    var closers = document.getElementsByClassName("closeSectionButton");
    for(var i = 0; i < closers.length; ++i){
        closers[i].addEventListener("click", hideOptions, false);
    }

    window.addEventListener("keyup", function(evt){
        if(evt.keyCode === KeyboardInput.GRAVEACCENT){
            toggleOptions();
        }
    }, false);

    ctrls.menuButton.addEventListener("click", showOptions, false);
    ctrls.fsButton.addEventListener("click", function(){
        requestFullScreen();
        mouse.requestPointerLock();
    }, false);
    ctrls.textEntry.addEventListener("change", readChatBox, false);
    ctrls.pointerLockButton.addEventListener("click", hideOptions, false);
    ctrls.fullScreenButton.addEventListener("click", toggleFullScreen, false);
    ctrls.renderingStyle.addEventListener("change", function(){
        chooseRenderingEffect(ctrls.renderingStyle.value);
    }, false);

    window.addEventListener("beforeunload", shutdown, false);

    head = new MotionInput("head", null, [
        { name: "heading", axes: [-MotionInput.HEADING] },
        { name: "pitch", axes: [MotionInput.PITCH] },
        { name: "roll", axes: [-MotionInput.ROLL] }
    ], proxy, oscope);

    mouse = new MouseInput("mouse", [
        { axis: MouseInput.DX, scale: 0.4 },
        { axis: MouseInput.DY, scale: 0.4 },
        { axis: MouseInput.IY, min: -2, max: 1.3 },
        { axis: MouseInput.DZ, scale: 0.125 },
        { axis: MouseInput.IZ, min: 0, max: 20  }
    ], [
        { name: "heading", axes: [-MouseInput.IX] },
        { name: "pitch", axes: [-MouseInput.IY] },
        { name: "pointerDistance", axes: [MouseInput.IZ] }
    ], proxy, oscope, renderer.domElement);
    
    var leapCommands = [];
    
    hand = new THREE.Mesh(new THREE.SphereGeometry(0.1 + i * 0.005, 4, 4), new THREE.MeshPhongMaterial({
        color: 0xffff00
    }));
    hand.name = "HAND0";
    scene.add(hand);
    leapCommands.push({ name: "HAND0X", axes: [LeapMotionInput["HAND0X"]], scale: 0.015 });
    leapCommands.push({ name: "HAND0Y", axes: [LeapMotionInput["HAND0Y"]], scale: 0.015, offset: -4 });
    leapCommands.push({ name: "HAND0Z", axes: [LeapMotionInput["HAND0Z"]], scale: -0.015, offset: 3 });
    
    leap = new LeapMotionInput("leap", null, null, leapCommands, proxy, oscope);
            
    touch = new TouchInput("touch", null, null, [
        { name: "heading", axes: [TouchInput.IX0] },
        { name: "drive", axes: [-TouchInput.DY0] }
    ], proxy, oscope, renderer.domElement);

    keyboard = new KeyboardInput("keyboard", [
        { name: "strafeLeft", buttons: [-KeyboardInput.A, -KeyboardInput.LEFTARROW] },
        { name: "strafeRight", buttons: [KeyboardInput.D, KeyboardInput.RIGHTARROW] },
        { name: "driveForward", buttons: [-KeyboardInput.W, -KeyboardInput.UPARROW] },
        { name: "driveBack", buttons: [KeyboardInput.S, KeyboardInput.DOWNARROW] },
        { name: "resetPosition", buttons: [KeyboardInput.P], commandUp: resetLocation },
        { name: "reload", buttons: [KeyboardInput.R], commandDown: reload, dt: 1 },
        { name: "chat", preamble: true, buttons: [KeyboardInput.T], commandUp: showTyping.bind(window, true)}
    ], proxy, oscope);
    keyboard.pause(true);

    gamepad = new GamepadInput("gamepad", [
        { axis: GamepadInput.LSX, deadzone: 0.2},
        { axis: GamepadInput.LSY, deadzone: 0.2},
        { axis: GamepadInput.RSX, deadzone: 0.2, scale: 1.5},
        { axis: GamepadInput.RSY, deadzone: 0.2, scale: 1.5}
    ], [
        { name: "strafe", axes: [GamepadInput.LSX]},
        { name: "drive", axes: [GamepadInput.LSY]},
        { name: "heading", axes: [-GamepadInput.IRSX]},
        { name: "pitch", axes: [GamepadInput.IRSY]},
        { name: "options", buttons: [9], commandUp: toggleOptions }
    ], proxy, oscope);

    speech = new SpeechInput("speech", [
        { name: "options", keywords: ["options"], commandUp: toggleOptions },
        { name: "chat", preamble: true, keywords: ["message"], commandUp: speechChat }
    ], proxy, oscope);

    gamepad.addEventListener("gamepadconnected", function (id){
        if (!gamepad.isGamepadSet() && ask(fmt("Would you like to use this gamepad? \"$1\"", id), true)){
            gamepad.setGamepad(id);
        }
    }, false);

    window.addEventListener("resize", function (){
        setSize(window.innerWidth, window.innerHeight);
    }, false);
    
    window.addEventListener("touchend", showControls, false);
    
    window.addEventListener("mousemove", function(evt){
        if(!mouse.isPointerLocked()){
            showControls();
        }
    }, false);
    
    window.addEventListener("focus", function(){
        focused = true;
    }, false);
    
    window.addEventListener("blur", function(){
        focused = false;
    }, false);
    
    document.addEventListener("focus", function(){
        focused = true;
    }, false);
    
    document.addEventListener("blur", function(){
        focused = false;
    }, false);

    function setupModuleEvents(module, name){
        var e = ctrls[name + "Enable"],
            t = ctrls[name + "Transmit"],
            r = ctrls[name + "Receive"];
            z = ctrls[name + "Zero"];
        e.addEventListener("change", function(){
            module.enable(e.checked);
            t.disabled = !e.checked;
            if(t.checked && t.disabled){
                t.checked = false;
            }
        });
        t.addEventListener("change", function(){
            module.transmit(t.checked);
        });
        r.addEventListener("change", function(){
            module.receive(r.checked);
        });

        if(z){
            z.addEventListener("click", module.zeroAxes.bind(module), false);
        }

        module.enable(e.checked);
        module.transmit(t.checked);
        module.receive(r.checked);
        t.disabled = !e.checked;
        if(t.checked && t.disabled){
            t.checked = false;
        }
    }

    setupModuleEvents(head, "head");
    setupModuleEvents(mouse, "mouse");
    setupModuleEvents(leap, "leap");
    setupModuleEvents(touch, "touch");
    setupModuleEvents(keyboard, "keyboard");
    setupModuleEvents(gamepad, "gamepad");
    setupModuleEvents(speech, "speech");

    var mainScene = null;
    ModelLoader.loadCollada("models/scene2.dae", progress, function(object){
        mainScene = object;
        scene.add(object);
        var cam = mainScene.Camera.children[0];
        camera = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, drawDistance);
        var button = new ModelLoader("models/button2.dae", progress, function(obj){ 
            var COUNT = 5;
            for(var i = -COUNT; i <= COUNT; ++i){
                var btn = new VUI.Button(button, "button" + (i + COUNT + 1));
                var angle = Math.PI * i * 10 / 180;
                var r = 10;
                btn.position.set(Math.cos(angle) * r, Math.cos(i * Math.PI) * 0.25, Math.sin(-angle) * r);
                btn.rotation.set(0, angle - Math.PI, 0, "XYZ");
                mainScene.buttons.push(btn);
                mainScene[btn.name] = btn;
                btn.addEventListener("click", function(n){
                    audio3d.sawtooth(40 - n * 5, 0.1, 0.25);
                }.bind(this, i));
                scene.add(btn.base);
            }
        });
    });

    var bearModel = new ModelLoader("models/bear.dae", progress, function(){
        addUser({x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, heading: 0, dHeading: 0, userName: userName});
    });

    audio3d.loadBuffer("music/click.mp3", progress, function(buffer){
        clickSound = buffer;
    });
    
    audio3d.load3DSound("music/ambient.mp3", true, 0, 0, 0, progress, function(amb){
        amb.volume.gain.value = 0.07;
        amb.source.start(0);
    });

    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    renderer.domElement.setAttribute("tabindex", 0);
    setSize(window.innerWidth, window.innerHeight);
    requestAnimationFrame(waitForResources);
    
    if(window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission(function (permission) {
            if (!Notification.permission) {
                Notification.permission = permission;
            }
        });
    }
}
