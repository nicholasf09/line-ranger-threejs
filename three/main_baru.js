import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Player, PlayerController, ThirdPersonCamera } from "./person.js";
import { Ghost, GhostController, GhostCamera } from "./ghost.js";
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Water } from 'three/addons/objects/Water.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { Sky } from 'three/addons/objects/Sky.js';


// Clock
const clock = new THREE.Clock();
// Mixers
let mixer, mixer1, mixer2;
// Player
let player, ghostPlayer, mainPlayer;
// Bounding box
let stagBoundingBox = null;
let walkBoundingBox = null;
let adventurerBoundingBox = null;
let enviromentBoundingBox = [];
// Initialize bounding boxes for debugging visualization
let stagBBoxHelper, walkBBoxHelper, adventurerBBoxHelper;

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Setup canvas renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(sizes.width, sizes.height);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Setup scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);

//______________________________________LOAD ENVIRONMENT_____________________________________
const loader = new GLTFLoader();
loader.load('resources/dermaga.gltf', function (gltf) {
    const object = gltf.scene;
    object.position.set(0, 0, 0);
    object.scale.set(0.2,0.2,0.2);

    function setShadowProperties(obj) {
        obj.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    // Aktifkan bayangan pada objek yang dimuat
    setShadowProperties(object);

    scene.add(object);
});

loader.load('resources/envreborn rumah.gltf', function (gltf) {
  const object = gltf.scene;
  object.position.set(0, 0, 0);
  object.scale.set(0.2,0.2,0.2);

  function setShadowProperties(obj) {
      obj.traverse(child => {
          if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
          }
      });
  }

  // Aktifkan bayangan pada objek yang dimuat
  setShadowProperties(object);

  scene.add(object);
});

//___________________________________LOAD WATER________________________________________
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

//_____________________________________LOAD SKY_________________________________________
// sky
// new RGBELoader()
// 	.setPath( '' )
// 	.load( 'kloppenheim_02_puresky_8k.hdr', function ( texture ) {

// 		texture.mapping = THREE.EquirectangularReflectionMapping;

// 		scene.background = texture;
// 		scene.environment = texture;

// 	} );

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

//_______________________________________________LOAD WITCH_____________________________________
const witchLoader = new GLTFLoader();
let witchModel, witchActions;

witchLoader.load("/Witch.glb", (witch) => {
  witchModel = witch.scene;
  scene.add(witchModel);
  witchModel.scale.set(0.2, 0.2, 0.2);
  witchModel.position.set(20*0.2, 2*0.2, 10*0.2);
  witchModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const clips = witch.animations;
  mixer2 = new THREE.AnimationMixer(witchModel);
  witchActions
 = {
    idle: mixer2.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Idle")
    ),
    walk: mixer2.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Walk")
    ),
    run: mixer2.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Run")
    ),
    wave: mixer2.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Wave")
    ),
    interact: mixer2.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Interact")
    ),
    death: mixer2.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Death")
    ),
  };

  createPlayer();
});

function createPlayer() {
  player = new Player(
    new ThirdPersonCamera(
      camera,
      new THREE.Vector3(0, 2*0.2, -5*0.2),
      new THREE.Vector3(0, 2*0.2, 0)
    ),
    new PlayerController(),
    scene,
    10,
    witchModel,
    witchActions
  ,
    renderer,
    enviromentBoundingBox
  );
  mainPlayer = player;
}

const ghostGeometry = new THREE.BoxGeometry(10, 20, 10);
const ghostMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
});
const ghostModel = new THREE.Mesh(ghostGeometry, ghostMaterial);

ghostModel.position.set(20*0.2, 2*0.2, 10*0.2);

function createGhostPlayer() {
  ghostPlayer = new Ghost(
    new GhostCamera(
      camera,
      new THREE.Vector3(0, 2*0.2, -5*0.2),
      new THREE.Vector3(0, 2*0.2, 0)
    ),
    new GhostController(),
    scene,
    50,
    ghostModel,
    renderer
  );
}

createGhostPlayer();

window.addEventListener("keydown", (event) => {
  if (event.key === "p") {
    if (player === ghostPlayer) {
      console.log("player");
      player = mainPlayer;
    } else {
      console.log("ghost_player");
      player = ghostPlayer;
    }
  }
});

const ambientLight = new THREE.AmbientLight(0x404080, 0.5); // cool blue color, low intensity
scene.add(ambientLight);
//Geometry
const objects = [];

// Fungsi untuk membuat dan mengatur cahaya
function createLight(position) {
    const light = new THREE.PointLight(0xffffff, 5, 20);
    light.position.set(...position);
    light.castShadow = true;
    // light.shadow.mapSize.width = 1024; // Increase shadow map resolution
    // light.shadow.mapSize.height = 1024; // Increase shadow map resolution
    // light.shadow.bias = -0.001; // Reduce shadow acne
    // light.shadow.camera.near = 0.5; // Adjust near clipping plane of shadow camera
    // light.shadow.camera.far = 500; // Adjust far clipping plane of shadow camera
    scene.add(light);

    // const lightHelper = new THREE.PointLightHelper(light, 1, 0xffffff);
    // scene.add(lightHelper);
}

// Posisi dari semua lampu
const lightPositions = [
    [0.5, 4, 13.8],
    [-8.75, 4, 19],
    [-21, 4, 20],
    [-26, 4.5, 7],
    [14, 4, 28],
    [17, 4, 3]
];

for(var i = 0; i < lightPositions.length; i++){
  for(var j = 0; j < 3; j++){
    lightPositions[i][j] = lightPositions[i][j]*0.2
  }
}

// Buat semua lampu berdasarkan posisi yang diberikan
lightPositions.forEach(position => {
    createLight(position);
});


// Others
// scene.fog = new THREE.Fog(0x88939e, 100, 250);
// let stagSpeed = 0.1;
// let rotateStag = false;

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

// Resize
window.addEventListener("resize", () => {
  sizes.height = window.innerHeight;
  sizes.width = window.innerWidth;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});


// Animate loop
function animate(time) {
  renderer.setClearColor(0x88939e);
  renderer.render(scene, camera);

  const delta = clock.getDelta()*0.2;
  if (mixer2) mixer2.update(delta);
  if (player) {
    // Check if player is defined before updating
    player.update(delta);
  }

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
