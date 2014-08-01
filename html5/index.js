var dg = 0, pitch = 0,
    db = 0, roll = 0,
    da = 0, heading = 0,
    overlay, gfx, video,
    camera, scene, effect, renderer, cube, map,
    ax, ay, az,
    clock;

function animate() {
    var dt = clock.getDelta();
    window.requestAnimationFrame(animate);
    cube.rotation.x += 0.2 * dt;
    cube.rotation.y += 0.3 * dt;
    cube.rotation.z += 0.5 * dt;

    gfx.clearRect(0, 0, overlay.width, overlay.height);
    gfx.font = "20px Arial";
    gfx.fillStyle = "#c00000";
    gfx.fillText(fmt("b: $1.00, g: $2.00, a: $3.00", roll, pitch, heading), 10, 20);
    gfx.fillText(fmt("fps: $1.00", 1/dt), 10, 45);
    gfx.fillText(fmt("x: $1.00, y: $2.00, z: $3.00", ax, ay, az), 10, 70);
    gfx.fillStyle = "#111";
    gfx.fillRect(overlay.width / 2 - 2, 0, 4, overlay.height);

    if(map){
        map.needsUpdate = true;
    }

    setCamera(dt);
    effect.render(scene, camera);
}

function setSize(w, h) {
    overlay.width = w;
    overlay.height = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    effect.setSize(window.innerWidth, window.innerHeight);
}

function pageLoad() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    overlay = document.getElementById("overlay");
    gfx = overlay.getContext("2d");

    Orientation.addEventListener("deviceorientation", function (evt){
        roll = evt.roll;
        pitch = evt.pitch;
        heading = evt.heading;
        ax = evt.accelerationX;
        ay = evt.accelerationY;
        az = evt.accelerationZ;
    });

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1;
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    overlay.parentElement.insertBefore(renderer.domElement, overlay);

    effect = new THREE.OculusRiftEffect(renderer);
    //effect.separation = isMobile ? 1 : -1;

    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({color: 0x70ff70, ambient: 0xffffff, opacity:0.75, transparent: true });
    cube = new THREE.Mesh(geometry, material);

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
    scene.add(cube);
    scene.add(line);
    
    

    video = document.createElement("video");
    video.autoplay = true;
    video.loop = true;

    var modes = isMobile 
        ? ["default"]
        : [{w:640, h:480}, {w:1920, h:1080}, {w:1280, h:720}];

    if(false) setupVideo(modes, video, function(){
	    video.width	= video.videoWidth;
	    video.height = video.videoHeight;
        map = new THREE.Texture(video);
        var material2 = new THREE.SpriteMaterial({
            map: map,
            color: 0xffffff, 
            fog: true
        });
        var sprite = new THREE.Sprite(material2);
        sprite.position.x = -2;
        sprite.scale.set(4, 4 * video.height / video.width, 1);
        scene.add(sprite);    
    });
    
    clock.start();
    setSize(window.innerWidth, window.innerHeight);
    window.requestAnimationFrame(animate);
}

function setCamera(dt) {
    camera.setRotationFromEuler(new THREE.Euler(pitch + dg, heading + da, roll + db)); 
}

function calibrate() {
    dg = -pitch;
    db = -roll;
    da = -heading;
}