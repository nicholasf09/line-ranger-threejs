import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Initialize renderer
const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Setup Scene and Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x090633);
scene.fog = new THREE.Fog(0x090633, 0, 4000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();

// Light setup
function createLight(position) {
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(...position);
    light.castShadow = true;
    scene.add(light);
}

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

lightPositions.forEach(position => {
    createLight(position);
});

// Water setup
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('./waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.rotation.x = -Math.PI / 2;
scene.add(water);

new RGBELoader()
    .setPath('')
    .load('kloppenheim_02_puresky_8k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.background = texture;
        scene.environment = texture;
    });

// Load witch character with animation
const witchLoader = new GLTFLoader();
let mixer, idleAction, walkAction, currentAction;
let witch;
let clock = new THREE.Clock();

// Load the witch character with animation
witchLoader.load('witch.glb', function (gltf) {
    witch = gltf.scene;
    witch.scale.set(20, 20, 20);
    witch.position.set(0, 0, 0);
    witch.rotation.y = Math.PI;
    scene.add(witch);

    mixer = new THREE.AnimationMixer(witch);
    idleAction = mixer.clipAction(gltf.animations[4]); // Assuming the 5th animation is idle
    walkAction = mixer.clipAction(gltf.animations[22]); // Assuming the 23rd animation is walk
    currentAction = idleAction;
    idleAction.play();
});

// Handle keyboard input for movement
let keys = {};
let targetRotation = Math.PI;
let moveDirection = null;
let rotationSpeed = 0.1; // Adjust rotation speed
let moveDistance = 0.4; // Adjust movement speed

function handleKeyDown(event) {
    keys[event.code] = true;
    updateMovement();
}

function handleKeyUp(event) {
    keys[event.code] = false;
    updateMovement();
}

function updateMovement() {
    if (!witch) return;
    moveDirection = null;

    if (keys['ArrowUp']) {
        targetRotation = Math.PI; // Face forward
        moveDirection = 'forward';
    }
    if (keys['ArrowDown']) {
        targetRotation = 0; // Face backward
        moveDirection = 'backward';
    }
    if (keys['ArrowLeft']) {
        targetRotation = -Math.PI / 2; // Face left
        moveDirection = 'left';
    }
    if (keys['ArrowRight']) {
        targetRotation = Math.PI / 2; // Face right
        moveDirection = 'right';
    }

    // Smooth rotation
    witch.rotation.y = THREE.MathUtils.lerp(witch.rotation.y, targetRotation, rotationSpeed);
}

// Initialize variables
let isGhostMode = false;
let ghostCameraPosition = new THREE.Vector3(); // Initial position for ghost camera

// Function to handle switching between third-person view and ghost mode
function toggleGhostMode() {
	isGhostMode = !isGhostMode;

	// If entering ghost mode, save the current camera position as ghostCameraPosition
	if (isGhostMode) {
		ghostCameraPosition.copy(camera.position);
	}
}

// Function to update camera position and orientation based on current mode
function updateCamera() {
	if (isGhostMode) {
		// Update ghost mode camera controls here (e.g., using keyboard and mouse)
		// Example:
		// Move camera with WASD keys
		if (keys['KeyW']) camera.position.z -= moveDistance;
		if (keys['KeyS']) camera.position.z += moveDistance;
		if (keys['KeyA']) camera.position.x -= moveDistance;
		if (keys['KeyD']) camera.position.x += moveDistance;
		
		// Rotate camera with mouse movement (use OrbitControls for easier implementation)
		controls.update();
	} else {
		// Follow witch in third-person view
		const offset = new THREE.Vector3(0, 50, -50).applyQuaternion(witch.quaternion);
		camera.position.copy(witch.position).add(offset);
		camera.lookAt(witch.position);
	}
}

// Update key event handlers to toggle ghost mode
function handleKeyDownG(event) {
	keys[event.code] = true;

	// Toggle ghost mode with 'G' key
	if (keys['KeyG']) toggleGhostMode();
}

function handleKeyUpG(event) {
	keys[event.code] = false;
}

// Add event listeners for key events
window.addEventListener('keydownG', handleKeyDownG);
window.addEventListener('keyupG', handleKeyUpG);

function animate(time) {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    // Move witch after rotation is close to the target
    if (moveDirection) {
        if (Math.abs(witch.rotation.y - targetRotation) < 0.1) {
            if (moveDirection === 'forward') {
                witch.position.z -= moveDistance;
            } else if (moveDirection === 'backward') {
                witch.position.z += moveDistance;
            } else if (moveDirection === 'left') {
                witch.position.x -= moveDistance;
            } else if (moveDirection === 'right') {
                witch.position.x += moveDistance;
            }

            if (currentAction !== walkAction) {
                currentAction.stop();
                currentAction = walkAction;
                walkAction.play();
            }
        }
    } else {
        if (currentAction !== idleAction) {
            currentAction.stop();
            currentAction = idleAction;
            idleAction.play();
        }
    }

	// Update camera based on mode
    updateCamera();

	// Update camera position to follow the witch
    const offset = new THREE.Vector3(0, 50, -50).applyQuaternion(witch.quaternion);
    camera.position.copy(witch.position).add(offset);
    camera.lookAt(witch.position);

    renderer.render(scene, camera);
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

animate();