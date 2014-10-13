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
        "lib/droid_sans_regular.typeface.js",
        "/socket.io/socket.io.js",
        "js/oscope/oscope.client.js",
        "js/ModelLoader.js",
        "js/input/NetworkedInput.js",
        "js/input/ButtonAndAxisInput.js",
        "js/input/SpeechInput.js",
        "js/input/GamepadInput.js",
        "js/input/KeyboardInput.js",
        "js/input/MotionInput.js",
        "js/input/MouseInput.js",
        "js/input/TouchInput.js",
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
    var BG_COLOR = 0xafbfff, CHAT_TEXT_SIZE = 0.25, 
        TRACKING_SCALE = 0, TRACKING_SCALE_COMP = 1 - TRACKING_SCALE,
        NO_HMD_SMARTPHONE = "Smartphone - no HMD",
        PLAYER_HEIGHT = 6.5,
        RIGHT = new THREE.Vector3(-1, 0, 0),
        GRAVITY = 9.8, SPEED = 15,
        lastRenderingType, currentButton, autoWalking = false,
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
        pitch = 0, roll = 0, strafe = 0, drive = 0,
        testPoint = new THREE.Vector3(),
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7),
        direction = new THREE.Vector3(),
        orientation = new THREE.Euler(0, 0, 0, "YZX"),
        skyboxRotation = new THREE.Euler(0, 0, 0, "XYZ"),
        onground = false,
        head, keyboard, mouse, gamepad, touch, speech,
        dt, lt = 0, frame = 0, dFrame = 0.125,
        userName = null,
        chatLines = [],
        audio3d = new Audio3DOutput(),
        oceanSound = null,
        socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        }),
        oscope = new Oscope("demo"),
        bears = {}, lastText,
        camera, effect, drawDistance = 500,
        scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        pointer = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 2), new THREE.MeshBasicMaterial({
            color: 0xffff00
        })),
        repeater = new SpeechOutput.Character();

    tabs.style.width = pct(100);
    renderer.setClearColor(BG_COLOR);
    scene.add(pointer);
    pointer.visible = false;
    writeForm(ctrls, formState);
    oscope.connect();
    
    socket.on("handshakeFailed", console.warn.bind(console, "Failed to connect to websocket server. Available socket controllers are:"));
    socket.on("handshakeComplete", function(controller){
        if(controller === "demo"){
            console.log("Connected to websocket server.");
        }
    });
    socket.on("loginFailed", msg.bind(window, "Incorrect user name or password!"));
    socket.on("userList", listUsers);
    socket.on("userJoin", addUser);
    socket.on("userState", updateUserState);
    socket.on("typing", showTyping.bind(window, false, false));
    socket.on("chat", showChat);
    socket.on("userLeft", userLeft);
    socket.on("disconnect", msg.bind(window));
    socket.emit("handshake", "demo");
    
    function readSettings(){
        for(var key in ctrls){
            if(key !== "deviceTypes"){
                var evt = new Event("change");
                ctrls[key].dispatchEvent(evt);
            }
            else {
                showHideControls();
            }
        }
    }
    
    function showHideControls(){
        ctrls.onScreenControls.style.display = 
            (ctrls.deviceTypes.value === NO_HMD_SMARTPHONE
            || !ctrls.defaultDisplay.checked) 
                ? "" 
                : "none";
    }

    function msg(){
        var txt = map(arguments, function(v){
            return v ? v.toString() : "";
        }).join(" ");
        if(isDebug){
            console.log.apply(console, arguments);
        }
        else if(bears[userName]){
            showChat(txt);
            //repeater.speak(txt);
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
        if(camera && userName && bears[userName]){
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

        if(ctrls.defaultDisplay.checked){
            update(dt);
        }
    }
    
    function update(dt){
        THREE.AnimationHandler.update(dt);

        //
        // update user position and view
        //
        if(onground || bears[userName].position.y < -0.5){                
            if(autoWalking){
                strafe = 0;
                drive = -0.5;
            }
            else{
                strafe = keyboard.getValue("strafeRight")
                    + keyboard.getValue("strafeLeft")
                    + gamepad.getValue("strafe");
                drive = keyboard.getValue("driveBack")
                    + keyboard.getValue("driveForward")
                    + gamepad.getValue("drive")
                    + touch.getValue("drive");
            }
            if(strafe || drive){
                len = SPEED * Math.min(1, 1 / Math.sqrt(drive * drive + strafe * strafe));

                if(bears[userName] && !bears[userName].animation.isPlaying){
                    bears[userName].animation.play();
                }
            }
            else{
                len = 0;
                if(bears[userName] && bears[userName].animation.isPlaying){
                    bears[userName].animation.stop();
                }
            }

            strafe *= len;
            drive *= len;
            len = strafe * Math.cos(bears[userName].heading) + drive * Math.sin(bears[userName].heading);
            drive = drive * Math.cos(bears[userName].heading) - strafe * Math.sin(bears[userName].heading);
            strafe = len;
            bears[userName].velocity.x = bears[userName].velocity.x * 0.9 + strafe * 0.1;
            bears[userName].velocity.z = bears[userName].velocity.z * 0.9 + drive * 0.1;
        }
        
        bears[userName].velocity.y -= dt * GRAVITY;
        
        bears[userName].heading = head.getValue("heading")
            + touch.getValue("heading")
            + mouse.getValue("heading")
            + gamepad.getValue("heading");
        pitch = head.getValue("pitch") 
            + mouse.getValue("pitch") 
            + gamepad.getValue("pitch");
        roll = head.getValue("roll");

        //
        // "water"
        //
        if(bears[userName].position.y < -0.5){
            bears[userName].velocity.multiplyScalar(0.925);
        }

        //
        // do collision detection
        //
        var len = bears[userName].velocity.length() * dt;
        direction.copy(bears[userName].velocity);
        direction.normalize();
        testPoint.copy(bears[userName].position);
        testPoint.y += 1;
        raycaster.set(testPoint, direction);
        raycaster.far = len;// * 2;
        intersections = raycaster.intersectObject(scene, true);
        for(var i = 0; i < intersections.length; ++i){
            var inter = intersections[i];
            if(inter.object.parent.isSolid){
                testPoint.copy(inter.face.normal);
                testPoint.applyEuler(inter.object.parent.rotation);
                bears[userName].velocity.reflect(testPoint);
                var d = testPoint.dot(camera.up);
                if(d > 0.75){
                    bears[userName].position.y = inter.point.y + 0.0125;
                    bears[userName].velocity.y = 0.1;
                    onground = true;
                }
            }
        }

        // ground test
        testPoint.copy(bears[userName].position);
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
                bears[userName].position.y = inter.point.y + 0.0125;
                bears[userName].velocity.y = 0.1;
                onground = true;
            }
        }

        //
        // place pointer
        //
        direction.set(0, 0, -4)
            .applyAxisAngle(RIGHT, -pitch)
            .applyAxisAngle(camera.up, bears[userName].heading);
        testPoint.copy(bears[userName].position);
        testPoint.y += PLAYER_HEIGHT;
        pointer.position.copy(testPoint);
        pointer.position.add(direction);
        direction.normalize();
        raycaster.set(testPoint, direction);
        raycaster.far = 7;
        var intersections = raycaster.intersectObject(scene, true);
        if(currentButton){
            var btn = mainScene[currentButton];
            btn.position.y = btn.originalY;
            btn.children[0].material.materials[0].color.g = 0;
            btn.children[0].material.materials[0].color.r = 0.5;
            currentButton = null;
        }
        
        for(var i = 0; i < intersections.length; ++i){
            var inter = intersections[i];
            if(inter.object.parent.isSolid || inter.object.parent.isButton){
                pointer.position.copy(inter.point);

                if(inter.object.parent.isButton){
                    currentButton = inter.object.parent.name;
                    var btn = mainScene[currentButton];
                    btn.originalY = btn.position.y;
                    if(pointer.visible){
                        btn.position.y = btn.originalY - 0.05;
                    }
                    inter.object.material.materials[0].color.g = 0.5;
                    inter.object.material.materials[0].color.r = 0.0;
                    break;
                }
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
                x: bears[userName].position.x,
                y: bears[userName].position.y,
                z: bears[userName].position.z,
                dx: bears[userName].velocity.x,
                dy: bears[userName].velocity.y,
                dz: bears[userName].velocity.z,
                heading: bears[userName].heading,
                dHeading: (bears[userName].heading - bears[userName].lastHeading) / dFrame,
                isRunning: bears[userName].velocity.length() > 0
            };
            bears[userName].lastHeading = bears[userName].heading;
            socket.emit("userState", state);
        }

        //
        // update audio
        //
        testPoint.copy(bears[userName].position);
        testPoint.divideScalar(10);
        audio3d.setPosition(testPoint.x, testPoint.y, testPoint.z);
        audio3d.setVelocity(bears[userName].velocity.x, bears[userName].velocity.y, bears[userName].velocity.z);
        testPoint.normalize();
        audio3d.setOrientation(testPoint.x, testPoint.y, testPoint.z, 0, 1, 0);

        //
        // place the skybox centered to the camera
        //
        if(mainScene.Skybox){
            skyboxRotation.set(lt*0.00001, 0, 0, "XYZ");
            mainScene.Skybox.position.copy(bears[userName].position);
            mainScene.Skybox.setRotationFromEuler(skyboxRotation);
        }

        //
        // update avatars
        //
        for(var key in bears){
            var bear = bears[key];
            testPoint.copy(bear.velocity);
            testPoint.multiplyScalar(dt);
            bear.position.add(testPoint);
            bear.heading += bear.dHeading * dt;
            bear.rotation.set(0, bear.heading, 0, "XYZ");
            if(key !== userName){ 
                // we have to offset the rotation of the name so the user
                // can read it.
                bear.nameObj.rotation.set(0, bears[userName].heading - bear.heading, 0, "XYZ");
            }
        }
        
        //
        // update the camera
        //
        orientation.set(pitch, bears[userName].heading, roll, "YZX");
        camera.rotation.copy(orientation);
        camera.position.copy(bears[userName].position);
        camera.position.y = 0.01 * Math.round(camera.position.y * 100);
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
                socket.emit("login", {
                    userName: userName,
                    password: password,
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
        if(!show){
            requestFullScreen();
            mouse.requestPointerLock();
        }
        else{
            mouse.exitPointerLock();
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
        if (onground || bears[userName].position.y < -0.5){
            bears[userName].velocity.y = 10;
            onground = false;
        }
    }
    
    function autoWalk(){
        autoWalking = !autoWalking;
    }
    
    function showPointer(){
        pointer.visible = true;
    }
    
    function fireButton(){
        pointer.visible = false;
        if(currentButton && buttonHandlers[currentButton]){
            var btn = mainScene[currentButton];
            buttonHandlers[currentButton](btn);
        }
    }

    var buttonHandlers = {
        button1: function(btn){
            msg("Clicked " + currentButton);
        },
        button2: function(btn){
            repeater.speak("That's okay. Try again.");
        },
        button3: function(btn){
            repeater.speak("Incorrect, you get no more chances. You are on the way to destruction. Make your time.");
        },
        button4: function(btn){
            msg("Clicked " + currentButton);
            repeater.speak("You clicked the fourth button");
        }
    };

    function showTyping(isLocal, isComplete, text){
        if(bears[userName]){
            if(lastText){
                bears[userName].remove(lastText);
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
                    bears[userName].add(textObj);
                }
            }
        }
    }

    function speechChat(){
        showTyping(true, true, speech.getValue("chat"));
    }

    function shiftLines(){
        for(var i = 0; i < chatLines.length; ++i){
            chatLines[i].position.y = PLAYER_HEIGHT + (chatLines.length - i) * CHAT_TEXT_SIZE * 1.333;
        }
    }

    function showChat(msg){
        msg = typeof(msg) === "string" ? msg : fmt("[$1]: $2", msg.userName, msg.text);
        if(bears[userName]){
            if(userName === msg.userName){
                showTyping(true, false, null);
            }
            var textObj= new VUI.Text(
                msg, CHAT_TEXT_SIZE,
                "white", "transparent",
                -2, 0, -5, "left");
            bears[userName].add(textObj);
            chatLines.push(textObj);
            shiftLines();
            setTimeout(function(){
                bears[userName].remove(textObj);
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
        var bear = bears[userState.userName];
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
                bear.heading = userState.heading;
                bear.dHeading = 0;
            }
            else{
                bear.velocity.set(
                    ((userState.x + userState.dx * dFrame) - bear.position.x) / dFrame,
                    ((userState.y - PLAYER_HEIGHT + userState.dy * dFrame) - bear.position.y) / dFrame,
                    ((userState.z + userState.dz * dFrame) - bear.position.z) / dFrame);
                bear.dHeading = ((userState.heading + userState.dHeading * dFrame) - bear.heading) / dFrame;
            }
        }
    }

    function addUser(userState){
        var bear = new THREE.Object3D();
        var model = bearModel.clone(userState.userName, socket);
        model.position.z = 1.33;
        bear.animation = model.animation;
        bear.add(model);
        bear.heading = userState.heading;
        bear.nameObj = new VUI.Text(
            userState.userName, 0.5,
            "white", "transparent",
            0, PLAYER_HEIGHT + 2.5, 0, 
            "center");
        bear.add(bear.nameObj);
        bear.velocity = new THREE.Vector3();

        if(userState.userName !== userName){
            msg("user joined: " + userState.userName);
        }
        bears[userState.userName] = bear;
        updateUserState(userState, true);
        scene.add(bear);
    }
    
    function userLeft(userName){
        if(bears[userName]){
            msg("user disconnected:", userName);
            scene.remove(bears[userName]);
            delete bears[userName];
        }
    }
    
    function listUsers(users){
        for(var i = 0; i < users.length; ++i){
            addUser(users[i]);
        }
        msg("You are now connected to the device server.");
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
    ], socket, oscope);

    mouse = new MouseInput("mouse", [
        { axis: MouseInput.DX, scale: 0.4 },
        { axis: MouseInput.DY, scale: 0.4 },
        { axis: MouseInput.IY, min: -2, max: 1.3 }
    ], [
        { name: "heading", axes: [-MouseInput.IX] },
        { name: "pitch", axes: [-MouseInput.IY]},
        { name: "fire", buttons: [1], commandDown: showPointer, commandUp: fireButton }
    ], socket, oscope, renderer.domElement);

    touch = new TouchInput("touch", null, null, [
        { name: "heading", axes: [TouchInput.IX0] },
        { name: "drive", axes: [-TouchInput.DY0] }
    ], socket, oscope, renderer.domElement);

    keyboard = new KeyboardInput("keyboard", [
        { name: "strafeLeft", buttons: [-KeyboardInput.A, -KeyboardInput.LEFTARROW] },
        { name: "strafeRight", buttons: [KeyboardInput.D, KeyboardInput.RIGHTARROW] },
        { name: "driveForward", buttons: [-KeyboardInput.W, -KeyboardInput.UPARROW] },
        { name: "driveBack", buttons: [KeyboardInput.S, KeyboardInput.DOWNARROW] },
        { name: "jump", buttons: [KeyboardInput.SPACEBAR], commandDown: jump, dt: 0.5 },
        { name: "fire", buttons: [KeyboardInput.CTRL], commandDown: showPointer, commandUp: fireButton },
        { name: "reload", buttons: [KeyboardInput.R], commandDown: reload, dt: 1 },
        { name: "chat", preamble: true, buttons: [KeyboardInput.T], commandUp: showTyping.bind(window, true)}
    ], socket, oscope);

    gamepad = new GamepadInput("gamepad", [
        { axis: GamepadInput.LSX, deadzone: 0.2},
        { axis: GamepadInput.LSY, deadzone: 0.2},
        { axis: GamepadInput.RSX, deadzone: 0.2, scale: 1.5},
        { axis: GamepadInput.RSY, deadzone: 0.2, scale: 1.5},
        { axis: GamepadInput.IRSY, min: -2, max: 1.3 }
    ], [
        { name: "strafe", axes: [GamepadInput.LSX]},
        { name: "drive", axes: [GamepadInput.LSY]},
        { name: "heading", axes: [-GamepadInput.IRSX]},
        { name: "pitch", axes: [GamepadInput.IRSY]},
        { name: "jump", buttons: [1], commandDown: jump, dt: 0.5 },
        { name: "fire", buttons: [2], commandDown: showPointer, commandUp: fireButton },
        { name: "options", buttons: [9], commandUp: toggleOptions }
    ], socket, oscope);

    speech = new SpeechInput("speech", [
        { name: "jump", keywords: ["jump"], commandUp: jump },
        { name: "options", keywords: ["options"], commandUp: toggleOptions },
        { name: "chat", preamble: true, keywords: ["message"], commandUp: speechChat }
    ], socket, oscope);

    gamepad.addEventListener("gamepadconnected", function (id){
        if (!gamepad.isGamepadSet() && ask(fmt("Would you like to use this gamepad? \"$1\"", id), true)){
            gamepad.setGamepad(id);
        }
    }, false);

    window.addEventListener("resize", function (){
        setSize(window.innerWidth, window.innerHeight);
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
    setupModuleEvents(touch, "touch");
    setupModuleEvents(keyboard, "keyboard");
    setupModuleEvents(gamepad, "gamepad");
    setupModuleEvents(speech, "speech");

    var mainScene = new ModelLoader("models/scene.dae", progress, function(object){
        scene.add(object);
        var cam = mainScene.Camera.children[0];
        camera = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, drawDistance);
        mainScene.Ocean.children[0].material.transparent = true;
        mainScene.Ocean.children[0].material.opacity = 0.75;
        audio3d.loadSound3D(
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

    audio3d.loadSoundFixed("music/game1.ogg.break", true, progress, function(snd){
        snd.volume.gain.value = 1;
        snd.source.start(0);
    });

    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    renderer.domElement.setAttribute("tabindex", 0);
    setSize(window.innerWidth, window.innerHeight);

    toggleOptions();    
    showHideControls();
    requestAnimationFrame(waitForResources);
}
