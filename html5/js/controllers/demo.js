var pitch = 0,
    roll = 0,
    heading = 0,
    overlay, gfx, video,
    camera, scene, effect, renderer, cube, map,
    ax, ay, az, dmx, dmy, keyboard, mouse, gamepad, fps, speed = 5,
    dt, disp, vcy = 0,
    clock;

function animate() {
    requestAnimationFrame(animate);
    dt = clock.getDelta();
    mouse.update();
    gamepad.update();
    cube.rotation.x += 0.2 * dt;
    cube.rotation.y += 0.3 * dt;
    cube.rotation.z += 0.5 * dt;
    vcy -= dt * speed;
    if (camera.position.y <= 0 && vcy < 0) {
        vcy = 0;
    }
    fps = 1 / dt;
    setCamera(dt);
    draw();
}


function setCamera(dt) {
    camera.updateProjectionMatrix();
    camera.setRotationFromEuler(new THREE.Euler(0, 0, 0, "YZX"));
    disp = speed * dt;
    camera.translateY(disp * vcy);
    camera.rotateY(heading);

    if (keyboard.isDown("forward")) {
        camera.translateZ(-disp);
    }
    else if (keyboard.isDown("back")) {
        camera.translateZ(disp);
    }

    if (keyboard.isDown("right")) {
        camera.translateX(disp);
    }
    else if (keyboard.isDown("left")) {
        camera.translateX(-disp);
    }

    if (gamepad.isGamepadSet()) {
        camera.translateX(disp * gamepad.getValue("strafe"));
        camera.translateZ(disp * gamepad.getValue("drive"));
        heading += 2 * gamepad.getValue("yaw") * dt;
        pitch += 2 * gamepad.getValue("pitch") * dt;
    }

    if(mouse.isPointerLocked()){
        heading += 0.5 * mouse.getValue("yaw") * dt;
        pitch += 0.5 * mouse.getValue("pitch") * dt;
    }
    
    camera.rotateX(pitch);
    camera.rotateZ(roll);
}

function draw() {
    gfx.clearRect(0, 0, overlay.width, overlay.height);
    gfx.font = "20px Arial";
    gfx.fillStyle = "#c00000";
    gfx.fillText(fmt("fps: $1.00, h: $2.00, p: $3.00", fps, heading, pitch), 10, 20);
    gfx.fillText(fmt("x: $1.00, y: $2.00, z: $3.00", camera.position.x, camera.position.y, camera.position.z), 10, 40);

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

function gameDemo() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    overlay = document.getElementById("overlay");
    gfx = overlay.getContext("2d");
    var fullScreenButton = document.getElementById("fullScreenButton"),
        options = document.getElementById("options"),
        buttonsTimeout = null,
        buttonsVisible = true;;
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
        if (evt) {
            evt.preventDefault();
        }
        if (!buttonsVisible) {
            toggleButtons();
        }
        hideButtonsLater();
    }

    function hideButtons() {
        if (buttonsVisible) {
            toggleButtons();
        }
    }

    function jump() {
        if (camera.position.y <= 0) {
            vcy = 4;
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

    camera = new THREE.PerspectiveCamera(53.13, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xafbfff);

    if (confirm("use stereo rendering?")) {
        effect = new THREE.OculusRiftEffect(renderer, {
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
        effect = new THREE.AnaglyphEffect(renderer, 50, window.innerWidth, window.innerHeight);
    }

    LandscapeMotion.addEventListener("deviceorientation", function (evt) {
        roll = -evt.roll;
        pitch = evt.pitch;
        heading = -evt.heading;
    });

    mouse = new MouseInput([
        { name: "yaw", axes: [-4] },
        { name: "pitch", axes: [5] },
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
    ], overlay);

    keyboard = new KeyboardInput([
        { name: "left", buttons: [65, 37] },
        { name: "forward", buttons: [87, 38] },
        { name: "right", buttons: [68, 39] },
        { name: "back", buttons: [83, 40] },
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

    overlay.parentElement.insertBefore(renderer.domElement, overlay);

    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0x70ff70, ambient: 0xffffff, opacity: 1, transparent: false });

    var light = new THREE.DirectionalLight(0xffffff, 0.95);
    var light2 = new THREE.AmbientLight(0x101010);
    light.position.set(1, 1, 0);

    var material3 = new THREE.LineBasicMaterial({ color: 0xff0000 });
    var geometry3 = new THREE.Geometry();
    for (var i = 0; i < 360; ++i) {
        var a = i * Math.PI / 180;
        var c = Math.cos(a);
        var s = Math.sin(a);
        geometry3.vertices.push(new THREE.Vector3(s, a, c));
    }
    var line = new THREE.Line(geometry3, material3);

    scene.add(light);
    scene.add(light2);
    scene.add(line);

    for (var i = 0; i < 11; ++i) {
        var c = new THREE.Mesh(geometry, material);
        c.position.x = i - 5;
        c.position.y = i - 5;
        c.position.z = i - 5;
        scene.add(c);
        if (i != 5) {
            c = new THREE.Mesh(geometry, material);
            c.position.x = 5 - i;
            c.position.y = i - 5;
            c.position.z = i - 5;
            scene.add(c);

            c = new THREE.Mesh(geometry, material);
            c.position.x = i - 5;
            c.position.y = 5 - i;
            c.position.z = i - 5;
            scene.add(c);

            c = new THREE.Mesh(geometry, material);
            c.position.x = i - 5;
            c.position.y = i - 5;
            c.position.z = 5 - i;
            scene.add(c);
        }
        else {
            cube = c;
        }
    }

    clock.start();
    setSize(window.innerWidth, window.innerHeight);
    window.requestAnimationFrame(animate);
}