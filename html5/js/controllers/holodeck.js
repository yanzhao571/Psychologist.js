var ctrls = findEverything(),
    app = new Application("holodeck"),
    BG_COLOR = 0x000000,
    CHAT_TEXT_SIZE = 0.25, 
    PLAYER_HEIGHT = 6.5,
    RIGHT = new THREE.Vector3(-1, 0, 0),
    GRAVITY = 9.8, 
    SPEED = 15,
    socket = io.connect(document.location.hostname, {
        "reconnect": true,
        "reconnection delay": 1000,
        "max reconnection attempts": 60
    }),
    testPoint = new THREE.Vector3(),
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 7),
    direction = new THREE.Vector3(),
    orientation = new THREE.Euler(0, 0, 0, "YZX"),      
    focused = true,
    wasFocused = false,
    autoWalking = false,
    onground = false,
    startHeading = 0,
    dt = 0, 
    lt = 0, 
    frame = 0, 
    dFrame = 0.125,
    heading = 0,
    pointerHeading = 0,
    pitch = 0,
    roll = 0, 
    strafe = 0, 
    drive = 0,
    DEFAULT_USER_NAME = "CURRENT_USER_OFFLINE",
    userName = DEFAULT_USER_NAME,
    drawDistance = 500, 
    chatLines = [],
    users = {}, 
    audio = new Audio3DOutput(),
    scene = new THREE.Scene(),
    renderer = new THREE.WebGLRenderer({ antialias: true }),
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
    mainScene = null,
    factories = null;

function loginFailed(){
    ctrls.connectButton.innerHTML = "Login failed. Try again.";
    ctrls.connectButton.className = "primary button";
    msg("Incorrect user name or password!");
}

