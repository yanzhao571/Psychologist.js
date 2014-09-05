include(
    2,
    "lib/three/three.min.js",
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
    var MAP_WIDTH = 50, MAP_HEIGHT = 50, SCALE = 1, BG_COLOR = 0xafbfff, 
        DRAW_DISTANCE = SCALE * Math.sqrt(MAP_HEIGHT * MAP_HEIGHT + MAP_WIDTH * MAP_WIDTH) / 2,
        SPEED = 9.8 * SCALE, FOV = 60,
        pitch = 0, roll = 0, heading = 0,
        vcx = 0, vcz = 0, vcy = 0, tx, tz,
        onground = false,
        video,
        camera, scene, effect, renderer, map,
        motion, keyboard, mouse, gamepad, 
        fps, dt, clock, heightmap,
        fullScreenButton = document.getElementById("fullScreenButton"),
        options = document.getElementById("options"),
        github = document.getElementById("github"),
        buttonsTimeout = null,
        buttonsVisible = true,
        key = prompt("Enter a key. Make it good."),
        socket;

    if(key){
        socket = io.connect(document.location.hostname,
        {
            "reconnect": true,
            "reconnection delay": 1000,
            "max reconnection attempts": 60
        });
        socket.on("bad", function(){
            alert("Key already in use! You're going to have to reload the page if you want to try again. Sorry. Try not to pick such a stupid key next time.");
        });
        socket.on("good", function(side){
            if(side == "left"){
                alert("After you close this dialog, the demo will be waiting for a paired device.");
            }
            else{
                alert("This demo has been paired with another device now. If this is your first time entering your key, it means you've chosen a key someone else is already using, in which case you should reload the page and try another, less stupid key.");
            }
        });
        socket.emit("key", key);
    }

    function animate() {
        requestAnimationFrame(animate);
        dt = clock.getDelta();
        motion.update();
        keyboard.update();
        mouse.update();
        gamepad.update();
        touch.update();

        vcy -= dt * SPEED;
        var x = Math.floor(camera.position.x/SCALE) + MAP_WIDTH / 2;
        var y = Math.floor(camera.position.z/SCALE) + MAP_HEIGHT / 2;
        var h = 2 * SCALE;
        if (heightmap && 0 <= x && x < MAP_WIDTH && 0 <= y && y < MAP_HEIGHT){
            h += heightmap[y][x] * SCALE;
        }
        if(camera.position.y <= h && vcy <= 0) {
            vcy = 0;
            camera.position.y = camera.position.y * 0.75 + h * 0.25;
            if(!onground){
                navigator.vibrate(100);
            }
            onground = true;
        }

        if(onground){
            tx = keyboard.getValue("strafeRight") + keyboard.getValue("strafeLeft") + gamepad.getValue("strafe");
            tz = keyboard.getValue("driveBack") + keyboard.getValue("driveForward") + gamepad.getValue("drive") + touch.getValue("drive");
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

        heading += (gamepad.getValue("yaw") 
            + mouse.getValue("yaw")
            + touch.getValue("yaw")) * dt 
            + motion.getValue("yaw");
        pitch += (gamepad.getValue("pitch") 
            + mouse.getValue("pitch") ) * dt
            + motion.getValue("pitch");
        roll += (gamepad.getValue("rollLeft") 
            + gamepad.getValue("rollRight") 
            + keyboard.getValue("rollLeft") 
            + keyboard.getValue("rollRight")) * dt
            + motion.getValue("roll");

        fps = 1 / dt;
        setCamera(dt);
        draw();
    }

    function setCamera(dt) {
        camera.updateProjectionMatrix();
        camera.setRotationFromEuler(new THREE.Euler(0, 0, 0, "YZX"));
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
    //scene.fog = new THREE.FogExp2(BG_COLOR, 1 / DRAW_DISTANCE);
    clock = new THREE.Clock();
    fullScreenButton.addEventListener("click", reload, false);

    function hideButtonsLater() {
        if (buttonsTimeout != null) {
            clearTimeout(buttonsTimeout);
        }
        buttonsTimeout = setTimeout(hideButtons, 3000);
    }
    hideButtonsLater();

    function setButtons() {
        options.style.opacity = buttonsVisible ? 1 : 0;
        github.style.opacity = buttonsVisible ? 1 : 0;
        if (buttonsVisible) {
            hideButtonsLater();
        }
    }

    function toggleButtons() {
        buttonsVisible = !buttonsVisible;
        setButtons();
    }

    function showButtons(evt) {
        if(!mouse || !mouse.isPointerLocked()){
            if (!buttonsVisible) {
                toggleButtons();
            }
            hideButtonsLater();
        }
    }

    function hideButtons() {
        if (buttonsVisible) {
            toggleButtons();
        }
    }

    function jump() {
        if (onground) {
            vcy = 10 * SCALE;
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

    window.addEventListener("mousemove", showButtons, false);
    window.addEventListener("mouseup", showButtons, false);

    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(BG_COLOR);

    if (confirm("use stereo rendering?")) {
        FOV = 106.26;
        effect = new THREE.OculusRiftEffect(renderer, {
            worldFactor: SCALE,
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
    }
    else if (confirm("use red/cyan anaglyph rendering?")) {
        effect = new THREE.AnaglyphEffect(renderer, 5 * SCALE, window.innerWidth, window.innerHeight);
    }

    motion = new MotionInput([
        { name: "yaw", axes: [-7] },
        { name: "pitch", axes: [8] },
        { name: "roll", axes: [-9] }
    ], socket);

    mouse = new MouseInput([
        { name: "yaw", axes: [-4] },
        { name: "pitch", axes: [5] },
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
    ], socket, renderer.domElement);

    touch = new TouchInput(1, null, [
        { name: "yaw", axes: [-3] },
        { name: "drive", axes: [4] },
    ], socket, renderer.domElement);

    keyboard = new KeyboardInput([
        { name: "strafeLeft", buttons: [-65] },
        { name: "strafeRight", buttons: [68] },
        { name: "driveForward", buttons: [-87] },
        { name: "driveBack", buttons: [83] },
        { name: "rollLeft", buttons: [81] },
        { name: "rollRight", buttons: [-69] },
        { name: "jump", buttons: [32], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [17], commandDown: fire, dt: 125 },
        { name: "reload", buttons: [70], commandDown: reload, dt: 125 },
    ], socket);

    gamepad = new GamepadInput([
        { name: "strafe", axes: [1], deadzone: 0.1 },
        { name: "drive", axes: [2], deadzone: 0.1 },
        { name: "yaw", axes: [-3], deadzone: 0.1 },
        { name: "pitch", axes: [4], deadzone: 0.1 },
        { name: "rollRight", buttons: [5] },
        { name: "rollLeft", buttons: [-6] },
        { name: "jump", buttons: [1], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [2], commandDown: fire, dt: 125 },
    ], socket);

    speech = new SpeechInput([
        { keywords: ["jump"], command: jump }
    ], socket);

    if(confirm("Use speech?")){
        speech.start();
    }

    gamepad.addEventListener("gamepadconnected", function (id) {
        if (!gamepad.isGamepadSet() 
            && confirm(fmt("Would you like to use this gamepad? \"$1\"", id))) {
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
            else{
                // console.log(child);
            }
        });
        collada.scene.updateMatrix();
        scene.add(collada.scene);
    });

    clock.start();
    options.parentElement.insertBefore(renderer.domElement, options);
    setSize(window.innerWidth, window.innerHeight);
});