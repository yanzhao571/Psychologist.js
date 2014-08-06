var dg = 0, pitch = 0,
    db = 0, roll = 0,
    da = 0, heading = 0,
    overlay, gfx, video,
    camera, scene, effect, renderer, cube, map,
    ax, ay, az, dmx, dmy, keyboard, fps, speed = 5, 
    cx = 0, cy = 0, cz = 10, vcx = 0, vcy = 0, vcz = 0,
    clock;

function animate() {
    var dt = clock.getDelta();
    window.requestAnimationFrame(animate);
    cube.rotation.x += 0.2 * dt;
    cube.rotation.y += 0.3 * dt;
    cube.rotation.z += 0.5 * dt;

    fps = 1/dt;
    
    setCamera();

    if(keyboard.isDown("forward")){
        cx += Math.sin(heading) * dt * speed;
        cz -= Math.cos(heading) * dt * speed;
    }
    else if(keyboard.isDown("back")){
        cx -= Math.sin(heading) * dt * speed;
        cz += Math.cos(heading) * dt * speed;
    }

    if(keyboard.isDown("right")){
        cz += Math.sin(heading) * dt * speed;
        cx += Math.cos(heading) * dt * speed;
    }
    else if(keyboard.isDown("left")){
        cz -= Math.sin(heading) * dt * speed;
        cx -= Math.cos(heading) * dt * speed;
    }

    cy += vcy * dt;
    vcy -= 9.8 * dt;
    
    if(cy <= 0){
        vcy = 0;
        cy = 0;
    }
    

    draw();
}

function draw(){
    effect.render(scene, camera);

    gfx.clearRect(0, 0, overlay.width, overlay.height);
    gfx.font = "20px Arial";
    gfx.fillStyle = "#c00000";
    gfx.fillText(fmt("fps: $1.00, h: $2.00, p: $3.00", fps, heading, pitch), 10, 20);
    gfx.fillStyle = "#111";
    gfx.fillRect(overlay.width / 2 - 2, 0, 4, overlay.height);
}

function setSize(w, h) {
    overlay.width = w;
    overlay.height = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
}

function pageLoad() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    overlay = document.getElementById("overlay");
    gfx = overlay.getContext("2d");
    var fullScreenButton = document.getElementById("fullScreenButton"),
        options = document.getElementById("options"),
        buttonsTimeout = null, 
        buttonsVisible = true;;
    fullScreenButton.addEventListener("click", toggleFullScreen, false);

    function hideButtonsLater(){
        if(buttonsTimeout != null){
            clearTimeout(buttonsTimeout);
        }
        buttonsTimeout = setTimeout(hideButtons, 3000);
    }
    hideButtonsLater();

    function setButtons(){
        options.style.opacity = buttonsVisible ? 1 : 0;
        if(buttonsVisible){
            hideButtonsLater();
        }
    }

    function toggleButtons(){
        buttonsVisible = !buttonsVisible;
        setButtons();
    }

    function showButtons(evt){
        if(evt){
            evt.preventDefault();
        }
        if(!buttonsVisible){
            toggleButtons();
        }
        hideButtonsLater();
    }

    function hideButtons(){
        console.log("hide buttons", buttonsVisible);
        if(buttonsVisible){
            toggleButtons();
        }
    }

    function jump(){
        if(cy == 0){
            vcy = 4;
        }
    }

    function fire(){
    }

    function reload(){
        if(isFullScreenMode()){
            document.location = document.location.href;
        }
        else{
            toggleFullScreen();
            overlay.requestPointerLock();   
        }
    }

    keyboard = new KeyboardCommandInterface([
        {name: "left", keycodes: [65, 37]},
        {name: "forward", keycodes: [87, 38]},
        {name: "right", keycodes: [68, 39]},
        {name: "back", keycodes: [83, 40]},
        {name: "jump", keycodes: [32], commandDown: jump, dt: 250},
        {name: "fire", keycodes: [17], commandDown: fire, dt: 125},
        {name: "reload", keycodes: [70], commandDown: reload, dt: 125},
    ]);

    window.addEventListener("mousemove", showButtons, false);
    window.addEventListener("mouseup", showButtons, false);

    camera = new THREE.PerspectiveCamera(53.13, window.innerWidth / window.innerHeight, 0.1, 1000);

    LandscapeMotion.addEventListener("deviceorientation", function (evt){
        roll = evt.roll;
        pitch = evt.pitch * 4;
        heading = evt.heading * 4;
    });

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xafbfff);
    overlay.parentElement.insertBefore(renderer.domElement, overlay);

    setupPointerLock(overlay, function(evt){
        dmx = evt.webkitMovementX || evt.mozMovementX || 0;
        dmy = evt.webkitMovementY || evt.mozMovementY || 0;
        heading += dmx * 2 * Math.PI / window.innerWidth;
        pitch += dmy *  Math.PI / window.innerHeight;
    });

    effect = new THREE.OculusRiftEffect(renderer, {HMD: {
		hResolution: screen.availWidth,
		vResolution: screen.availHeight,
		hScreenSize: 0.126,
		vScreenSize: 0.075,
		interpupillaryDistance: 0.064,
		lensSeparationDistance: 0.064,
		eyeToScreenDistance: 0.051,
		distortionK : [1, 0.22, 0.06, 0.0],
		chromaAbParameter: [ 0.996, -0.004, 1.014, 0.0]
	}});

    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({color: 0x70ff70, ambient: 0xffffff, opacity:1, transparent: false });

    var light = new THREE.DirectionalLight(0xffffff, 0.95);
    var light2 = new THREE.AmbientLight(0x101010);
    light.position.set(1, 1, 0);

    var material3 = new THREE.LineBasicMaterial({color: 0xff0000});
    var geometry3 = new THREE.Geometry();
    for(var i = 0; i < 360; ++i){
        var a = i * Math.PI / 180;
        var c = Math.cos(a);
        var s = Math.sin(a);
        geometry3.vertices.push(new THREE.Vector3(s, a, c));
    }
    var line = new THREE.Line(geometry3, material3);

    scene.add(light);
    scene.add(light2);
    scene.add(line);

    for(var i = 0; i < 11; ++i){
        var c = new THREE.Mesh(geometry, material);
        c.position.x = i - 5;
        c.position.y = i - 5;
        c.position.z = i - 5;
        scene.add(c);
        if(i != 5){
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
        else{
            cube = c;
        }
    }
    
    clock.start();
    setSize(window.innerWidth, window.innerHeight);
    window.requestAnimationFrame(animate);
}

function setCamera(dt) {
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 0;
    camera.setRotationFromEuler(new THREE.Euler(pitch + dg, -(heading + da), -(roll + db), "YZX"));
    camera.position.x = cx;
    camera.position.y = cy;
    camera.position.z = cz;
}

function calibrate() {
    dg = -pitch;
    db = -roll;
    da = -heading;
}