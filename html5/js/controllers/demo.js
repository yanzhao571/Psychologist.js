var isDebug = false,
	ctrls = findEverything(),
	PLAYER_HEIGHT = 6,
    formState = getSetting("formState"),
	prog = new LoadingProgress(
		"manifest/js/controllers/demo.js?v2",
		"js/psychologist.js",
		"lib/three/three.min.js",
		"lib/three/StereoEffect.js",
		"lib/three/OculusRiftEffect.min.js",
		"lib/three/AnaglyphEffect.min.js",
		"lib/three/ColladaLoader.js",
		"lib/droid_sans_regular.typeface.js",
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
		
ctrls.instructions.style.display 
    = ctrls.options.style.display
    = (isDebug || formState) ? "none" : "";

function displayProgress(){
    ctrls.triedSoFar.style.width = prog.makeSize(FileState.NONE, "size");
    ctrls.processedSoFar.style.width = prog.makeSize(FileState.STARTED | FileState.ERRORED | FileState.COMPLETE , "progress");
    ctrls.loadedSoFar.style.width = prog.makeSize(FileState.COMPLETE, "size");
    ctrls.loadedSoFar.style.left = ctrls.errorSoFar.style.width = prog.makeSize(FileState.ERRORED, "size");
    if(prog.isDone()){
        ctrls.loading.style.display = "none";
    }
}

function postScriptLoad(progress){
    var BG_COLOR = 0xafbfff, CLUSTER = 2,
        TRACKING_SCALE = 0.5,
        TRACKING_SCALE_COMP = 1 - TRACKING_SCALE,
        GRAVITY = 9.8, SPEED = 15,
        pitch = 0, roll = 0, heading = 0,
        dpitch = 0, droll = 0, dheading = 0,
        vcx = 0, vcz = 0, vcy = 0, tx, tz,
        onground = false,
        motion, keyboard, mouse, gamepad, 
        dt, lt = 0, frame = 0, dFrame = 0.125,
        userName = null, password = null,
        audio3d = new Audio3DOutput(),
        oceanSound = null,
        socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        }), 
        bears = {}, heightmap,
        nameMaterial = new THREE.MeshLambertMaterial({
            color: 0x7f7f00,
            shading: THREE.FlatShading
        }),
        camera, effect, drawDistance = 250,
        scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        tabs = makeTabSet(ctrls.options);

    socket.on("handshakeFailed", console.warn.bind(console));
    socket.emit("handshake", "demo");
    tabs.style.width = pct(100);
    renderer.setClearColor(BG_COLOR);
    writeForm(ctrls, formState);
    
    function msg(){
        if(isDebug){
            console.log.apply(console, arguments);
        }
        else{
            alert(map(arguments, function(v){
                return v ? v.toString() : ""
            }).join(" "));
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

    function update(dt){
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
            vcx = vcx * 0.9 + tx * 0.1;
            vcz = vcz * 0.9 + tz * 0.1;
        }

        dheading += (gamepad.getValue("dheading") 
            + mouse.getValue("dheading")
            + touch.getValue("dheading")) * dt;
        dpitch += mouse.getValue("dpitch") * dt;
        dpitch = Math.max(-2, Math.min(1.3, dpitch));
        droll += (gamepad.getValue("drollLeft") 
            + gamepad.getValue("drollRight") 
            + keyboard.getValue("drollLeft") 
            + keyboard.getValue("drollRight")) * dt;

        heading = heading * TRACKING_SCALE + (motion.getValue("heading") + dheading) * TRACKING_SCALE_COMP;
        pitch = pitch * TRACKING_SCALE + (motion.getValue("pitch") + dpitch) * TRACKING_SCALE_COMP;
        roll = roll * TRACKING_SCALE + (motion.getValue("roll") + droll) * TRACKING_SCALE_COMP;
    }

    function animate(t) {
        requestAnimationFrame(animate);
        dt = (t - lt) * 0.001;
        lt = t;
        
        if(camera && heightmap){
		    THREE.AnimationHandler.update(dt);
            motion.update(t);
            keyboard.update(t);
            mouse.update(t);
            gamepad.update(t);
            touch.update(t);
            update(dt);
            setCamera(dt);
            draw();
        }
    }
    
    function setCamera(dt) {
        camera.updateProjectionMatrix();
        camera.setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
        camera.translateX(vcx * dt);
        camera.translateY(vcy * dt);
        camera.translateZ(vcz * dt);
        camera.setRotationFromEuler(new THREE.Euler(pitch, heading, roll, "YZX"));
        mainScene.Skybox.position.x = camera.position.x;
        mainScene.Skybox.position.y = camera.position.y;
        mainScene.Skybox.position.z = camera.position.z;
        frame += dt;
        if(userName && frame > dFrame){
            frame -= dFrame;
            var state = {
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z,
                heading: heading,
                isRunning: Math.abs(vcx + vcy + vcz) > 1
            };
            socket.emit("userState", state);
        }
        if(bears[userName]){
            bears[userName].setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
            bears[userName].rotateY(heading);
            bears[userName].position.x = camera.position.x;
            bears[userName].position.y = camera.position.y - PLAYER_HEIGHT;
            bears[userName].position.z = camera.position.z;
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

        chooseRenderingEffect(getSetting("renderingEffect"));
        
        renderer.setSize(w, h);
        if (effect) {
            effect.setSize(w, h);
        }
    }
    
    function login(){
        if(socket){
            userName = ctrls.userNameField.value;
            password = ctrls.passwordField.value;
            if(userName && password){
                socket.emit("login", {userName: userName, password: password});
            }
        }
        else{
            msg("No socket available");
        }
    }

    var closers = document.getElementsByClassName("closeSectionButton");
    for(var i = 0; i < closers.length; ++i){
        closers[i].addEventListener("click", function(){
            this.parentElement.style.display = "none";
            ctrls.menuButton.style.display = "";
        }, false);
    }

    if(!isDebug){
        ctrls.options.querySelector(".closeSectionButton").addEventListener("click", function(){
            requestFullScreen();
            mouse.requestPointerLock();
        });
    }
    else{
        login();
    }

    ctrls.menuButton.addEventListener("click", function(){
        ctrls.options.style.display = "";
        ctrls.menuButton.style.display = "none";
    }, false);

    ctrls.connectButton.addEventListener("click", login, false);

    ctrls.pointerLockButton.addEventListener("click", function(){
        mouse.togglePointerLock();
        ctrls.options.style.display = "none";
        ctrls.menuButton.style.display = "";
    }, false);

    ctrls.fullScreenButton.addEventListener("click", function(){
        toggleFullScreen();
    }, false);

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
            default: effect = null;
        }

        setSetting("renderingEffect", type);
    }
    
    ctrls.riftRenderButton.addEventListener("click", chooseRenderingEffect.bind(window, "rift"), false);
    ctrls.anaglyphRenderButton.addEventListener("click", chooseRenderingEffect.bind(window, "anaglyph"), false);
    ctrls.stereoRenderButton.addEventListener("click", chooseRenderingEffect.bind(window, "stereo"), false);
    ctrls.regularRenderButton.addEventListener("click", chooseRenderingEffect.bind(window, "regular"), false);

    window.addEventListener("beforeunload", function(){
        var state = readForm(ctrls);
        setSetting("formState", state);
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

    function addUser(user){
        bears[user] = bearModel.clone(user, socket);
        scene.add(bears[user]);
        var nameGeometry = new THREE.TextGeometry(user, {
            size: 1,
            height: 0.25,
            curveSegments: 4,
            font: "droid sans",
            weight: "normal",
            style: "normal",
            bevelEnabled: true,
            bevelThickness: 0.0625,
            bevelSize: 0.0625
        });
        
		nameGeometry.computeBoundingBox();
		nameGeometry.computeVertexNormals();

        var centerOffset = (nameGeometry.boundingBox.min.x - nameGeometry.boundingBox.max.x) * 0.5;
		var nameMesh = new THREE.Mesh(nameGeometry, nameMaterial);
        var name = new THREE.Object3D();
        name.add(nameMesh);
		bears[user].add(name);
		name.position.x = centerOffset;
		name.position.y = PLAYER_HEIGHT + 2;
		name.position.z = 0;
        name.rotateY(Math.PI);
    }

    function addUser(user){
        bears[user] = bearModel.clone(user, socket);
        scene.add(bears[user]);
        var nameGeometry = new THREE.TextGeometry(user, {
            size: 1,
            height: 0.25,
            curveSegments: 4,
            font: "droid sans",
            weight: "normal",
            style: "normal",
            bevelEnabled: true,
            bevelThickness: 0.0625,
            bevelSize: 0.0625
        });
        
		nameGeometry.computeBoundingBox();
		nameGeometry.computeVertexNormals();

        var centerOffset = (nameGeometry.boundingBox.min.x - nameGeometry.boundingBox.max.x) * 0.5;
		var nameMesh = new THREE.Mesh(nameGeometry, nameMaterial);
        var name = new THREE.Object3D();
        name.add(nameMesh);
		bears[user].add(name);
		name.position.x = centerOffset;
		name.position.y = PLAYER_HEIGHT + 2;
		name.position.z = 0;
        name.rotateY(Math.PI);
    }

    socket.on("loginFailed", function(){
        msg("Incorrect user name or password!");
    });

    socket.on("userList", function(users){
        msg("You are now connected to the device server.");
        addUser(userName);
        for(var i = 0; i < users.length; ++i){
            if(users[i] != userName){
                addUser(users[i]);
            }
        }
    });

    socket.on("userJoin", addUser);

    socket.on("disconnect", msg.bind(window));
    
    socket.on("userLeft", function(user){
        if(bears[user]){
            msg("user disconnected:", user);
            scene.remove(bears[user]);
            delete bears[user];
        }
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

    function setupModuleEvents(module, name){
        var e = ctrls[name + "Enable"],
            t = ctrls[name + "Transmit"],
            r = ctrls[name + "Receive"];
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
        module.enable(e.checked);
        module.transmit(t.checked);
        module.receive(r.checked);
        t.disabled = !e.checked;
        if(t.checked && t.disabled){
            t.checked = false;
        }
    }

    setupModuleEvents(gamepad, "gamepad");
    setupModuleEvents(keyboard, "keyboard");
    setupModuleEvents(mouse, "mouse");
    setupModuleEvents(touch, "touch");
    setupModuleEvents(motion, "motion");
    setupModuleEvents(speech, "speech");


    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var mainScene = new ModelOutput("models/scene.dae", progress, function(object){
        scene.add(object);
        var cam = mainScene.Camera.children[0];
        camera = new THREE.PerspectiveCamera(cam.fov, cam.aspect, cam.near, drawDistance);
        mainScene.Ocean.children[0].material.transparent = true;
        mainScene.Ocean.children[0].material.opacity = 0.75;
        heightmap = ModelOutput.makeHeightMap(mainScene.Terrain, CLUSTER);
        mainScene.Skybox.scale.x
            = mainScene.Skybox.scale.y
            = mainScene.Skybox.scale.z = 0.55 * drawDistance;
        scene.fog = new THREE.Fog(BG_COLOR, 1, drawDistance * 0.6);
    });

    var bearModel = new ModelOutput("models/bear.dae", progress);

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
