var dg = 0, gamma = 0, tg = 0,
    db = 0, beta = 0, tb = 0,
    da = 0, alpha = 0, ta = 0,
    overlay, gfx, video,
    camera, scene, effect, renderer, cube, map,
    clock, firstTime = !isMobile;

function animate() {
    var dt = clock.getDelta();
    window.requestAnimationFrame(animate);
    cube.rotation.x += 0.2 * dt;
    cube.rotation.y += 0.3 * dt;
    cube.rotation.z += 0.5 * dt;

    gfx.clearRect(0, 0, overlay.width, overlay.height);
    var txt = fmt("g: $1.00, a: $2.00, b: $3.00, fps: $4.0", gamma, alpha, beta, 1/dt);
    gfx.font = "20px Arial";
    gfx.fillStyle = "#c00000";
    gfx.fillText(txt, 10, 20);
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

    setupOrientation(function (g, b, a){
        gamma = g;
        beta = b;
        alpha = a;
        if (firstTime) {
            calibrate();
            firstTime = false;
        }
    });

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1;
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    overlay.parentElement.insertBefore(renderer.domElement, overlay);

    effect = new THREE.StereoEffect(renderer);
    effect.separation = isMobile ? 1 : -1;

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
        : [{w:1920, h:1080}, {w:1280, h:720}];

    setupVideo(modes, video, function(){
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

    
        setSize(window.innerWidth, window.innerHeight);
        clock.start();    
    });
    
    window.requestAnimationFrame(animate);
}

function setCamera(dt) {
    camera.setRotationFromEuler(new THREE.Euler(gamma + dg, alpha + da, beta + db, "YXZ")); 
}

function calibrate() {
    dg = -gamma;
    db = -beta;
    da = -alpha;
}