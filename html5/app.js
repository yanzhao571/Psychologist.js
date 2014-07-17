var gamma = 0, 
    beta = 0, 
    alpha = 0, 
    overlay,
    camera, scene, renderer, effect,
    mesh, lightMesh, geometry,
    spheres = [],
    directionalLight, pointLight;

function pageLoad() {
    overlay = document.getElementById("overlay");

	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer();
    overlay.parentElement.insertBefore(renderer.domElement, overlay);

	effect = new THREE.StereoEffect(renderer);
	effect.separation = 10;
	effect.setSize(window.innerWidth, window.innerHeight);

    setupOrientation(function(g,b,a){
        gamma = g;;
        beta = b;
        alpha = a;
    });

    window.addEventListener("resize", resize, false);
    window.requestAnimationFrame(animate);
}

function resize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	effect.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	window.requestAnimationFrame(animate);    
	camera.setRotationFromEuler(new THREE.Euler(
        gamma * Math.PI / 180, 
        alpha * Math.PI / 180, 
        beta * Math.PI / 180, 
        "YXZ"));
	effect.render(scene, camera);
}