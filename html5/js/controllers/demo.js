var isDebug = false,
    isLocal = document.location.hostname == "localhost",
	ctrls = findEverything(),
    tabs = makeTabSet(ctrls.options),
	PLAYER_HEIGHT = 6,
    formState = getSetting("formState"),
    login,
	prog = new LoadingProgress(
		"manifest/js/controllers/demo.js?v2",
		"lib/three/three.js",
		"lib/three/StereoEffect.js",
		"lib/three/OculusRiftEffect.js",
		"lib/three/AnaglyphEffect.js",
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

function displayProgress(){
    ctrls.triedSoFar.style.width = prog.makeSize(FileState.NONE, "size");
    ctrls.processedSoFar.style.width = prog.makeSize(FileState.STARTED | FileState.ERRORED | FileState.COMPLETE , "progress");
    ctrls.loadedSoFar.style.width = prog.makeSize(FileState.COMPLETE, "size");
    ctrls.loadingMessage.innerHTML 
        = ctrls.connectButton.innerHTML 
        = "Loading, please wait... " + ctrls.loadedSoFar.style.width;
    ctrls.loadedSoFar.style.left = ctrls.errorSoFar.style.width = prog.makeSize(FileState.ERRORED, "size");
    if(prog.isDone()){
        ctrls.loading.style.display = "none";
        ctrls.connectButton.addEventListener("click", login, false);
        ctrls.connectButton.innerHTML = "Connect";
        ctrls.loadingMessage.innerHTML = "Loading complete!";
        setTimeout(function(){
            ctrls.loadingMessage.style.visibility = "hidden";
        }, 2000);
    }
}

function postScriptLoad(progress){
    var BG_COLOR = 0xafbfff, CLUSTER = 2,
        TRACKING_SCALE = 0,
        TRACKING_SCALE_COMP = 1 - TRACKING_SCALE,
        GRAVITY = 9.8, SPEED = 15,
        pitch = 0, roll = 0, heading = 0,
        vcx = 0, vcz = 0, vcy = 0,
        onground = false,
        head, arm, keyboard, mouse, gamepad, touch, speech,
        dt, lt = 0, frame = 0, dFrame = 0.125,
        userName = null, password = null,
        audio3d = new Audio3DOutput(),
        oceanSound = null,
        socket = io.connect(document.location.hostname, {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        }), 
        bears = {}, pointer, heightmap,
        nameMaterial = new THREE.MeshLambertMaterial({
            color: 0x7f7f00,
            shading: THREE.FlatShading
        }),
        camera, effect, drawDistance = 250,
        scene = new THREE.Scene(),
        renderer = new THREE.WebGLRenderer({ antialias: true }),
        repeater = new SpeechOutput.Character();

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

        if(camera.position.y <= y && vcy <= 0){
            vcy = 0;
            camera.position.y = camera.position.y * 0.75 + y * 0.25;
            if(!onground){
                navigator.vibrate(100);
            }
            onground = true;
        }

        if(onground){
            var tx = keyboard.getValue("strafeRight")
                + keyboard.getValue("strafeLeft")
                + gamepad.getValue("strafe");
            var tz = keyboard.getValue("driveBack")
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
    }

    function animate(t){
        requestAnimationFrame(animate);
        dt = (t - lt) * 0.001;
        lt = t;
        
        if(camera && heightmap){
		    THREE.AnimationHandler.update(dt);
            head.update(dt);
            arm.update(dt);
            keyboard.update(dt);
            mouse.update(dt);
            gamepad.update(dt);
            touch.update(dt);
            update(dt);
            setCamera(dt);
            draw();
        }
    }
    
    function setCamera(dt){
        camera.updateProjectionMatrix();
        camera.setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
        camera.translateX(vcx * dt);
        camera.translateY(vcy * dt);
        camera.translateZ(vcz * dt);
        camera.setRotationFromEuler(new THREE.Euler(pitch, heading, roll, "YZX"));
        mainScene.Skybox.position.set(camera.position.x, camera.position.y, camera.position.z);
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
            bears[userName].position.set(camera.position.x, camera.position.y - PLAYER_HEIGHT, camera.position.z);
        }

        if(pointer){
            var ph = arm.getValue("heading") - heading + Math.PI / 2;
            var pr = arm.getValue("roll");
            var pp = arm.getValue("pitch");
            pointer.position.set(-10 * Math.sin(ph) * Math.cos(pr),  -10 * Math.sin(pr), -10 * Math.cos(ph) * Math.cos(pr));
        }

        var x = camera.position.x / 10,
            y = camera.position.y / 10,
            z = camera.position.z / 10;
            
        var len = Math.sqrt(x * x + y * y + z * z);
        audio3d.setPosition(x, y, z);
        audio3d.setVelocity(vcx, vcy, vcz);
        audio3d.setOrientation(x / len, y / len, z / len, 0, 1, 0);
    }

    function draw(){
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

        chooseRenderingEffect(getSetting("renderingEffect"));
        
        renderer.setSize(w, h);
        if (effect){
            effect.setSize(w, h);
        }
    }
    
    login = function(){
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
        if(!isDebug && !isLocal && closers[i].parentElement == ctrls.options){
            closers[i].addEventListener("click", function(){
                requestFullScreen();
                mouse.requestPointerLock();
            });
        }
    }

    ctrls.menuButton.addEventListener("click", function(){
        ctrls.options.style.display = "";
        ctrls.menuButton.style.display = "none";
    }, false);

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

    function jump(){
        if (onground){
            vcy = 10;
            onground = false;
        }
    }

    function fire(){
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

        var centerOffset = (nameGeometry.boundingBox.max.x - nameGeometry.boundingBox.min.x) * 0.5;
		var nameMesh = new THREE.Mesh(nameGeometry, nameMaterial);
        var name = new THREE.Object3D();
        name.add(nameMesh);
		bears[user].add(name);
		name.position.x = centerOffset;
		name.position.y = PLAYER_HEIGHT + 2;
		name.position.z = 0;
        name.rotateY(Math.PI);

        if(user == userName){
            if(arm.isEnabled() || arm.isReceiving()){
                var sphere = new THREE.SphereGeometry(0.5, 4, 2);
                var spine = new THREE.Object3D();
                spine.position.x = 0;
                spine.position.y = PLAYER_HEIGHT;
                spine.position.z = 0;
                pointer = new THREE.Mesh(sphere, nameMaterial);
                spine.add(pointer);
                bears[user].add(spine);
            }
        }
    }

    socket.on("loginFailed", function(){
        msg("Incorrect user name or password!");
    });

    socket.on("userList", function(users){
        msg("You are now connected to the device server.");
        addUser(userName);
        for(var i = 0; i < users.length; ++i){
            if(users[i].toLocaleUpperCase() != userName.toLocaleUpperCase()){
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

    head = new MotionInput("head", null, [
        { name: "heading", axes: [-MotionInput.HEADING] },
        { name: "pitch", axes: [MotionInput.PITCH] },
        { name: "roll", axes: [-MotionInput.ROLL] }
    ], socket);

    arm = new MotionInput("arm", null, [
        { name: "heading", axes: [-MotionInput.HEADING] },
        { name: "pitch", axes: [MotionInput.PITCH] },
        { name: "roll", axes: [-MotionInput.ROLL] }
    ], socket);

    mouse = new MouseInput("mouse", [
        { axis: MouseInput.DX, scale: 0.4 },
        { axis: MouseInput.DY, scale: 0.4 },
        { axis: MouseInput.IY, min: -2, max: 1.3 }
    ], [
        { name: "heading", axes: [-MouseInput.IX] },
        { name: "pitch", axes: [-MouseInput.IY]},
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
    ], socket, renderer.domElement);

    touch = new TouchInput("touch", null, null, [
        { name: "heading", axes: [TouchInput.IX0] },
        { name: "drive", axes: [-TouchInput.DY0] },
    ], socket, renderer.domElement);

    keyboard = new KeyboardInput("keyboard", [
        { name: "strafeLeft", buttons: [-KeyboardInput.A, -KeyboardInput.LEFTARROW] },
        { name: "strafeRight", buttons: [KeyboardInput.D, KeyboardInput.RIGHTARROW] },
        { name: "driveForward", buttons: [-KeyboardInput.W, -KeyboardInput.UPARROW] },
        { name: "driveBack", buttons: [KeyboardInput.S, KeyboardInput.DOWNARROW] },
        { name: "jump", buttons: [KeyboardInput.SPACEBAR], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [KeyboardInput.CTRL], commandDown: fire, dt: 125 },
        { name: "reload", buttons: [KeyboardInput.R], commandDown: reload, dt: 125 },
    ], socket);

    gamepad = new GamepadInput("gamepad", [
        { axis: GamepadInput.LSX, deadzone: 0.1},
        { axis: GamepadInput.LSY, deadzone: 0.1},
        { axis: GamepadInput.RSX, deadzone: 0.1, scale: 1.5},
        { axis: GamepadInput.RSY, deadzone: 0.1, scale: 1.5},
        { axis: GamepadInput.IRSY, min: -2, max: 1.3 }
    ], [
        { name: "strafe", axes: [GamepadInput.LSX]},
        { name: "drive", axes: [GamepadInput.LSY]},
        { name: "heading", axes: [-GamepadInput.IRSX]},
        { name: "pitch", axes: [GamepadInput.IRSY]},
        { name: "jump", buttons: [1], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [2], commandDown: fire, dt: 125 },
    ], socket);

    speech = new SpeechInput("speech", [
        { keywords: ["jump"], command: jump },
        { preamble: true, keywords: ["say"], command: repeater.speak.bind(repeater) }
    ], socket);

    gamepad.addEventListener("gamepadconnected", function (id){
        if (!gamepad.isGamepadSet() && ask(fmt("Would you like to use this gamepad? \"$1\"", id), true)){
            gamepad.setGamepad(id);
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
    setupModuleEvents(arm, "arm");
    setupModuleEvents(mouse, "mouse");
    setupModuleEvents(touch, "touch");
    setupModuleEvents(keyboard, "keyboard");
    setupModuleEvents(gamepad, "gamepad");
    setupModuleEvents(speech, "speech");


    window.addEventListener("resize", function (){
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
