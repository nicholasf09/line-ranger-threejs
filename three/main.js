import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { FBXLoader } from 'three/examples/jsm/Addons.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { Water } from 'three/addons/objects/Water.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { Sky } from 'three/addons/objects/Sky.js';
import { MeshBasicNodeMaterial, vec4, color, positionLocal, mix } from 'three/nodes';

const renderer = new THREE.WebGLRenderer();
// renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

const SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;

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
const fillLight1 = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
fillLight1.position.set( 2, 1, 1 );
// scene.add( fillLight1 );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top	= 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.0001;
// scene.add( directionalLight );


//Geometry
const objects = [];

// Fungsi untuk membuat dan mengatur cahaya
function createLight(position) {
    const light = new THREE.PointLight(0xffffff, 4000);
    light.position.set(...position);
    light.angle = Math.PI / 6;
    light.penumbra = 1;
    light.decay = 2;
    light.distance = 0;
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.1;  
    light.shadow.camera.far = 500;  
    light.shadow.focus = 1;
    light.shadow.bias = -0.005;
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
// const loader = new GLTFLoader();
// loader.load('resources/testgrafkom(19-05).gltf', function (gltf) {
//     const object = gltf.scene;
//     object.position.set(0, 5.5, 0);

//     function setShadowProperties(obj) {
//         obj.traverse(child => {
//             if (child.isMesh) {
//                 child.castShadow = true;
//                 child.receiveShadow = true;
//             }
//         });
//     }

//     // Aktifkan bayangan pada objek yang dimuat
//     setShadowProperties(object);

//     scene.add(object);
// });

//LOAD KARAKTER
// Load witch character with animation
const witchLoader = new GLTFLoader();
let mixer, idleAction, walkAction, currentAction;
let witch;
let witchPosition = new THREE.Vector3();
let witchMoving = true; 

witchLoader.load('witch.glb', function (gltf) {
    witch = gltf.scene;
    witch.scale.set(20, 20, 20);
    witch.position.set(0, 0, 0);
    scene.add(witch);
    witchPosition.copy(witch.position);

    mixer = new THREE.AnimationMixer(witch);
    idleAction = mixer.clipAction(gltf.animations[4]); // Assuming the first animation is idle
    walkAction = mixer.clipAction(gltf.animations[22]); // Assuming the second animation is walk
    currentAction = idleAction;
    idleAction.play();
});

// Handle keyboard input
const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    updateAnimation();
});

let ghostMode = false;

//GHOST MODE
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        ghostMode = !ghostMode;
        if (ghostMode) {
            controls.enabled = true;
            witchMoving = false;
        } else {
            controls.enabled = false;
            witchMoving = true;
        }
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
    updateAnimation();
});

function updateAnimation() {
    if (keys.w || keys.a || keys.s || keys.d) {
        if (currentAction !== walkAction) {
            currentAction.stop();
            currentAction = walkAction;
            walkAction.play();
        }
    } else {
        if (currentAction !== idleAction) {
            currentAction.stop();
            currentAction = idleAction;
            idleAction.play();
        }
    }
}

function moveCharacter() {
    if (!witch || ghostMode || !witchMoving) return;

    const speed = 0.1;
    let direction = new THREE.Vector3();
    let rotationSpeed = 0.05;

    if (keys.w) witch.position.z -= 0.4;
    if (keys.s) witch.position.z += 0.4;
    if (keys.a) witch.position.x -= 0.4;
    if (keys.d) witch.position.x += 0.4;

    if (direction.length() > 0) {
        direction.normalize();
        witch.position.add(direction.clone().multiplyScalar(speed));

        let angle = Math.atan2(direction.x, direction.z);
        let currentRotation = witch.rotation.y;

        if (Math.abs(angle - currentRotation) > Math.PI) {
            if (angle > currentRotation) {
                currentRotation += 2 * Math.PI;
            } else {
                angle += 2 * Math.PI;
            }
        }

        if (angle > currentRotation) {
            witch.rotation.y += Math.min(rotationSpeed, angle - currentRotation);
        } else {
            witch.rotation.y -= Math.min(rotationSpeed, currentRotation - angle);
        }
    }
}

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

  objects.forEach((obj)=>{
    obj.rotation.z += dt * 0.01;
  });

  //_____________________________WATER______________________________
  water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

  //bottle rotation
  bottleGroup2.rotation.z += 0.01
  bottleGroup2.rotation.y += 0.01
  bottleGroup2.rotation.x += 0.01

  moveCharacter();
  if (mixer) mixer.update(dt * 0.01); // Update the mixer

  renderer.render(scene,camera);

  time_prev = time;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);



