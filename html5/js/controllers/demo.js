var ctrls = findEverything();
var PLAYER_HEIGHT = 6;
var prog = new LoadingProgress(
    "manifest/js/controllers/demo.js",
    "js/psychologist.js",
    "lib/three/three.min.js",
    "lib/three/StereoEffect.js",
    "lib/three/OculusRiftEffect.min.js",
    "lib/three/AnaglyphEffect.min.js",
    "lib/three/ColladaLoader.js",
    "/socket.io/socket.io.js",
    "js/input/NetworkedInput.js",
    "js/input/SpeechInput.js",
    "js/input/GamepadInput.js",
    "js/input/KeyboardInput.js",
    "js/input/MotionInput.js",
    "js/input/MouseInput.js",
    "js/input/TouchInput.js",
    "js/output/Audio3DOutput.js",
    "js/output/SpeechOutput.js",
    "js/output/ModelOutput.js",
    displayProgress,
    postScriptLoad);

function displayProgress(){
    ctrls.triedSoFar.style.width = prog.makeSize(FileState.NONE, "size");
    ctrls.processedSoFar.style.width = prog.makeSize(FileState.STARTED | FileState.ERRORED | FileState.COMPLETE , "progress");
    ctrls.loadedSoFar.style.width = prog.makeSize(FileState.COMPLETE, "size");
    ctrls.errorSoFar.style.width = prog.makeSize(FileState.ERRORED, "size");
}

