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
    var BG_COLOR = 0xafbfff, CLUSTER = 2, CHAT_TEXT_SIZE = 0.25, 
        TRACKING_SCALE = 0, TRACKING_SCALE_COMP = 1 - TRACKING_SCALE,
        PLAYER_HEIGHT = 6.5,
        RIGHT = new THREE.Vector3(-1, 0, 0),
        GRAVITY = 9.8, SPEED = 15,
        lastRenderingType, currentButton, autoWalking = false,
        deviceStates = new StateList(ctrls.deviceTypes, ctrls, [
            { name: "-- select device --" },
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
            { name: "Smartphone - no HMD", values:{
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
        pitch = 0, roll = 0, heading = 0, lastHeading = 0, dheading = 0,
        velocity = new THREE.Vector3(), location = new THREE.Vector3(),
        testPoint = new THREE.Vector3(),
        raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7),
        direction = new THREE.Vector3(), orientation = new THREE.Euler(0, 0, 0, "YZX"),
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
        bears = {}, heightmap, lastText,
        camera, effect, drawDistance = 500,
        scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        pointer = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 2), new THREE.MeshBasicMaterial({
                color: 0xffff00
            })),
        repeater = new SpeechOutput.Character();

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

    tabs.style.width = pct(100);
    renderer.setClearColor(BG_COLOR);
    
    function readSettings(){
        for(var key in ctrls){
            if(key !== "deviceTypes"){
                var evt = new Event("change");
                ctrls[key].dispatchEvent(evt);
            }
        }
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

    function animate(t){
        requestAnimationFrame(animate);
        dt = (t - lt) * 0.001;
        lt = t;

        if(camera && heightmap){
            THREE.AnimationHandler.update(dt);
            head.update(dt);
            keyboard.update(dt);
            mouse.update(dt);
            gamepad.update(dt);
            touch.update(dt);
            speech.update(dt);
            
            
            //
            // update user position and view
            //
            
            velocity.y -= dt * GRAVITY;
            var x = Math.floor((location.x - heightmap.minX) / CLUSTER);
            var z = Math.floor((location.z - heightmap.minZ) / CLUSTER);
            var y = 0;
            if (0 <= z && z < heightmap.length
                && 0 <= x && x < heightmap[z].length){
                y += heightmap[z][x];
            }

            if(location.y <= y && velocity.y <= 0){
                velocity.y = 0;
                location.y = location.y * 0.75 + y * 0.25;
                if(!onground){
                    navigator.vibrate(100);
                }
                onground = true;
            }

            if(onground || location.y < -0.5){
                var tx, tz;
                if(autoWalking){
                    tx = 0;
                    tz = -0.5;
                }
                else{
                    tx = keyboard.getValue("strafeRight")
                        + keyboard.getValue("strafeLeft")
                        + gamepad.getValue("strafe");
                    tz = keyboard.getValue("driveBack")
                        + keyboard.getValue("driveForward")
                        + gamepad.getValue("drive")
                        + touch.getValue("drive");
                }
                if(tx || tz){
                    len = SPEED * Math.min(1, 1 / Math.sqrt(tz * tz + tx * tx));

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

                tx *= len;
                tz *= len;
                len = tx * Math.cos(heading) + tz * Math.sin(heading);
                tz = tz * Math.cos(heading) - tx * Math.sin(heading);
                tx = len;
                velocity.x = velocity.x * 0.9 + tx * 0.1;
                velocity.z = velocity.z * 0.9 + tz * 0.1;
            }

            pitch = pitch * TRACKING_SCALE + (
                head.getValue("pitch")
                + mouse.getValue("pitch")
                + gamepad.getValue("pitch")) * TRACKING_SCALE_COMP;

            heading = heading * TRACKING_SCALE + (
                head.getValue("heading")
                + touch.getValue("heading")
                + mouse.getValue("heading")
                + gamepad.getValue("heading")) * TRACKING_SCALE_COMP;

            roll = roll * TRACKING_SCALE + head.getValue("roll") * TRACKING_SCALE_COMP;
            
            //
            // place pointer
            //
            direction.set(0, 0, -4)
                .applyAxisAngle(RIGHT, -pitch)
                .applyAxisAngle(camera.up, heading);
            testPoint.copy(location);
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
            // do collision detection
            //
            var len = velocity.length() * dt;
            direction.copy(velocity);
            direction.normalize();
            raycaster.set(location, direction);
            raycaster.far = len * 2;
            intersections = raycaster.intersectObject(scene, true);
            for(var i = 0; i < intersections.length; ++i){
                var inter = intersections[i];
                if(inter.object.parent.isSolid
                    && inter.distance < len){
                    testPoint.copy(inter.face.normal);
                    testPoint.applyEuler(inter.object.parent.rotation);
                    velocity.reflect(testPoint);
                }
            }
            
            if(location.y < -0.5){
                velocity.multiplyScalar(0.925);
            }
            
            //
            // update audio
            //
            testPoint.copy(location);
            testPoint.divideScalar(10);
            audio3d.setPosition(testPoint.x, testPoint.y, testPoint.z);
            audio3d.setVelocity(velocity.x, velocity.y, velocity.z);
            testPoint.normalize();
            audio3d.setOrientation(testPoint.x, testPoint.y, testPoint.z, 0, 1, 0);
            
            //
            // update the camera
            //
            orientation.set(pitch, heading, roll, "YZX");
            camera.rotation.copy(orientation);
            
            testPoint.copy(velocity).multiplyScalar(dt);
            location.add(testPoint);
            camera.position.copy(location);
            camera.position.y += PLAYER_HEIGHT;
            
            //
            // place the skybox centered to the camera
            //
            skyboxRotation.set(t*0.00001, 0, 0, "XYZ");
            mainScene.Skybox.position.copy(location);
            mainScene.Skybox.setRotationFromEuler(skyboxRotation);

            //
            // send a network update of the user's position, if it's been enough 
            // time since the last update (don't want to flood the server).
            //
            frame += dt;
            if(userName && frame > dFrame){
                frame -= dFrame;
                var state = {
                    x: location.x,
                    y: location.y,
                    z: location.z,
                    dx: velocity.x,
                    dy: velocity.y,
                    dz: velocity.z,
                    heading: heading,
                    dheading: (heading - lastHeading) / dFrame,
                    isRunning: Math.abs(velocity.x + velocity.y + velocity.z) > 1
                };
                lastHeading = heading;
                socket.emit("userState", state);
            }

            //
            // update avatars
            //
            for(var key in bears){
                var bear = bears[key];
                if(key === userName){
                    bear.rotation.set(0, heading, 0, "XYZ");
                    bear.position.copy(location);
                }
                else if(bear.dx || bear.dx || bear.dz){
                    bear.position.x += bear.dx * dt;
                    bear.position.y += bear.dy * dt;
                    bear.position.z += bear.dz * dt;
                    bear.heading += bear.dheading * dt;
                    // we have to offset the rotation of the name so the user
                    // can read it.
                    bear.rotation.set(0, bear.heading, 0, "XYZ");
                    bear.nameObj.rotation.set(0, heading - bear.heading, 0, "XYZ");
                }
            }
            
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
    
    function showChatBox(){
        ctrls.textEntry.style.display = "";
        ctrls.textEntry.focus();
    }
    
    function readChatBox(){
        ctrls.textEntry.style.display = "none";
        showTyping(true, true, ctrls.textEntry.value);
        ctrls.textEntry.value = "";
    }
    
    function shutdown(){
        speech.enable(false);
        var state = readForm(ctrls);
        setSetting("formState", state);
    }

    function jump(){
        if (onground || location.y < -0.5){
            velocity.y = 10;
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
    }

    function updateUserState(userState){
        var bear = bears[userState.userName];
        if(bear){
            bear.dx = ((userState.x + userState.dx * dFrame) - bear.position.x) / dFrame;
            bear.dy = ((userState.y - PLAYER_HEIGHT + userState.dy * dFrame) - bear.position.y) / dFrame;
            bear.dz = ((userState.z + userState.dz * dFrame) - bear.position.z) / dFrame;
            bear.dheading = ((userState.heading + userState.dheading * dFrame) - bear.heading) / dFrame;
            //
            if(!bear.animation.isPlaying && userState.isRunning){
                bear.animation.play();
            }
            else if(bear.animation.isPlaying && !userState.isRunning){
                bear.animation.stop();
            }
        }
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

    function addUser(userState){
        var bear = new THREE.Object3D();
        var model = bearModel.clone(userState.userName, socket);
        model.position.z = 1.33;
        bear.animation = model.animation;
        bear.add(model);
        bear.heading = userState.heading;
        scene.add(bear);
        bear.nameObj = new VUI.Text(
            userState.userName, 0.5,
            "white", "transparent",
            0, PLAYER_HEIGHT + 2.5, 0, 
            "center");
        bear.add(bear.nameObj);

        if(userState.userName !== userName){
            msg("user joined: " + userState.userName);
        }
        updateUserState(userState);
        bears[userState.userName] = bear;
    }
    
    function userLeft(userName){
        if(bears[userName]){
            msg("user disconnected:", userName);
            scene.remove(bears[userName]);
            delete bears[userName];
        }
    }
    
    function copyBearToUser(bear){
        if(bear.x !== undefined
            && bear.y !== undefined
            && bear.z !== undefined){
            location.set(bear.x, bear.y, bear.z);
        }
        if(bear.dx !== undefined
            && bear.dy !== undefined
            && bear.dz !== undefined){
            velocity.set(bear.dx, bear.dy, bear.dz);
        }
        if(bear.heading !== undefined){
            heading = bear.heading;
        }
    }
    
    function listUsers(users){
        var userFound = false;
        for(var i = 0; i < users.length; ++i){
            userFound = userFound || users[i].userName === userName;
            addUser(users[i]);
        }
        if(userFound){
            copyBearToUser(bears[userName]);            
        }
        else{
            addUser({
                userName: userName,
                x: location.x,
                y: location.y,
                z: location.z,
                dx: velocity.x,
                dy: velocity.y,
                dz: velocity.z,
                heading: heading,
                dheading: dheading,
                isRunning: !!Math.abs(velocity.x + velocity.y + velocity.z)
            });
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
    ctrls.talkButton.addEventListener("click", showChatBox, false);
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
        { name: "jump", buttons: [KeyboardInput.SPACEBAR], commandDown: jump, dt: 1 },
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
        { name: "heading", axes: [-GamepadInput.RSX]},
        { name: "pitch", axes: [GamepadInput.IRSY]},
        { name: "jump", buttons: [1], commandDown: jump, dt: 0.250 },
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
        heightmap = ModelLoader.makeHeightMap(mainScene.Terrain, CLUSTER);
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
    requestAnimationFrame(animate);
}
