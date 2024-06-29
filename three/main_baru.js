import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Player, PlayerController, ThirdPersonCamera } from "./person.js";
import { Ghost, GhostController, GhostCamera } from "./ghost.js";
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
// new RGBELoader()
// 	.setPath( '' )
// 	.load( 'kloppenheim_02_puresky_8k.hdr', function ( texture ) {

// 		texture.mapping = THREE.EquirectangularReflectionMapping;

// 		scene.background = texture;
// 		scene.environment = texture;

// 	} );
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;
skyUniforms['sunColor'] = { value: new THREE.Color(0x4f0025) };

const parameters = {
  inclination: 0, // Position of the sun (0 = midnight, 0.5 = noon)
  azimuth: 0.25, // Position of the sun around the sky
};

const sunColorNight = new THREE.Color(0x000000); // Black color for night
const sunColorEarlyNight = new THREE.Color(0x222222); // Dark grey for early night
const sunColorDawnDusk = new THREE.Color(0xffd1a4); // Orange color for dawn and dusk
const sunColorDay = new THREE.Color(0x4f0025); // White color for day

// Function to update the sky based on parameters
function updateSky() {
  const theta = Math.PI * (parameters.inclination - 0.5);
  const phi = 2 * Math.PI * (parameters.azimuth - 0.5);

  sun.x = Math.cos(phi);
  sun.y = Math.sin(phi) * Math.sin(theta);
  sun.z = Math.sin(phi) * Math.cos(theta);

  sky.material.uniforms['sunPosition'].value.copy(sun);

  // Interpolate sun color based on inclination
  if (parameters.inclination < 0.125) {
    // Night to early night
    const t = parameters.inclination / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorNight, sunColorEarlyNight, t);
  } else if (parameters.inclination < 0.25) {
    // Early night to dawn
    const t = (parameters.inclination - 0.125) / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorEarlyNight, sunColorDawnDusk, t);
  } else if (parameters.inclination < 0.5) {
    // Dawn to day
    const t = (parameters.inclination - 0.25) / 0.25;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorDawnDusk, sunColorDay, t);
  } else if (parameters.inclination < 0.75) {
    // Day to dusk
    const t = (parameters.inclination - 0.5) / 0.25;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorDay, sunColorDawnDusk, t);
  } else if (parameters.inclination < 0.875) {
    // Dusk to early night
    const t = (parameters.inclination - 0.75) / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorDawnDusk, sunColorEarlyNight, t);
  } else {
    // Early night to night
    const t = (parameters.inclination - 0.875) / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorEarlyNight, sunColorNight, t);
  }
}

// Initial sky update
updateSky();

const sunLight = new THREE.DirectionalLight(0x4f0025, 1);
scene.add(sunLight);

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
    const light = new THREE.PointLight(0xffffff, 5, 3.5);
    light.position.set(...position);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024; // Increase shadow map resolution
    light.shadow.mapSize.height = 1024; // Increase shadow map resolution
    // light.shadow.bias = -0.001; // Reduce shadow acne
    light.shadow.camera.near = 0.5; // Adjust near clipping plane of shadow camera
    light.shadow.camera.far = 500; // Adjust far clipping plane of shadow camera
    light.shadow.camera.top = 200;
    light.shadow.camera.bottom = -200;
    light.shadow.camera.right = 200;
    light.shadow.camera.left = -200;
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

  // Update the sky
  parameters.inclination += 0.0025; // Adjust the speed of the day/night cycle
  if (parameters.inclination >= 1) {
    parameters.inclination = 0; // Reset to start the cycle again
  }
  updateSky();

  // Update sun light position and color
  sunLight.position.copy(sun);
  sunLight.color.copy(sky.material.uniforms['sunColor'].value);

  renderer.render(scene,camera);

  time_prev = time;
  requestAnimationFrame(animate);

}

requestAnimationFrame(animate);
