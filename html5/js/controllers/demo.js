include(
    2,
    "lib/three/three.min.js",
    "lib/three/StereoEffect.js",
    "lib/three/OculusRiftEffect.min.js",
    "lib/three/AnaglyphEffect.min.js",
    "lib/three/ColladaLoader.js",
    "/socket.io/socket.io.js",
    "js/psychologist.js",
    "js/input/NetworkedInput.js",
    "js/input/SpeechInput.js",
    "js/input/GamepadInput.js",
    "js/input/KeyboardInput.js",
    "js/input/MotionInput.js",
    "js/input/MouseInput.js",
    "js/input/TouchInput.js",
    "js/camera.js",
function(){
    THREE.DefaultLoadingManager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};
    var BG_COLOR = 0xafbfff, PLAYER_HEIGHT = 3, CLUSTER = 2,
        DRAW_DISTANCE = 100,
        GRAVITY = 9.8, SPEED = 10, FOV = 60,
        pitch = 0, roll = 0, heading = 0,
        dpitch = 0, droll = 0, dheading = 0,
        minX = 0, minY = 0, minZ = 0, lt = 0,
        vcx = 0, vcz = 0, vcy = 0, tx, tz,
        onground = false,
        video,
        camera, scene, effect, renderer, map,
        motion, keyboard, mouse, gamepad, 
        fps, dt, heightmap,
        fullScreenButton = document.getElementById("fullScreenButton"),
        options = document.getElementById("options"),
        github = document.getElementById("github"),
        buttonsTimeout = null,
        buttonsVisible = true,
        key = null,
        isDebug = true,
        isLocal = document.location.hostname == "localhost",
        isWAN = /\d+\.\d+\.\d+\.\d+/.test(document.location.hostname),
        socket;

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
        lt = t;
        motion.update();
        keyboard.update();
        mouse.update();
        gamepad.update();
        touch.update();
        vcy -= dt * GRAVITY;
        var x = Math.floor((camera.position.x - minX) / CLUSTER);
        var z = Math.floor((camera.position.z - minZ) / CLUSTER);
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
                len = SPEED / Math.sqrt(tz * tz + tx * tx);
            }
            else{
                len = 0;
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
        dpitch += (gamepad.getValue("dpitch") 
            + mouse.getValue("dpitch") ) * dt;
        droll += (gamepad.getValue("drollLeft") 
            + gamepad.getValue("drollRight") 
            + keyboard.getValue("drollLeft") 
            + keyboard.getValue("drollRight")) * dt;

        heading = motion.getValue("heading") + dheading;
        pitch = motion.getValue("pitch") + dpitch;
        roll = motion.getValue("roll") + droll;

        fps = 1 / dt;
        setCamera(dt);
        draw();
    }

    function setCamera(dt) {
        camera.updateProjectionMatrix();
        camera.setRotationFromEuler(new THREE.Euler(0, 0, 0, "XYZ"));
        camera.translateX(vcx * dt);
        camera.translateY(vcy * dt);
        camera.translateZ(vcz * dt);
        camera.setRotationFromEuler(new THREE.Euler(pitch, heading, roll, "YZX"));
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
    //scene.fog = new THREE.Fog(BG_COLOR, 1, DRAW_DISTANCE);
    fullScreenButton.addEventListener("click", reload, false);

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

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(BG_COLOR);

    if(isDebug || isLocal || isWAN){
        key = "local";
    }
    else{
        key = prompt("Enter a key. Make it good.");
    }

    if(key){
        socket = io.connect(document.location.hostname,
        {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        });
        socket.on("bad", function(){
            msg("Key already in use! You're going to have to reload the page if you want to try again. Sorry. Try not to pick such a stupid key next time.");
        });
        socket.on("good", function(side){
            if(isLocal){
                if(side == "left"){
                    msg("After you close this dialog, the demo will be waiting for a paired device.");
                }
                else{
                    msg("This demo has been paired with another device now. If this is your first time entering your key, it means you've chosen a key someone else is already using, in which case you should reload the page and try another, less stupid key.");
                }
            }
        });
        socket.emit("key", key);
    }

    if (isWAN && confirm("use stereo rendering?")) {
        FOV = 106.26;
        effect = new THREE.StereoEffect(renderer, {
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

        setTimeout(function(){
            github.style.display = "none";
        }, 5000);
    }
    else if (isLocal && ask("use red/cyan anaglyph rendering?")) {
        effect = new THREE.AnaglyphEffect(renderer, 5, window.innerWidth, window.innerHeight);
    }

    motion = new MotionInput([
        { name: "heading", axes: [-1] },
        { name: "pitch", axes: [2] },
        { name: "roll", axes: [-3] }
    ], socket);

    mouse = new MouseInput([
        { name: "dheading", axes: [-4] },
        { name: "dpitch", axes: [5] },
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
    ], socket, renderer.domElement);

    touch = new TouchInput(1, null, [
        { name: "dheading", axes: [-3] },
        { name: "drive", axes: [4] },
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

    if(isLocal && ask("Use speech?")){
        speech.start();
    }

    gamepad.addEventListener("gamepadconnected", function (id) {
        if (!gamepad.isGamepadSet() 
            && ask(fmt("Would you like to use this gamepad? \"$1\"", id), true)) {
            gamepad.setGamepad(id);
        }
    }, false);

    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load("scene/untitled.dae?v4", function(collada){
        collada.scene.traverse(function(child){
            if(child instanceof(THREE.PerspectiveCamera)){
                camera = child;
                requestAnimationFrame(animate);
            }
            else if(child.name == "Terrain"){
                heightmap = [];
                var verts = child.children[0].geometry.vertices;
                var l = verts.length;
                for(var i = 0; i < l; ++i){
                    minX = Math.min(minX, verts[i].x);
                    minY = Math.min(minY, verts[i].y);
                    minZ = Math.min(minZ, verts[i].z);
                }
                for(var i = 0; i < l; ++i){
                    var x = Math.round((verts[i].x - minX) / CLUSTER);
                    var z = Math.round((verts[i].z - minZ) / CLUSTER);
                    if(!heightmap[z]){
                        heightmap[z] = [];
                    }
                    if(heightmap[z][x] == undefined){
                        heightmap[z][x] = verts[i].y;
                    }
                    else{
                        heightmap[z][x] = Math.max(heightmap[z][x], verts[i].y);
                    }
                }
            }
        });
        collada.scene.updateMatrix();
        scene.add(collada.scene);
    });

    options.parentElement.insertBefore(renderer.domElement, options);
    setSize(window.innerWidth, window.innerHeight);
});