function postScriptLoad(progress){
    ctrls.loading.style.display = "none";
    var BG_COLOR = 0xafbfff, CLUSTER = 2,
        DRAW_DISTANCE = 100,
        TRACKING_SCALE = 0.5,
        TRACKING_SCALE_COMP = 1 - TRACKING_SCALE,
        GRAVITY = 9.8, SPEED = 15, FOV = 60,
        pitch = 0, roll = 0, heading = 0,
        dpitch = 0, droll = 0, dheading = 0, lt = 0,
        vcx = 0, vcz = 0, vcy = 0, tx, tz,
        onground = false,
        camera, scene, effect, renderer, map,
        motion, keyboard, mouse, gamepad, 
        fps, dt, heightmap,
        buttonsTimeout = null,
        buttonsVisible = true,
        userName = null, password = null,
        isDebug = false,
        isLocal = document.location.hostname == "localhost",
        isHost = false,
        isClient = false,
        isWAN = /\d+\.\d+\.\d+\.\d+/.test(document.location.hostname),
        socket,
        oceanSound = null,
        audio3d = new Audio3DOutput(),
        bears = {};
    
    function msg(){
        if(!isDebug){
            alert.apply(window, arguments);
        }
    }

    function ask(txt, force){
        return !isDebug && confirm(txt) || (isDebug && force);
    }

    function animate(t) {
        requestAnimationFrame(animate);
        dt = (t - lt) / 1000;
		THREE.AnimationHandler.update(dt);
        lt = t;
        motion.update();
        keyboard.update();
        mouse.update();
        gamepad.update();
        touch.update();
        if(camera && heightmap){
            vcy -= dt * GRAVITY;
            var x = Math.floor((camera.position.x - heightmap.minX) / CLUSTER);
            var z = Math.floor((camera.position.z - heightmap.minZ) / CLUSTER);
            var y = PLAYER_HEIGHT;
            if (heightmap 
                && 0 <= z && z < heightmap.length
                && 0 <= x && x < heightmap[z].length){
                y += heightmap[z][x];
            }

            if(camera.position.y <= y && vcy <= 0) {
                vcy = 0;
                camera.position.y = camera.position.y * 0.75 + y * 0.25;
                if(!onground){
                    navigator.vibrate(100);
                }
                onground = true;
            }

            if(onground){
                tx = keyboard.getValue("strafeRight")
                    + keyboard.getValue("strafeLeft")
                    + gamepad.getValue("strafe");
                tz = keyboard.getValue("driveBack")
                    + keyboard.getValue("driveForward")
                    + gamepad.getValue("drive")
                    + touch.getValue("drive");
                if(tx != 0 || tz != 0){
                    len = SPEED * Math.min(1, 1 / Math.sqrt(tz * tz + tx * tx));
                    
                    if(avatar && !avatar.animation.isPlaying){
                        avatar.animation.play();
                    }
                }
                else{
                    len = 0;
                    if(avatar && avatar.animation.isPlaying){
                        avatar.animation.stop();
                    }
                }
                
                tx *= len;
                tz *= len;
                len = tx * Math.cos(heading) + tz * Math.sin(heading);
                tz = tz * Math.cos(heading) - tx * Math.sin(heading);
                tx = len;
                vcx = vcx * 0.9 + tx * 0.1;
                vcz = vcz * 0.9 + tz * 0.1;
            }

            dheading += (gamepad.getValue("dheading") 
                + mouse.getValue("dheading")
                + touch.getValue("dheading")) * dt;
            dpitch += mouse.getValue("dpitch") * dt;
            droll += (gamepad.getValue("drollLeft") 
                + gamepad.getValue("drollRight") 
                + keyboard.getValue("drollLeft") 
                + keyboard.getValue("drollRight")) * dt;

            heading = heading * TRACKING_SCALE + (motion.getValue("heading") + dheading) * TRACKING_SCALE_COMP;
            pitch = pitch * TRACKING_SCALE + (motion.getValue("pitch") + dpitch) * TRACKING_SCALE_COMP;
            roll = roll * TRACKING_SCALE + (motion.getValue("roll") + droll) * TRACKING_SCALE_COMP;

            fps = 1 / dt;
            setCamera(dt);
            draw();
        }
    }
    var frame = 0, dFrame = 2000;
    function setCamera(dt) {
        camera.updateProjectionMatrix();
        camera.setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
        camera.translateX(vcx * dt);
        camera.translateY(vcy * dt);
        camera.translateZ(vcz * dt);
        camera.setRotationFromEuler(new THREE.Euler(pitch, heading, roll, "YZX"));
        frame += dFrame;
        if(frame > dFrame){
            frame -= dFrame;
            socket.emit("userState", {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z,
                heading: heading,
                isRunning: vcx != 0 || vcy != 0 || vcz != 0
            });
        }
        if(avatar){
            avatar.setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
            avatar.rotateY(heading);
            avatar.position.x = camera.position.x;
            avatar.position.y = camera.position.y - PLAYER_HEIGHT;
            avatar.position.z = camera.position.z;
        }
        var x = camera.position.x / 10,
            y = camera.position.y / 10,
            z = camera.position.z / 10;
            
        var len = Math.sqrt(x * x + y * y + z * z);
        audio3d.setPosition(x, y, z);
        audio3d.setVelocity(vcx, vcy, vcz);
        audio3d.setOrientation(x / len, y / len, z / len, 0, 1, 0);
    }

    function draw() {
        if (effect) {
            effect.render(scene, camera);
        }
        else {
            renderer.render(scene, camera);
        }
    }

    function setSize(w, h) {
        if(camera){
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
        if (effect) {
            effect.setSize(window.innerWidth, window.innerHeight);
        }
        else if (effect) {
            effect.setSize(window.innerWidth, window.innerHeight);
        }
        else {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(BG_COLOR, 1, DRAW_DISTANCE);

    var closers = document.getElementsByClassName("closeSectionButton");
    for(var i = 0; i < closers.length; ++i){
        closers[i].addEventListener("click", function(){
            this.parentElement.style.display = "none";
            ctrls.menuButton.style.display = "";
        }, false);
    }

    ctrls.options.querySelector(".closeSectionButton").addEventListener("click", function(){
        if(this.parentElement.id == "options"){
            toggleFullScreen();
            mouse.requestPointerLock();
        }
    });

    ctrls.menuButton.addEventListener("click", function(){
        ctrls.options.style.display = "";
        ctrls.menuButton.style.display = "none";
    }, false);

    ctrls.connectButton.addEventListener("click", function(){
        if(socket){
            userName = ctrls.userNameField.value;
            password = ctrls.passwordField.value;
            if(userName && password){
                socket.emit("user", {userName: userName, password: password});
            }
        }
        else{
            msg("No socket available");
        }
    }, false);

    ctrls.startSpeechButton.addEventListener("click", function(){
        speech.start();
    }, false);

    ctrls.pointerLockButton.addEventListener("click", function(){
        mouse.togglePointerLock();
        ctrls.options.style.display = "none";
        ctrls.menuButton.style.display = "";
    }, false);

    ctrls.fullScreenButton.addEventListener("click", function(){
        toggleFullScreen();
    }, false);

    ctrls.anaglyphRenderButton.addEventListener("click", function(){
        effect = new THREE.AnaglyphEffect(renderer, 5, window.innerWidth, window.innerHeight);
    }, false);

    ctrls.stereoRenderButton.addEventListener("click", function(){
        effect = new THREE.StereoEffect(renderer);
    }, false);

    ctrls.riftRenderButton.addEventListener("click", function(){
        effect = new THREE.OculusRiftEffect(renderer, {
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
        });
    }, false);

    function jump() {
        if (onground) {
            vcy = 10;
            onground = false;
        }
    }

    function fire() {
    }

    function reload() {
        if (isFullScreenMode()) {
            document.location = document.location.href;
        }
        else {
            mouse.requestPointerLock();
            toggleFullScreen();
        }
    }

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(BG_COLOR);

    socket = io.connect(document.location.hostname, {
        "reconnect": true,
        "reconnection delay": 1000,
        "max reconnection attempts": 60
    });

    socket.on("bad", function(){
        msg("Incorrect user name or password!");
    });

    socket.on("good", function(users){
        msg("You are now connected to the device server.");
        for(var i = 0; i < users.length; ++i){
            if(users[i] != userName){
                bears[users[i]] = bearModel.clone(users[i], socket);
                scene.add(bears[users[i]]);
            }
        }
    });

    socket.on("user", function(user){
        bears[user] = bearModel.clone(user, socket);
        scene.add(bears[user]);
    });

    socket.on("userState", function(userState){
        var bear = bears[userState.userName];
        if(bear){
            bear.setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
            bear.rotateY(userState.heading);
            bear.position.x = userState.x;
            bear.position.y = userState.y - PLAYER_HEIGHT;
            bear.position.z = userState.z;
            if(!bear.animation.isPlaying && userState.isRunning){
                bear.animation.play();
            }
            else if(bear.animation.isPlaying && !userState.isRunning){
                bear.animation.stop();
            }
        }
    });

    motion = new MotionInput([
        { name: "heading", axes: [-1] },
        { name: "pitch", axes: [2] },
        { name: "roll", axes: [-3] }
    ], socket);

    mouse = new MouseInput([
        { name: "dheading", axes: [-4], scale: 0.4 },
        { name: "dpitch", axes: [-5], scale: 0.4 },
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
    ], socket, renderer.domElement);

    touch = new TouchInput(1, null, [
        { name: "dheading", axes: [-3] },
        { name: "drive", axes: [4], scale: 1.5 },
    ], socket, renderer.domElement);

    keyboard = new KeyboardInput([
        { name: "strafeLeft", buttons: [-65] },
        { name: "strafeRight", buttons: [68] },
        { name: "driveForward", buttons: [-87] },
        { name: "driveBack", buttons: [83] },
        { name: "drollLeft", buttons: [81] },
        { name: "drollRight", buttons: [-69] },
        { name: "jump", buttons: [32], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [17], commandDown: fire, dt: 125 },
        { name: "reload", buttons: [70], commandDown: reload, dt: 125 },
    ], socket);

    gamepad = new GamepadInput([
        { name: "strafe", axes: [1], deadzone: 0.1 },
        { name: "drive", axes: [2], deadzone: 0.1 },
        { name: "dheading", axes: [-3], deadzone: 0.1 },
        { name: "dpitch", axes: [4], deadzone: 0.1 },
        { name: "drollRight", buttons: [5] },
        { name: "drollLeft", buttons: [-6] },
        { name: "jump", buttons: [1], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [2], commandDown: fire, dt: 125 },
    ], socket);

    speech = new SpeechInput([
        { keywords: ["jump"], command: jump }
    ], socket);

    gamepad.addEventListener("gamepadconnected", function (id) {
        if (!gamepad.isGamepadSet() && ask(fmt("Would you like to use this gamepad? \"$1\"", id), true)) {
            gamepad.setGamepad(id);
        }
    }, false);

    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var mainScene = new ModelOutput("models/scene.dae", progress, function(object){
        scene.add(object);
        camera = mainScene.Camera.children[0];
        mainScene.Ocean.children[0].material.transparent = true;
        heightmap = ModelOutput.makeHeightMap(mainScene.Terrain, CLUSTER);
    });

    var bearModel = new ModelOutput("models/bear.dae", progress, function(object){
        var obj = bearModel.clone();
        avatar = obj;
        scene.add(obj);
    });

    audio3d.loadSound3D("music/ocean.mp3", true, 0, 0, 0, progress, function(snd){
        oceanSound = snd;
        snd.source.start(0);
    });
        
    audio3d.loadSoundFixed("music/game1.ogg.break", true, progress, function(snd){
        snd.volume.gain.value = 0.5;
        snd.source.start(0);
    });

    document.body.insertBefore(renderer.domElement, document.body.firstChild);
    setSize(window.innerWidth, window.innerHeight);

    requestAnimationFrame(animate);
}