var isDebug = false, isLocal = document.location.hostname === "localhost",
    ctrls = findEverything(), tabs = makeTabSet(ctrls.options), login,
    prog = new LoadingProgress(
        "manifest/js/controllers/demo.js",
        "lib/three/three.js",
        "lib/three/StereoEffect.js",
        "lib/three/OculusRiftEffect.js",
        "lib/three/AnaglyphEffect.js",
        "lib/three/ColladaLoader.js",
        "lib/physics/cannon.min.js",
        "lib/leap-0.6.3.min.js",
        "lib/sha512.js",
        "/socket.io/socket.io.js",
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

function displayProgress(file){
    ctrls.triedSoFar.style.width = prog.makeSize(FileState.NONE, "size");
    ctrls.processedSoFar.style.width = prog.makeSize(FileState.STARTED | FileState.ERRORED | FileState.COMPLETE , "progress");
    ctrls.loadedSoFar.style.width = prog.makeSize(FileState.COMPLETE, "size");
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
        = fmt("Loading, please wait... $1 $2", file, ctrls.processedSoFar.style.width);
    ctrls.loadedSoFar.style.left = ctrls.errorSoFar.style.width = prog.makeSize(FileState.ERRORED, "size");
    if(prog.isDone()){
        ctrls.loading.style.display = "none";
        ctrls.connectButton.addEventListener("click", login, false);
        ctrls.connectButton.innerHTML = "Connect";
        ctrls.loadingMessage.innerHTML = "Loading complete!";
        setTimeout(function(){
            ctrls.loadingMessage.style.visibility = "hidden";
        }, 2000);

        if(ctrls.autoLogin.checked
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
    var BG_COLOR = 0xafbfff, CHAT_TEXT_SIZE = 0.25, 
        NO_HMD_SMARTPHONE = "Smartphone - no HMD",
        PLAYER_HEIGHT = 6.5,
        RIGHT = new THREE.Vector3(-1, 0, 0),
        GRAVITY = 9.8, SPEED = 15,
        lastRenderingType, currentButton, autoWalking = false,
        startHeading = 0,
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
                renderingStyle: {value: "regular" }
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
                renderingStyle: {value: "rift" }
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
                renderingStyle: {value: "regular" }
            }}
        ], readSettings),
        formState = getSetting("formState"),
        heading = 0, pitch = 0, roll = 0, strafe = 0, drive = 0,
        testPoint = new THREE.Vector3(),
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7),
        direction = new THREE.Vector3(),
        orientation = new THREE.Euler(0, 0, 0, "YZX"),
        skyboxRotation = new THREE.Euler(0, 0, 0, "XYZ"),
        onground = false,
        head, keyboard, mouse, gamepad, touch, speech, leap,
        dt, lt = 0, frame = 0, dFrame = 0.125,
        userName = null, lastText,
        chatLines = [],
        users = {}, 
        audio3d = new Audio3DOutput(),
        clickSound = null,
        oceanSound = null,
        oscope = new Oscope("demo"),
        camera, effect, drawDistance = 500,
        scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        repeater = new SpeechOutput.Character(),
        proxy = null;

    tabs.style.width = pct(100);
    renderer.setClearColor(BG_COLOR);
    writeForm(ctrls, formState);
    oscope.connect();
    proxy = new WebRTCSocket(socket, ctrls.defaultDisplay.checked);
    
    socket.on("typing", showTyping.bind(window, false, false));
    socket.on("chat", showChat);    
    socket.on("userJoin", addUser);
    socket.on("userState", updateUserState);
    socket.on("userLeft", userLeft);
    socket.on("loginFailed", msg.bind(window, "Incorrect user name or password!"));
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
    var hideControlsTimeout = null;
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
        else if(users[userName]){
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
        if(camera && userName && users[userName]){
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

            users[userName].dHeading = (heading - users[userName].heading) / dt;
            strafe = keyboard.getValue("strafeRight")
                + keyboard.getValue("strafeLeft")
                + gamepad.getValue("strafe");
            drive = keyboard.getValue("driveBack")
                + keyboard.getValue("driveForward")
                + gamepad.getValue("drive")
                + touch.getValue("drive");

            if(onground || users[userName].position.y < -0.5){                
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
                len = strafe * Math.cos(users[userName].heading) + drive * Math.sin(users[userName].heading);
                drive = drive * Math.cos(users[userName].heading) - strafe * Math.sin(users[userName].heading);
                strafe = len;
                users[userName].velocity.x = users[userName].velocity.x * 0.9 + strafe * 0.1;
                users[userName].velocity.z = users[userName].velocity.z * 0.9 + drive * 0.1;
            }

            users[userName].velocity.y -= dt * GRAVITY;

            //
            // "water"
            //
            if(users[userName].position.y < -0.5){
                users[userName].velocity.multiplyScalar(0.925);
            }

            //
            // do collision detection
            //
            var len = users[userName].velocity.length() * dt;
            direction.copy(users[userName].velocity);
            direction.normalize();
            testPoint.copy(users[userName].position);
            testPoint.y += PLAYER_HEIGHT / 2;
            raycaster.set(testPoint, direction);
            raycaster.far = len;
            intersections = raycaster.intersectObject(scene, true);
            for(var i = 0; i < intersections.length; ++i){
                var inter = intersections[i];
                if(inter.object.parent.isSolid){
                    testPoint.copy(inter.face.normal);
                    testPoint.applyEuler(inter.object.parent.rotation);
                    users[userName].velocity.reflect(testPoint);
                    var d = testPoint.dot(camera.up);
                    if(d > 0.75){
                        users[userName].position.y = inter.point.y + 0.0125;
                        users[userName].velocity.y = 0.1;
                        onground = true;
                    }
                }
            }

            // ground test
            testPoint.copy(users[userName].position);
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
                    users[userName].position.y = inter.point.y + 0.0125;
                    users[userName].velocity.y = 0.1;
                    onground = true;
                }
            }

            //
            // send a network update of the user's position, if it's been enough 
            // time since the last update (don't want to flood the server).
            //
            frame += dt;
            if(frame > dFrame){
                frame -= dFrame;
                var state = {
                    x: users[userName].position.x,
                    y: users[userName].position.y,
                    z: users[userName].position.z,
                    dx: users[userName].velocity.x,
                    dy: users[userName].velocity.y,
                    dz: users[userName].velocity.z,
                    heading: users[userName].heading,
                    dHeading: (users[userName].heading - users[userName].lastHeading) / dFrame,
                    isRunning: users[userName].velocity.length() > 0
                };
                users[userName].lastHeading = users[userName].heading;
                socket.emit("userState", state);
            }
        }

        //
        // update avatars
        //
        for(var key in users){
            var bear = users[key];
            testPoint.copy(bear.velocity);
            testPoint.multiplyScalar(dt);
            bear.position.add(testPoint);
            bear.heading += bear.dHeading * dt;
            bear.rotation.set(0, bear.heading, 0, "XYZ");
            if(key !== userName){ 
                // we have to offset the rotation of the name so the user
                // can read it.
                bear.nameObj.rotation.set(0, users[userName].heading - bear.heading, 0, "XYZ");
            }
            if(!bear.animation.isPlaying && bear.velocity.length() >= 2){
                bear.animation.play();                
            }
            else if(bear.animation.isPlaying && bear.velocity.length() < 2){
                bear.animation.stop();
            }
        }

        //
        // place pointer
        //        
        if(currentButton){
            var btn = mainScene[currentButton];
            btn.position.y = btn.originalY;
            btn.children[0].material.materials[0].color.g = 0;
            btn.children[0].material.materials[0].color.r = 0.5;
            currentButton = null;
        }
        
        for(var i = 0; i < fingerParts.length / 2; ++i){
            var knuckle = fingerParts[i];
            var name = knuckle.name;
            direction.set(
                leap.getValue(name + "X"),
                leap.getValue(name + "Y"),
                leap.getValue(name + "Z") + mouse.getValue("pointerDistance"))
                .applyAxisAngle(RIGHT, -pitch)
                .applyAxisAngle(camera.up, users[userName].heading);

            testPoint.copy(users[userName].position);
            testPoint.y += PLAYER_HEIGHT;
            knuckle.position.copy(testPoint);
            knuckle.position.add(direction);
        
            if(name.indexOf("TIP") > 0){
            testPoint.copy(knuckle.position);
            direction.set(0, -1, 0);
                raycaster.set(testPoint, direction);
                raycaster.far = 0.25;

                for(var j = 0; j < mainScene.buttons.length; ++j){
                    var btn = mainScene.buttons[j];
                    var intersections = raycaster.intersectObject(btn.children[0]);
                    if(intersections.length === 1){
                        var inter = intersections[0];
                        if(currentButton){
                            var btn = mainScene[currentButton];
                            btn.position.y = btn.originalY;
                            btn.children[0].material.materials[0].color.g = 0;
                            btn.children[0].material.materials[0].color.r = 0.5;
                            currentButton = null;
                        }
                        currentButton = btn.name;
                        btn.originalY = btn.position.y;
                        btn.position.y = btn.originalY - 0.05;
                        inter.object.material.materials[0].color.g = 0.5;
                        inter.object.material.materials[0].color.r = 0.0;
                        break;
                    }
                }
            }
        }

        //
        // update audio
        //
        testPoint.copy(users[userName].position);
        testPoint.divideScalar(10);
        audio3d.setPosition(testPoint.x, testPoint.y, testPoint.z);
        audio3d.setVelocity(users[userName].velocity.x, users[userName].velocity.y, users[userName].velocity.z);
        testPoint.normalize();
        audio3d.setOrientation(testPoint.x, testPoint.y, testPoint.z, 0, 1, 0);

        //
        // place the skybox centered to the camera
        //
        if(mainScene.Skybox){
            skyboxRotation.set(lt*0.00001, 0, 0, "XYZ");
            mainScene.Skybox.position.copy(users[userName].position);
            mainScene.Skybox.setRotationFromEuler(skyboxRotation);
        }
        
        //
        // update the camera
        //
        orientation.set(pitch, heading, roll, "YZX");
        camera.rotation.copy(orientation);
        camera.position.copy(users[userName].position);
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

    function toggleOptions(){
        var show = ctrls.options.style.display !== "";
        keyboard.pause(show);
        ctrls.options.style.display = (show ? "" : "none");
        if(show){
            mouse.exitPointerLock();
        }
        else{
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

    function jump(){
        if (onground || users[userName].position.y < -0.5){
            users[userName].velocity.y = 10;
            onground = false;
        }
    }
    
    function resetLocation(){
        users[userName].position.set(0, 2, 0);
        users[userName].velocity.set(0, 0, 0);
    }
    
    function fireButton(){
        if(currentButton && buttonHandlers[currentButton]){
            var btn = mainScene[currentButton];
            buttonHandlers[currentButton](btn);
        }
    }

    var buttonHandlers = {
        button1: function(btn){
            msg("Clicked $1", currentButton);
        },
        button2: function(btn){
            repeater.speak("That's okay. Try again.");
        },
        button3: function(btn){
            repeater.speak("Incorrect, you get no more chances. You are on the way to destruction. Make your time.");
        },
        button4: function(btn){
            msg("Clicked $1", currentButton);
            repeater.speak("You clicked the fourth button");
        }
    };

    function showTyping(isLocal, isComplete, text){
        if(users[userName]){
            if(lastText){
                users[userName].remove(lastText);
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
                    users[userName].add(textObj);
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
        if(users[userName]){
            if(userName === msg.userName){
                showTyping(true, false, null);
            }
            var textObj= new VUI.Text(
                msg, CHAT_TEXT_SIZE,
                "white", "transparent",
                -2, 0, -5, "left");
            users[userName].add(textObj);
            chatLines.push(textObj);
            shiftLines();
            setTimeout(function(){
                users[userName].remove(textObj);
                chatLines.shift();
                shiftLines();
            }, 3000);
        }
        var div = document.createElement("div");
        div.appendChild(document.createTextNode(msg));
        ctrls.chatLog.appendChild(div);
        ctrls.chatLog.scrollTop = ctrls.chatLog.scrollHeight; 
   }

    function reload(){
        if (isFullScreenMode()){
            document.location = document.location.href;
        }
        else {
            mouse.requestPointerLock();
            toggleFullScreen();
        }
    }

    function updateUserState(userState, firstTime){
        var bear = users[userState.userName];
        if(!bear){
            addUser(userState);
        }
        else{
            if(firstTime){
                bear.position.set(
                    userState.x, 
                    // just in case the user falls through the world, 
                    // reloading will get them back to level.
                    Math.max(0, userState.y), 
                    userState.z);
                bear.lastHeading = bear.heading = userState.heading;
                bear.dHeading = 0;
                if(userState.userName === userName){
                    startHeading = bear.heading;
                }
            }
            else{
                bear.velocity.set(
                    ((userState.x + userState.dx * dFrame) - bear.position.x) / dFrame,
                    ((userState.y + userState.dy * dFrame) - bear.position.y) / dFrame,
                    ((userState.z + userState.dz * dFrame) - bear.position.z) / dFrame);
                bear.dHeading = ((userState.heading + userState.dHeading * dFrame) - bear.heading) / dFrame;
            }
        }
    }

    function addUser(userState){
        var bear = new THREE.Object3D();
        users[userState.userName] = bear;
        var model = bearModel.clone();
        bear.animation = model.animation;
        model.position.z = 1.33;
        bear.add(model);
        bear.heading = userState.heading;
        bear.nameObj = new VUI.Text(
            userState.userName, 0.5,
            "white", "transparent",
            0, PLAYER_HEIGHT + 2.5, 0, 
            "center");
        bear.add(bear.nameObj);
        bear.velocity = new THREE.Vector3();
        updateUserState(userState, true);
        scene.add(bear);
        msg("$1 has joined", userState.userName);
    }
    
    function userLeft(userName){
        if(users[userName]){
            msg("$1 has disconnected", userName);
            scene.remove(users[userName]);
            delete users[userName];
        }
    }
    
    function listUsers(users){
        proxy.connect(userName);
        users.sort(function(a){ return (a.userName === userName) ? -1 : 1;});
        for(var i = 0; i < users.length; ++i){
            addUser(users[i]);
        }
    }

    var closers = document.getElementsByClassName("closeSectionButton");
    for(var i = 0; i < closers.length; ++i){
        closers[i].addEventListener("click", toggleOptions, false);
    }

    window.addEventListener("keyup", function(evt){
        if(evt.keyCode === KeyboardInput.GRAVEACCENT){
            toggleOptions();
        }
    }, false);

    ctrls.menuButton.addEventListener("click", toggleOptions, false);
    ctrls.textEntry.addEventListener("change", readChatBox, false);
    ctrls.pointerLockButton.addEventListener("click", toggleOptions, false);
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
        { axis: MouseInput.DZ, scale: -0.125 },
        { axis: MouseInput.IZ, min: -20, max: 0  }
    ], [
        { name: "heading", axes: [-MouseInput.IX] },
        { name: "pitch", axes: [-MouseInput.IY] },
        { name: "pointerDistance", axes: [MouseInput.IZ] },
        { name: "fire", buttons: [1], commandUp: fireButton }
    ], proxy, oscope, renderer.domElement);
    
    var fingerParts = [];
    var leapCommands = [
        { name: "fire", buttons: [1], commandUp: fireButton }
    ];
    
    for(var i = 0; i < LeapMotionInput.NUM_FINGERS; ++i){
        var finger = "finger" + i;
        for(var j = 0; j < LeapMotionInput.FINGER_PARTS.length; ++j){
            if(j === 0 || j === LeapMotionInput.FINGER_PARTS.length - 2){
                var knuckle = (finger + LeapMotionInput.FINGER_PARTS[j]).toUpperCase();
                var k = new THREE.Mesh(new THREE.SphereGeometry(0.1 + j * 0.005, 4, 4), new THREE.MeshPhongMaterial({
                    color: 0xffff00
                }));
                k.name = knuckle;
                fingerParts.push(k);
                scene.add(k);
                leapCommands.push({ name: knuckle + "X", axes: [LeapMotionInput[knuckle + "X"]], scale: 0.015 });
                leapCommands.push({ name: knuckle + "Y", axes: [LeapMotionInput[knuckle + "Y"]], scale: 0.015, offset: -4 });
                leapCommands.push({ name: knuckle + "Z", axes: [LeapMotionInput[knuckle + "Z"]], scale: 0.015, offset: -6 });
            }
        }
    }
    
    leap = new LeapMotionInput("leap", [
        { name: "fire", x: -500, y: -500, z: -500, w: 1000, h: 1000, d: 1000 }
    ], null, leapCommands, proxy, oscope);
            
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
        { name: "jump", buttons: [KeyboardInput.SPACEBAR], commandDown: jump, dt: 0.5 },
        { name: "fire", buttons: [KeyboardInput.CTRL], commandUp: fireButton },
        { name: "reload", buttons: [KeyboardInput.R], commandDown: reload, dt: 1 },
        { name: "chat", preamble: true, buttons: [KeyboardInput.T], commandUp: showTyping.bind(window, true)}
    ], proxy, oscope);

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
        { name: "jump", buttons: [1], commandDown: jump, dt: 0.5 },
        { name: "fire", buttons: [2], commandUp: fireButton },
        { name: "options", buttons: [9], commandUp: toggleOptions }
    ], proxy, oscope);

    speech = new SpeechInput("speech", [
        { name: "jump", keywords: ["jump"], commandUp: jump },
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

    var mainScene = new ModelLoader("models/scene.dae", progress, function(object){
        scene.add(object);
        var cam = mainScene.Camera.children[0];
        camera = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, drawDistance);
        audio3d.load3DSound(
            "music/ocean.mp3", true,
            mainScene.Campfire.position.x,
            mainScene.Campfire.position.y,
            mainScene.Campfire.position.z,
            progress,
            function(snd){
                oceanSound = snd;
                snd.source.start(0);
            }
        );
        var v = 0.55 * drawDistance;
        mainScene.Skybox.scale.set(v, v, v);
    });

    var bearModel = new ModelLoader("models/bear.dae", progress);

    audio3d.loadBufferCascadeSrcList(["music/click.mp3", "music/click.ogg"], progress, function(buffer){
        clickSound = buffer;
    });

    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    renderer.domElement.setAttribute("tabindex", 0);
    setSize(window.innerWidth, window.innerHeight);
    toggleOptions();
    requestAnimationFrame(waitForResources);
}
