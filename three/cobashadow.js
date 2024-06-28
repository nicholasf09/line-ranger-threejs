import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enable shadow map
renderer.shadowMap.enabled = true;

// Geometry and Material
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });

// Mesh
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true; // Default is false
// scene.add(cube);

// Plane
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -1;
plane.receiveShadow = true; // Default is false
scene.add(plane);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
light.castShadow = true; // Default is false
scene.add(light);

// Light helper (optional)
const lightHelper = new THREE.DirectionalLightHelper(light);
scene.add(lightHelper);

// Load GLTF model
const loader = new GLTFLoader();
loader.load(
    '/Witch.glb', // replace with the path to your GLTF file
    function (gltf) {
        const witch = gltf.scene;
        // Enable shadow for each mesh in the model
        witch.traverse(function (node) {
            if (node.isMesh) {
                node.castShadow = true;
                // node.receiveShadow = true;
            }
        });
        witch.position.set(0, -1, 0); // Set the initial position of the model
        scene.add(witch);
    },
    undefined,
    function (error) {
        console.error('An error happened', error);
    }
);

// Render loop
const animate = function () {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
};

animate();