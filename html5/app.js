var dg = 0, gamma = 0, tg = 0,
    db = 0, beta = 0, tb = 0,
    da = 0, alpha = 0, ta = 0,
    overlay, gfx, vid, vidGfx,
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

    vidGfx.drawImage(vid, 0, 0);
    map.needsUpdate = true;

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

    vid = document.createElement("video");
    vid.autoplay = true;
    var vidCanv = document.createElement("canvas");
    vidGfx = vidCanv.getContext("2d");

    setupVideo([{w:1920,h:1080},{w:1280, h:720}], vid, function(){
        vidCanv.width = vid.videoWidth;
        vidCanv.height = vid.videoHeight;

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1;
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    overlay.parentElement.insertBefore(renderer.domElement, overlay);

    effect = new THREE.StereoEffect(renderer);
    effect.separation = 1;

    window.addEventListener("resize", function () {
        setSize(window.innerWidth, window.innerHeight);
    }, false);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({color: 0x70ff70, ambient: 0xffffff, opacity:0.75, transparent: true });
    cube = new THREE.Mesh(geometry, material);

    map = new THREE.Texture(vidCanv);//THREE.ImageUtils.loadTexture("nx.jpg");
    map.needsUpdate = true;
    var material2 = new THREE.SpriteMaterial({
        map: map, 
        color: 0xffffff, 
        fog: true
    });
    var sprite = new THREE.Sprite(material2);
    sprite.position.x = - 2;
    sprite.scale.set(4, 4 * vid.videoHeight / vid.videoWidth, 1);

    var light = new THREE.DirectionalLight(0xffffff, 0.95);
    var light2 = new THREE.AmbientLight(0x101010);
    light.position.set(1, 1, 0);

    var material3 = new THREE.LineBasicMaterial({color: 0xff0000});
    var geometry3 = new THREE.Geometry();
    for(var a = 0; a < 2 * Math.PI; a += Math.PI / 180){
        geometry3.vertices.push(new THREE.Vector3(Math.cos(a), a, Math.sin(a)));
    }
    var line = new THREE.Line(geometry3, material3);

    scene = new THREE.Scene();
    scene.add(light);
    scene.add(light2);
    scene.add(cube);
    scene.add(sprite);
    scene.add(line);

    
    setSize(window.innerWidth, window.innerHeight);
    clock.start();
    window.requestAnimationFrame(animate);
    
    });
}

function setCamera(dt) {
    camera.setRotationFromEuler(new THREE.Euler(gamma + dg, alpha + da, beta + db, "YXZ")); 
}

function calibrate() {
    dg = -gamma;
    db = -beta;
    da = -alpha;
}