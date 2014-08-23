include(
    2,
    "lib/three/three.min.js",
    "lib/three/OculusRiftEffect.min.js",
    "lib/three/AnaglyphEffect.min.js",
    "js/psychologist.js",
    "js/input/SpeechInput.js",
    "js/input/GamepadInput.js",
    "js/input/KeyboardInput.js",
    "js/input/MotionInput.js",
    "js/input/MouseInput.js",
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
        fps, dt, clock, heightmap = [],
        fullScreenButton = document.getElementById("fullScreenButton"),
        options = document.getElementById("options"),
        buttonsTimeout = null,
        buttonsVisible = true;

    function animate() {
        requestAnimationFrame(animate);
        dt = clock.getDelta();
        motion.update();
        keyboard.update();
        mouse.update();
        gamepad.update();
        vcy -= dt * SPEED;
        var x = Math.floor(camera.position.x/SCALE) + MAP_WIDTH / 2;
        var y = Math.floor(camera.position.z/SCALE) + MAP_HEIGHT / 2;
        var h = 0;
        if (0 <= x && x < MAP_WIDTH && 0 <= y && y < MAP_HEIGHT){
            h = (heightmap[y][x] + 2) * SCALE;
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
            tz = keyboard.getValue("driveBack") + keyboard.getValue("driveForward") + gamepad.getValue("drive");
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
            + motion.getValue("yaw")) * dt;
        pitch += (gamepad.getValue("pitch") 
            + mouse.getValue("pitch") 
            + motion.getValue("pitch")) * dt;
        roll += (gamepad.getValue("rollLeft") 
            + gamepad.getValue("rollRight") 
            + keyboard.getValue("rollLeft") 
            + keyboard.getValue("rollRight") 
            + motion.getValue("roll")) * dt;

        fps = 1 / dt;
        setCamera(dt);
        draw();
    }

    function setCamera(dt) {
        camera.updateProjectionMatrix();
        camera.setRotationFromEuler(new THREE.Euler(0, 0, 0, "YZX"));
        //camera.translateX(vcx * dt);
        //camera.translateY(vcy * dt);
        //camera.translateZ(vcz * dt);
        //camera.setRotationFromEuler(new THREE.Euler(pitch, heading, roll, "YZX"));
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
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
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
	scene.fog = new THREE.FogExp2(BG_COLOR, 3 / DRAW_DISTANCE);

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
            toggleFullScreen();
            mouse.requestPointerLock();
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

    function changeFOV(v){
        FOV += v;
        if(!camera){
            camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 1, DRAW_DISTANCE);
        }
        else{
            camera.fov = FOV;
        }
        console.log(FOV);
    }

    changeFOV(0);

    motion = new MotionInput([
        { name: "yaw", axes: [-7] },
        { name: "pitch", axes: [8] },
        { name: "roll", axes: [-9] }
    ]);

    mouse = new MouseInput([
        { name: "yaw", axes: [-4] },
        { name: "pitch", axes: [5] },
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
    ]);

    keyboard = new KeyboardInput([
        { name: "strafeLeft", buttons: [-65, -37] },
        { name: "driveForward", buttons: [-87, -38] },
        { name: "strafeRight", buttons: [68, 39] },
        { name: "driveBack", buttons: [83, 40] },
        { name: "rollLeft", buttons: [81] },
        { name: "rollRight", buttons: [69] },
        { name: "jump", buttons: [32], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [17], commandDown: fire, dt: 125 },
        { name: "reload", buttons: [70], commandDown: reload, dt: 125 },
    ]);

    gamepad = new GamepadInput([
        { name: "strafe", axes: [1], deadzone: 0.1 },
        { name: "drive", axes: [2], deadzone: 0.1 },
        { name: "yaw", axes: [-3], deadzone: 0.1 },
        { name: "pitch", axes: [4], deadzone: 0.1 },
        { name: "rollRight", buttons: [5] },
        { name: "rollLeft", buttons: [-6] },
        { name: "jump", buttons: [1], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [2], commandDown: fire, dt: 125 },
    ]);

    gamepad.addEventListener("gamepadconnected", function (id) {
        if (!gamepad.isGamepadSet() 
            && confirm(fmt("Would you like to use this gamepad? \"$1\"", id))) {
            gamepad.setGamepad(id);
        }
    }, false);

    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
	
    var imgTexture = THREE.ImageUtils.loadTexture( "img/grass.png" );
	imgTexture.wrapS = imgTexture.wrapT = THREE.RepeatWrapping;
	imgTexture.anisotropy = 16;
    
    var material = new THREE.MeshLambertMaterial({ color: 0xffffff, ambient: 0xffffff, opacity: 1, map: imgTexture });
    
    var light = new THREE.DirectionalLight(0xffffff, 0.75);
    light.position.set(1, 1, 0);
    scene.add(light);

    var light2 = new THREE.AmbientLight(0x808080);
    scene.add(light2);

    for(var y = 0; y < MAP_HEIGHT; ++y){
        heightmap.push([]);
        for(var x = 0; x < MAP_WIDTH; ++x){
            heightmap[y].push(0);
        }
    }

    for(var h = 0; h < (MAP_WIDTH + Math.random() * MAP_HEIGHT) / 2; ++h){
        var x = Math.floor(Math.random() * MAP_WIDTH);
        var y = Math.floor(Math.random() * MAP_HEIGHT);
        var z = Math.floor(4 + Math.random() * 4);
        for(var dy = -z; dy < z; ++dy){
            var ty = y + dy;
            for(var dx = -z; dx < z && 0 <= ty && ty < MAP_HEIGHT; ++dx){
                var tx = x + dx;
                if(0 <= tx && tx < MAP_WIDTH){
                    heightmap[ty][tx] = Math.max(heightmap[ty][tx], z - Math.abs(dx) - Math.abs(dy));
                }
            }
        }
    }
    
    for(var y = 0; y < MAP_HEIGHT; ++y){
        for(var x = 0; x < MAP_WIDTH; ++x){
            heightmap[y][x] -= 10;
            var c = new THREE.Mesh(geometry, material);
            c.position.x = SCALE * (x - MAP_WIDTH / 2);
            c.position.y = SCALE * heightmap[y][x];
            c.position.z = SCALE * (y - MAP_HEIGHT / 2);
            c.scale.x = SCALE;
            c.scale.y = SCALE;
            c.scale.z = SCALE;
            scene.add(c);
        }
    }    

    clock.start();
    options.parentElement.insertBefore(renderer.domElement, options);
    setSize(window.innerWidth, window.innerHeight);
    requestAnimationFrame(animate);
});