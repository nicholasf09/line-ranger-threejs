import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Water } from 'three/addons/objects/Water.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { Sky } from 'three/addons/objects/Sky.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
document.body.appendChild(renderer.domElement);

//setup Scene and Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x090633 );
scene.fog = new THREE.Fog( 0x090633, 0, 4000 );
const camera = new THREE.PerspectiveCamera(75,window.innerWidth
  /window.innerHeight,0.1,1000);
camera.position.set(0,0,100);
camera.lookAt(0,0,0);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,5,0)
controls.update()

//LIGHT
// const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
// fillLight1.position.set( 2, 1, 1 );
// scene.add( fillLight1 );

// const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
// directionalLight.position.set( - 5, 25, - 1 );
// directionalLight.castShadow = true;
// directionalLight.shadow.camera.near = 0.01;
// directionalLight.shadow.camera.far = 500;
// directionalLight.shadow.camera.right = 30;
// directionalLight.shadow.camera.left = - 30;
// directionalLight.shadow.camera.top	= 30;
// directionalLight.shadow.camera.bottom = - 30;
// directionalLight.shadow.mapSize.width = 2048;
// directionalLight.shadow.mapSize.height = 2048;
// directionalLight.shadow.radius = 4;
// directionalLight.shadow.bias = - 0.0001;
// scene.add( directionalLight );


//Geometry
const objects = [];

// Fungsi untuk membuat dan mengatur cahaya
function createLight(position) {
    const light = new THREE.PointLight(0xffffff, 2000);
    light.position.set(...position);
    // light.castShadow = true;
    // light.shadow.mapSize.width = 1024; // Increase shadow map resolution
    // light.shadow.mapSize.height = 1024; // Increase shadow map resolution
    // light.shadow.bias = -0.001; // Reduce shadow acne
    // light.shadow.camera.near = 0.5; // Adjust near clipping plane of shadow camera
    // light.shadow.camera.far = 500; // Adjust far clipping plane of shadow camera
    scene.add(light);
}

// Posisi dari semua lampu
const lightPositions = [
    [282.9, 45, -200.7],
    [272.9, 45, -325.7],
    [272.9, 45, -105.7],
    [272.9, 45, 40.7],
    [272.9, 45, 160],
    [272.9, 45, 320],
    [272.9, 45, 480],
    [272.9, 45, 640],
    [272.9, 45, 800],
    [272.9, 45, 960],
    [-160, 45, 10],
    [-160, 45, 160],
    [-120, 45, 160]
];

// Buat semua lampu berdasarkan posisi yang diberikan
lightPositions.forEach(position => {
    createLight(position);
});

// __________________________________________________Water_____________________________

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

var water = new Water(
	waterGeometry,
	{
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: new THREE.TextureLoader().load( './waternormals.jpg', function ( texture ) {

			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

		} ),
		sunDirection: new THREE.Vector3(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 3.7,
		fog: scene.fog !== undefined
	}
);

water.rotation.x = - Math.PI / 2;

scene.add( water );

new RGBELoader()
	.setPath( '' )
	.load( 'kloppenheim_02_puresky_8k.hdr', function ( texture ) {

		texture.mapping = THREE.EquirectangularReflectionMapping;

		scene.background = texture;
		scene.environment = texture;

	} );

//GLTF LOADER
const loader = new GLTFLoader();
loader.load('resources/testgrafkom(19-05).gltf', function (gltf) {
    const object = gltf.scene;
    object.position.set(0, 5.5, 0);

    // function setShadowProperties(obj) {
    //     obj.traverse(child => {
    //         if (child.isMesh) {
    //             // child.castShadow = true;
    //             // child.receiveShadow = true;
    //         }
    //     });
    // }

    // Aktifkan bayangan pada objek yang dimuat
    // setShadowProperties(object);

    scene.add(object);
});

//Transparant
// Geometry for bottle
const bottleGeometry = new THREE.CylinderGeometry(1, 1, 5, 32);
const neckGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);

// Transparent material
const material = new THREE.MeshBasicMaterial({
    color: 0xc6c6c6,
    transparent: true,
    opacity: 0.4
});

//Botol 1
// Mesh for bottle body
var bottle = new THREE.Mesh(bottleGeometry, material);
bottle.position.set(0, 0, 0);

// Mesh for bottle neck
var neck = new THREE.Mesh(neckGeometry, material);
neck.position.set(0, 3.5, 0);

// Create a group to hold the bottle and neck
var bottleGroup = new THREE.Group();
bottleGroup.add(bottle);
bottleGroup.add(neck);

// Position the entire bottle
bottleGroup.position.set(-20, 5.5, 25);
scene.add(bottleGroup);

//Botol 2
// Mesh for bottle body
var bottle1 = new THREE.Mesh(bottleGeometry, material);
bottle1.position.set(0, 0, 0);

// Mesh for bottle neck
var neck1 = new THREE.Mesh(neckGeometry, material);
neck1.position.set(0, 3.5, 0);

// Create a group to hold the bottle and neck
var bottleGroup1 = new THREE.Group();
bottleGroup1.add(bottle1);
bottleGroup1.add(neck1);

// Position the entire bottle
bottleGroup1.position.set(-18, 5.5, 27);
scene.add(bottleGroup1);

//Botol 2
// Mesh for bottle body
var bottle2 = new THREE.Mesh(bottleGeometry, material);
bottle2.position.set(0, 0, 0);

// Mesh for bottle neck
var neck2 = new THREE.Mesh(neckGeometry, material);
neck2.position.set(0, 3.5, 0);

// Create a group to hold the bottle and neck
var bottleGroup2 = new THREE.Group();
bottleGroup2.add(bottle2);
bottleGroup2.add(neck2);

// Position the entire bottle
bottleGroup1.position.set(-22, 5.5, 23);
scene.add(bottleGroup2);

var time_prev = 0;
function animate(time){
  var dt = time - time_prev;
  dt *= 0.1;

  //_____________________________WATER______________________________
  water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

  //bottle rotation
  bottleGroup2.rotation.z += 0.01
  bottleGroup2.rotation.y += 0.01
  bottleGroup2.rotation.x += 0.01

  renderer.render(scene,camera);

  time_prev = time;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);



