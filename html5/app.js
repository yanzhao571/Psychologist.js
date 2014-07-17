var gamma = 0, 
    beta = 0, 
    alpha = 0, 
    overlay;

var container;

var camera, scene, renderer, effect;

var mesh, lightMesh, geometry;
var spheres = [];

var directionalLight, pointLight;

var mouseX = 0, mouseY = 0;

function pageLoad() {
	container = document.getElementById("front");

	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 100000 );
	camera.position.z = 3200;

	scene = new THREE.Scene();

	var geometry = new THREE.SphereGeometry( 100, 32, 16 );

	var urls = [
		'px.jpg', 'nx.jpg',
		'py.jpg', 'ny.jpg',
		'pz.jpg', 'nz.jpg'
	];

	var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
	var material = new THREE.MeshBasicMaterial( { color: 0xffffff, envMap: textureCube, refractionRatio: 0.95 } );

	for ( var i = 0; i < 500; i ++ ) {
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.x = Math.random() * 10000 - 5000;
		mesh.position.y = Math.random() * 10000 - 5000;
		mesh.position.z = Math.random() * 10000 - 5000;
		mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;
		scene.add( mesh );

		spheres.push( mesh );
	}

	// Skybox

	var shader = THREE.ShaderLib[ "cube" ];
	shader.uniforms[ "tCube" ].value = textureCube;

	var material = new THREE.ShaderMaterial({
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: shader.uniforms,
		side: THREE.BackSide
	}),

	mesh = new THREE.Mesh( new THREE.BoxGeometry( 100000, 100000, 100000 ), material );
	scene.add( mesh );

	renderer = new THREE.WebGLRenderer();
	container.appendChild(renderer.domElement);

	effect = new THREE.StereoEffect( renderer );
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

	effect.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame(animate);
	var timer = 0.0001 * Date.now();
	for (var i = 0, il = spheres.length; i < il; i++) {
		var sphere = spheres[ i ];
		sphere.position.x = 5000 * Math.cos( timer + i );
		sphere.position.y = 5000 * Math.sin( timer + i * 1.1 );
	}
    
	camera.setRotationFromEuler(new THREE.Euler(
        gamma * Math.PI / 180, 
        alpha * Math.PI / 180, 
        beta * Math.PI / 180, 
        "YXZ"));
	effect.render(scene, camera );
}