include(
    2,
    "lib/three/three.min.js",
    "lib/three/OculusRiftEffect.min.js",
    "lib/three/AnaglyphEffect.min.js",
    "js/psychologist.js",
    "js/input/SpeechInput.js",
    "js/input/GamepadInput.js",
    "js/input/KeyboardInput.js",
    "js/input/LandscapeMotion.js",
    "js/input/MouseInput.js",
    "js/camera.js",
function(){
    var MAP_WIDTH = 50, MAP_HEIGHT = 50, SCALE = 100, BG_COLOR = 0xafbfff, 
        DRAW_DISTANCE = SCALE * Math.sqrt(MAP_HEIGHT * MAP_HEIGHT + MAP_WIDTH * MAP_WIDTH) / 2,
        SPEED = 9.8 * SCALE, FOV = 60,
        pitch = 0, roll = 0, heading = 0,
        vcx = 0, vcz = 0, vcy = 0, tx, tz,
        onground = false,
        overlay, gfx, video,
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
            tx = keyboard.getValue("right") - keyboard.getValue("left") + gamepad.getValue("strafe");
            tz = keyboard.getValue("back") - keyboard.getValue("forward") + gamepad.getValue("drive");
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

        if (gamepad.isGamepadSet()) {
            heading += 2 * gamepad.getValue("yaw") * dt;
            pitch += 2 * gamepad.getValue("pitch") * dt;
        }

        if(mouse.isPointerLocked()){
            heading += 0.5 * mouse.getValue("yaw") * dt;
            pitch += 0.5 * mouse.getValue("pitch") * dt;
        }

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
        gfx.clearRect(0, 0, overlay.width, overlay.height);
        gfx.font = "20px Arial";
        gfx.fillStyle = "#c00000";

        if (effect) {
            effect.render(scene, camera);
        }
        else {
            renderer.render(scene, camera);
        }
    }

    function setSize(w, h) {
        overlay.width = w;
        overlay.height = h;
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
    overlay = document.getElementById("overlay");
    gfx = overlay.getContext("2d");
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

    function increaseFOV(){
        changeFOV(+5);
    }

    function decreaseFOV(){
        changeFOV(-5);
    }

    changeFOV(0);

    LandscapeMotion.addEventListener("deviceorientation", function (evt) {
        roll = -evt.roll;
        pitch = evt.pitch;
        heading = -evt.heading;
    });

    motion = new MotionInput([
        { name: "heading", axes: [-1] },
        { name: "pitch", axes: [2] },
        { name: "roll", axes: [-3] }
    ]);

    mouse = new MouseInput([
        { name: "yaw", axes: [-4] },
        { name: "pitch", axes: [5] },
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
    ]);

    keyboard = new KeyboardInput([
        { name: "left", buttons: [65, 37], commandDown: function(){vcx = -1;}, commandDown: function(){vcx = 0;}  },
        { name: "forward", buttons: [87, 38], commandDown: function(){vcz = -1;}, commandDown: function(){vcz = 0;} },
        { name: "right", buttons: [68, 39], commandDown: function(){vcx = 1;}, commandDown: function(){vcx = 0;} },
        { name: "back", buttons: [83, 40], commandDown: function(){vcz = 1;}, commandDown: function(){vcz = 0;}  },
        { name: "decrease FOV", buttons: [81], commandDown: decreaseFOV, dt: 250},
        { name: "increase FOV", buttons: [69], commandDown: increaseFOV, dt: 250},
        { name: "jump", buttons: [32], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [17], commandDown: fire, dt: 125 },
        { name: "reload", buttons: [70], commandDown: reload, dt: 125 },
    ]);

    gamepad = new GamepadInput([
        { name: "strafe", axes: [1], deadzone: 0.1 },
        { name: "drive", axes: [2], deadzone: 0.1 },
        { name: "yaw", axes: [-3], deadzone: 0.1 },
        { name: "pitch", axes: [4], deadzone: 0.1 },
        { name: "rollRight", buttons: [5], commandDown: function () { roll = 0.25; }, commandUp: function () { roll = 0; } },
        { name: "rollLeft", buttons: [6], commandDown: function () { roll = -0.25; }, commandUp: function () { roll = 0; } },
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
    var light2 = new THREE.AmbientLight(0x808080);
    
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

    light.position.set(1, 1, 0);
    scene.add(light);
    scene.add(light2);
    clock.start();
    setSize(window.innerWidth, window.innerHeight);
    overlay.parentElement.insertBefore(renderer.domElement, overlay);
    requestAnimationFrame(animate);
});