function msg(){
    var txt = fmt.apply(window, map(arguments, function(v){ return v ? v.toString() : ""; }));
    if(currentUser){
        showChat(txt);
    }
    else {
        alert(txt);
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

        roll = head.getValue("roll");
        pitch = head.getValue("pitch")
            + gamepad.getValue("pitch")
            + mouse.getValue("pitch");
        heading = head.getValue("heading") 
            + gamepad.getValue("heading")
            + touch.getValue("heading")
            + mouse.getValue("heading")
            + startHeading;

        pointerHeading = heading + mouse.getValue("pointerHeading");

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
                len = strafe * Math.cos(pointerHeading) + drive * Math.sin(pointerHeading);
                drive = drive * Math.cos(pointerHeading) - strafe * Math.sin(pointerHeading);
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
            var GROUND_TEST_HEIGHT = 3;
            testPoint.y += GROUND_TEST_HEIGHT;
            direction.set(0, -1, 0);
            raycaster.set(testPoint, direction);
            raycaster.far = GROUND_TEST_HEIGHT * 2;
            intersections = raycaster.intersectObject(scene, true);
            for(var i = 0; i < intersections.length; ++i){
                var inter = intersections[i];
                if(inter.object.parent.isSolid){
                    testPoint.copy(inter.face.normal);
                    testPoint.applyEuler(inter.object.parent.rotation);
                    currentUser.position.y = inter.point.y;
                    currentUser.velocity.y = 0;
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
        var pointerDistance = leap.getValue("HAND0Z") 
            + mouse.getValue("pointerDistance")
            + 2;
        var dp = pitch 
                + mouse.getValue("pointerPitch") 
                + mouse.getValue("pointerPress");
        pointerDistance /= Math.cos(dp);
        direction.set(0, 0, -pointerDistance)
            .applyAxisAngle(RIGHT, -dp)
            .applyAxisAngle(camera.up, pointerHeading);
    

        hand.position.copy(camera.position)
            .add(direction);
    
        for(var j = 0; j < mainScene.buttons.length; ++j){
            var tag = mainScene.buttons[j].test(camera.position, hand.position);
            if(tag){
                hand.position.copy(tag);
            }
        }

        //
        // update audio
        //
        testPoint.copy(currentUser.position);
        testPoint.divideScalar(10);
        audio.setPosition(testPoint.x, testPoint.y, testPoint.z);
        audio.setVelocity(currentUser.velocity.x, currentUser.velocity.y, currentUser.velocity.z);
        testPoint.normalize();
        audio.setOrientation(testPoint.x, testPoint.y, testPoint.z, 0, 1, 0);

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

function login(){
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
    app.showOnscreenControls();
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
                    audio.playBufferImmediate(clickSound, 0.5);
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
        reloadPage();
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

function addUser(userState, skipMakingChatList){
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
    updateUserState(true, userState);

    if(!skipMakingChatList){
        makeChatList();
    }
}

function userLeft(userName){
    if(users[userName]){
        msg("$1 has disconnected", userName);
        scene.remove(users[userName]);
        help(ctrls.userList);
        delete users[userName];
        makeChatList();
    }
}

function listUsers(users){
    ctrls.connectButton.className = "secondary button";
    ctrls.connectButton.innerHTML = "Connected";
    proxy.connect(userName);
    users.sort(function(a){ return (a.userName === userName) ? -1 : 1;});
    for(var i = 0; i < users.length; ++i){
        addUser(users[i], true);
    }
    makeChatList();
}

function makeChatList(){
    var list = [];
    for(var k in users){
        list.push(k);
    }
    list.sort();
    ctrls.userList.innerHTML = "";
    for(var i = 0; i < list.length; ++i){
        if(list[i] !== DEFAULT_USER_NAME){
            var entry = document.createElement("div");
            entry.appendChild(document.createTextNode(list[i]));
            ctrls.userList.appendChild(entry);
        }
    }
}

var closers = document.getElementsByClassName("closeSectionButton");
for(var i = 0; i < closers.length; ++i){
    closers[i].addEventListener("click", hideOptions, false);
}

//addFullScreenShim([window, document]);

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
ctrls.connectButton.addEventListener("click", login, false);

window.addEventListener("beforeunload", shutdown, false);

proxy = new WebRTCSocket(socket, ctrls.defaultDisplay.checked);

head = new MotionInput("head", [
    { name: "heading", axes: [-MotionInput.HEADING] },
    { name: "pitch", axes: [MotionInput.PITCH] },
    { name: "roll", axes: [-MotionInput.ROLL] }
], proxy);

mouse = new MouseInput("mouse", [
    { name: "dx", axes: [-MouseInput.X], delta: true, scale: 0.5 },
    { name: "heading", commands: ["dx"], metaKeys: [-NetworkedInput.SHIFT], integrate: true },
    { name: "pointerHeading", commands: ["dx"], metaKeys: [NetworkedInput.SHIFT], integrate: true, min: -Math.PI * 0.2, max: Math.PI * 0.2 },
    { name: "dy", axes: [-MouseInput.Y], delta: true, scale: 0.5 },
    { name: "pitch", commands: ["dy"], metaKeys: [-NetworkedInput.SHIFT], integrate: true, min: -Math.PI * 0.5, max: Math.PI * 0.5 },
    { name: "pointerPitch", commands: ["dy"], metaKeys: [NetworkedInput.SHIFT], integrate: true, min: -Math.PI * 0.125, max: Math.PI * 0.125 },
    { name: "dz", axes: [MouseInput.Z], delta: true },
    { name: "pointerDistance", commands: ["dz"], integrate: true, scale: 0.1, min: 0, max: 10 },
    { name: "pointerPress", buttons: [1], integrate: true, scale: -10, offset: 5, min: -0.4, max: 0 }
], proxy, null, renderer.domElement);

var leapCommands = [];

hand = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 + i * 0.005, 4, 4), 
    new THREE.MeshPhongMaterial({color: 0xffff00, emissive: 0x7f7f00})
);
hand.add(new THREE.PointLight(0xffff00, 1, 7));
hand.name = "HAND0";
scene.add(hand);
leapCommands.push({ name: "HAND0X", axes: [LeapMotionInput["HAND0X"]], scale: 0.015 });
leapCommands.push({ name: "HAND0Y", axes: [LeapMotionInput["HAND0Y"]], scale: 0.015, offset: -4 });
leapCommands.push({ name: "HAND0Z", axes: [LeapMotionInput["HAND0Z"]], scale: -0.015, offset: 3 });

leap = new LeapMotionInput("leap", null, leapCommands, proxy);

touch = new TouchInput("touch", null, [
    { name: "heading", axes: [TouchInput.DX0], integrate: true },
    { name: "drive", axes: [-TouchInput.DY0] }
], proxy, null, renderer.domElement);

keyboard = new KeyboardInput("keyboard", [
    { name: "strafeLeft", buttons: [-KeyboardInput.A, -KeyboardInput.LEFTARROW] },
    { name: "strafeRight", buttons: [KeyboardInput.D, KeyboardInput.RIGHTARROW] },
    { name: "driveForward", buttons: [-KeyboardInput.W, -KeyboardInput.UPARROW] },
    { name: "driveBack", buttons: [KeyboardInput.S, KeyboardInput.DOWNARROW] },
    { name: "resetPosition", buttons: [KeyboardInput.P], commandUp: resetLocation },
    { name: "reload", buttons: [KeyboardInput.R], commandDown: reload, dt: 1 },
    { name: "chat", preamble: true, buttons: [KeyboardInput.T], commandUp: showTyping.bind(window, true)}
], proxy);
keyboard.pause(true);

gamepad = new GamepadInput("gamepad", [
    { name: "strafe", axes: [GamepadInput.LSX]},
    { name: "drive", axes: [GamepadInput.LSY]},
    { name: "heading", axes: [-GamepadInput.RSX], integrate: true},
    { name: "pitch", axes: [GamepadInput.RSY], integrate: true},
    { name: "options", buttons: [9], commandUp: toggleOptions }
], proxy);

speech = new SpeechInput("speech", [
    { name: "options", keywords: ["options"], commandUp: toggleOptions },
    { name: "chat", preamble: true, keywords: ["message"], commandUp: speechChat }
], proxy);

app.setupModuleEvents(head, "head");
app.setupModuleEvents(mouse, "mouse");
app.setupModuleEvents(leap, "leap");
app.setupModuleEvents(touch, "touch");
app.setupModuleEvents(keyboard, "keyboard");
app.setupModuleEvents(gamepad, "gamepad");
app.setupModuleEvents(speech, "speech");

gamepad.addEventListener("gamepadconnected", function (id){
    if (!gamepad.isGamepadSet() && confirm(fmt("Would you like to use this gamepad? \"$1\"", id))){
        gamepad.setGamepad(id);
    }
}, false);

window.addEventListener("resize", function (){
    setSize(window.innerWidth, window.innerHeight);
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

renderer.setClearColor(BG_COLOR);

ModelLoader.loadCollada("models/scene2.dae", function(object){
    mainScene = object;
    scene.add(object);
    var cam = mainScene.Camera.children[0];
    camera = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, drawDistance);
    var buttonFactory1 = new VUI.ButtonFactory(
            mainScene, 
            "models/button2.dae", {
                maxThrow: 0.1,
                minDeflection: 10,
                colorUnpressed: 0x7f0000,
                colorPressed: 0x007f00,
                toggle: true
            },
            function(){
        var COUNT = 5;
        var buttonFactory2 = buttonFactory1.clone({
            toggle: false
        });
        factories = [buttonFactory1, buttonFactory2];
        for(var i = -COUNT; i <= COUNT; ++i){
            var btn = factories[(i+COUNT)%2].create();
            var angle = Math.PI * i * 10 / 180;
            var r = 10;
            btn.position.set(Math.cos(angle) * r, Math.cos(i * Math.PI) * 0.25, Math.sin(-angle) * r);
            btn.rotation.set(0, angle - Math.PI, 0, "XYZ");
            btn.addEventListener("click", function(n){
                audio.sawtooth(40 - n * 5, 0.1, 0.25);
            }.bind(this, i));
            scene.add(btn.base);
        }
        var obj = obj3(box(5, 0.125, 0.125, 0xff0000),
            box(0.125, 0.125, 5, 0x00ff00),
            box(0.125, 5, 0.125, 0x0000ff)
        );

        obj.position.set(0, 1, 0);

        scene.add(obj);
    });
});

function obj3(){
    var obj = new THREE.Object3D();
    for(var i = 0; i < arguments.length; ++i){
        obj.add(arguments[i]);
    }
    return obj;
}

function box(x, y, z, c){
    var geom = new THREE.BoxGeometry(x, y, z);
    var mat = new THREE.MeshBasicMaterial({ color: c });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x / 2, y / 2, z / 2);
    return mesh;
}

var bearModel = new ModelLoader("models/bear.dae", function(){
    addUser({x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, heading: 0, dHeading: 0, userName: userName});
});

audio.loadBuffer("music/click.mp3", null, function(buffer){
    clickSound = buffer;
});

audio.load3DSound("music/ambient.mp3", true, 0, 0, 0, null, function(amb){
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

socket.on("typing", showTyping.bind(window, false, false));
socket.on("chat", showChat);    
socket.on("userJoin", addUser);
socket.on("userState", updateUserState.bind(window, false));
socket.on("userLeft", userLeft);
socket.on("loginFailed", loginFailed);
socket.on("userList", listUsers);
socket.on("disconnect", msg.bind(window));
socket.on("handshakeFailed", console.error.bind(console, "Failed to connect to websocket server. Available socket controllers are:"));
socket.on("handshakeComplete", function(controller){
    if(controller === "demo"
        && ctrls.autoLogin.checked
        && ctrls.userNameField.value.length > 0
        && ctrls.passwordField.value.length > 0){
        ctrls.connectButton.click();
    }
});

if(ctrls.appCacheReload.style.display === "none"){
    ctrls.loginForm.style.display = "";
    socket.emit("handshake", "demo");
}