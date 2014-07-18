var dg = 0, gamma = 0,
    db = 0, beta = 0,
    da = 0, alpha = 0,
    overlay, gfx,
    camera, scene, effect, renderer, cube,
    clock, firstTime = !isMobile;

function setWidth(w, h) {
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
    gfx.font = "25pt Arial";
    gfx.clearStyle = "rgba(0,0,0,0)";

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1;
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer();
    overlay.parentElement.insertBefore(renderer.domElement, overlay);

    effect = new THREE.StereoEffect(renderer);
    effect.separation = 1;

    setupOrientation(function (g, b, a){
        gamma = g;
        beta = b;
        alpha = a;
        if (firstTime) {
            calibrate();
            firstTime = false;
        }
        setCamera();
    });

    window.addEventListener("resize", function () {
        setWidth(window.innerWidth, window.innerHeight);
    }, false);

    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0x70ff70, ambient: 0xffffff, opacity:0.75, transparent: true });
    material.side = THREE.DoubleSide;
    cube = new THREE.Mesh(geometry, material);

    var map = THREE.ImageUtils.loadTexture("nx.jpg");
    var material2 = new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: true });
    var sprite = new THREE.Sprite(material2);
    sprite.position.x = - 2;

    var light = new THREE.DirectionalLight(0xffffff, 0.95);
    light.position.set(0, 1, 0);

    scene = new THREE.Scene();
    scene.add(light);
    scene.add(cube);
    scene.add(sprite);

    
    setWidth(window.innerWidth, window.innerHeight);
    clock.start();
    window.requestAnimationFrame(animate);
}

function setCamera() { camera.setRotationFromEuler(new THREE.Euler(gamma + dg, alpha + da, beta + db, "YXZ")); }

function calibrate() {
    dg = -gamma;
    db = -beta;
    da = -alpha;
    setCamera();
}

function animate() {
    var dt = clock.getDelta();
    window.requestAnimationFrame(animate);
    cube.rotation.x += 0.2 * dt;
    cube.rotation.y += 0.3 * dt;
    cube.rotation.z += 0.5 * dt;
    effect.render(scene, camera);
    gfx.clearRect(0, 0, overlay.width, overlay.height);
    var txt = fmt("g: $1.00, a: $2.00, b: $3.00", gamma, alpha, beta);
    gfx.fillStyle = "white";
    for (var dx = 0, lx = overlay.width / 2; dx < 2; ++dx) {
        gfx.fillText(txt, 100 + dx * lx, 100);
    }
}