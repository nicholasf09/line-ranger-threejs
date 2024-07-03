import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Player, PlayerController, ThirdPersonCamera } from "./person.js";
import { Ghost, GhostController, GhostCamera } from "./ghost.js";
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// Clock
const clock = new THREE.Clock();
// Mixers
let farmerMixer, kingMixer, banditMixer, dogMixer, lionFishMixer, frogMixer, witchMixer;
// Player
let player, ghostPlayer, mainPlayer;
// Bounding box
let farmerBoundingBox = null;
let walkBoundingBox = null;
let witchBoundingBox = null;
let enviromentBoundingBox = [];
// Initialize bounding boxes for debugging visualization
let witchBoxHelper;

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


let buildingModel, childBoundingBox, childBBoxHelper;
const buildingLoader = new GLTFLoader();
buildingLoader.load("resources/envreborn rumah.gltf", function (building) {
  buildingModel = building.scene;
  buildingModel.scale.set(0.2, 0.2, 0.2);
  buildingModel.position.set(0, 0, 0);

  buildingModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Create bounding box helper
      childBoundingBox = new THREE.Box3().setFromObject(child);
      childBoundingBox.min.multiply(buildingModel.scale);
      childBoundingBox.max.multiply(buildingModel.scale);
      childBoundingBox.min.add(buildingModel.position);
      childBoundingBox.max.add(buildingModel.position);
      childBBoxHelper = new THREE.Box3Helper(childBoundingBox, 0xff0000);
      
      if(child.parent.name.includes("Blacksmith")){
        childBoundingBox.expandByScalar(-1*0.2);
      }
      if(child.parent.name.includes("Sawmill")){
        childBoundingBox.expandByScalar(-0.9*0.2);
      }

      enviromentBoundingBox.push(childBoundingBox)
      scene.add(childBBoxHelper);
    }
  });

  scene.add(buildingModel);
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
water.receiveShadow = true;

scene.add( water );

//_____________________________LAMPU MERCUSUAR______________________________
const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(0.2*38, 0.2*30, 0.2*-50); // Posisi spotlight
spotLight.angle = Math.PI / 180; // Sudut pancaran cahaya
spotLight.penumbra = 0.02; // Penurunan intensitas cahaya di tepi
spotLight.decay = 1; // Penurunan intensitas cahaya seiring jarak
spotLight.distance = 0; // Jarak maksimum cahaya
spotLight.castShadow = true; // Mengaktifkan bayangan
spotLight.intensity = 500;
scene.add(spotLight);

spotLight.target.position.set(0.2, 0.2*5, 0.2);
scene.add(spotLight.target);

const spotLightHelper = new THREE.SpotLightHelper(spotLight, 0x0F9B34);
scene.add(spotLightHelper);

const lightMercusuar = new THREE.PointLight(0xffffff, 100, 1000);
    lightMercusuar.position.set(0.2*38, 0.2*30, 0.2*-50);
    lightMercusuar.castShadow = true;
    lightMercusuar.shadow.mapSize.width = 1024; // Increase shadow map resolution
    lightMercusuar.shadow.mapSize.height = 1024; // Increase shadow map resolution
    lightMercusuar.shadow.camera.near = 0.5; // Adjust near clipping plane of shadow camera
    lightMercusuar.shadow.camera.far = 500; // Adjust far clipping plane of shadow camera
    lightMercusuar.shadow.camera.top = 200;
    lightMercusuar.shadow.camera.bottom = -200;
    lightMercusuar.shadow.camera.right = 200;
    lightMercusuar.shadow.camera.left = -200;
    scene.add(lightMercusuar);

//_____________________________________LOAD SKY_________________________________________
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
const sunColorEarlyNight = new THREE.Color(0x2f0015); // Darker grey for early night
const sunColorDawnDusk = new THREE.Color(0x4f4f4f); // Darker grey for dawn and dusk
const sunColorDay = new THREE.Color(0x87ceeb); // Light blue for day

const ambientLight = new THREE.AmbientLight(0xadd8e6, 1); 
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 4);
sunLight.position.set(1, 1, 1).normalize();
sunLight.castShadow = true;
scene.add(sunLight);

const sunLightHelper = new THREE.DirectionalLightHelper(sunLight, 0x0F9B34);
scene.add(sunLightHelper);

// Function to update the sky based on parameters
function updateSky() {
  const theta = Math.PI * (parameters.inclination - 0.5);
  const phi = 2 * Math.PI * (parameters.azimuth - 0.5);

  sun.x = Math.cos(phi);
  sun.y = Math.sin(phi) * Math.sin(theta);
  sun.z = Math.sin(phi) * Math.cos(theta);

  sky.material.uniforms['sunPosition'].value.copy(sun);
  sunLight.position.copy(sun).normalize(); // Ensure sunLight follows sun's position

  // Interpolate sun color based on inclination
  if (parameters.inclination < 0.125) {
    // Night to early night
    const t = parameters.inclination / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorNight, sunColorEarlyNight, t);
    sunLight.color.lerpColors(sunColorNight, sunColorEarlyNight, t);
    sunLight.intensity = 0.1 + 0.4 * t; // Smooth intensity transition
    spotLight.intensity = 0;
    lightMercusuar.intensity = 0;
  } else if (parameters.inclination < 0.25) {
    // Early night to dawn
    const t = (parameters.inclination - 0.125) / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorEarlyNight, sunColorDawnDusk, t);
    sunLight.color.lerpColors(sunColorEarlyNight, sunColorDawnDusk, t);
    sunLight.intensity = 0.5 + 0.5 * t; // Smooth intensity transition
    spotLight.intensity = 0;
    lightMercusuar.intensity = 0;
  } else if (parameters.inclination < 0.5) {
    // Dawn to day
    const t = (parameters.inclination - 0.25) / 0.25;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorDawnDusk, sunColorDay, t);
    sunLight.color.lerpColors(sunColorDawnDusk, sunColorDay, t);
    sunLight.intensity = 1.0; // Full intensity during day
    spotLight.intensity = 0;
    lightMercusuar.intensity = 0;
  } else if (parameters.inclination < 0.75) {
    // Day to dusk
    const t = (parameters.inclination - 0.5) / 0.25;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorDay, sunColorDawnDusk, t);
    sunLight.color.lerpColors(sunColorDay, sunColorDawnDusk, t);
    sunLight.intensity = 1.0; // Full intensity during day
    spotLight.intensity = 100;
    lightMercusuar.intensity = 10;
  } else if (parameters.inclination < 0.875) {
    // Dusk to early night
    const t = (parameters.inclination - 0.75) / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorDawnDusk, sunColorEarlyNight, t);
    sunLight.color.lerpColors(sunColorDawnDusk, sunColorEarlyNight, t);
    sunLight.intensity = 0.5 + 0.5 * (1 - t); // Smooth intensity transition
    spotLight.intensity = 100;
    lightMercusuar.intensity = 10;
  } else {
    // Early night to night
    const t = (parameters.inclination - 0.875) / 0.125;
    sky.material.uniforms['sunColor'].value.lerpColors(sunColorEarlyNight, sunColorNight, t);
    sunLight.color.lerpColors(sunColorEarlyNight, sunColorNight, t);
    sunLight.intensity = 0.1; // Very low intensity during night
    spotLight.intensity = 10;
    lightMercusuar.intensity = 10;
  }
}

// // Initial sky update
updateSky();

var tonight = true;

//_______________________________________________LOAD WITCH_____________________________________
const witchLoader = new GLTFLoader();
let witchModel, witchActions;

witchLoader.load("/Farmer.glb", (witch) => {
  witchModel = witch.scene;
  scene.add(witchModel);
  witchModel.scale.set(0.2, 0.2, 0.2);
  witchModel.position.set(20*0.2, 2.05*0.2, 10*0.2);
  witchModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Membuat bounding box
  witchBoundingBox = new THREE.Box3()
  witchBoxHelper = new THREE.Box3Helper(witchBoundingBox, 0x0000ff); // Blue for witch
  scene.add(witchBoxHelper);

  const clips = witch.animations;
  witchMixer = new THREE.AnimationMixer(witchModel);
  witchActions = {
    idle: witchMixer.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Idle")
    ),
    walk: witchMixer.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Walk")
    ),
    run: witchMixer.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Run")
    ),
    wave: witchMixer.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Wave")
    ),
    interact: witchMixer.clipAction(
      THREE.AnimationClip.findByName(clips, "CharacterArmature|Interact")
    ),
    death: witchMixer.clipAction(
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
    0.5,
    witchModel,
    witchActions,
    renderer,
    enviromentBoundingBox
  );
  mainPlayer = player;
}

//______________________________LOAD FARMER_____________________________
const farmerLoader = new GLTFLoader();
let farmerModel;

farmerLoader.load("/Witch.glb", (farmer) => {
  farmerModel = farmer.scene;
  scene.add(farmerModel);
  farmerModel.scale.set(0.2, 0.2, 0.2);
  farmerModel.position.set(-21*0.2, 1.95*0.2, 24*0.2);
  farmerModel.rotation.y = THREE.MathUtils.degToRad(120);
  farmerModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Create bounding box helper
      childBoundingBox = new THREE.Box3().setFromObject(child);
      childBoundingBox.min.multiply(farmerModel.scale);
      childBoundingBox.max.multiply(farmerModel.scale);
      childBoundingBox.min.add(farmerModel.position);
      childBoundingBox.max.add(farmerModel.position);
      childBBoxHelper = new THREE.Box3Helper(childBoundingBox, 0xff0000);
      enviromentBoundingBox.push(childBoundingBox)
      scene.add(childBBoxHelper);
    }
  });

  const clips = farmer.animations;
  farmerMixer = new THREE.AnimationMixer(farmerModel);
  const wavingClip = THREE.AnimationClip.findByName(clips, "CharacterArmature|Wave");

  if (wavingClip) {
    const wavingAction = farmerMixer.clipAction(wavingClip);
    wavingAction.setLoop(THREE.LoopRepeat);
    wavingAction.play();
  } 
});

//______________________________LOAD KING_____________________________
const kingLoader = new GLTFLoader();
let kingModel;

kingLoader.load("/King.glb", (king) => {
  kingModel = king.scene;
  scene.add(kingModel);
  kingModel.scale.set(0.2, 0.2, 0.2);
  kingModel.position.set(-1*0.2, 2.2*0.2, 26*0.2);
  kingModel.rotation.y = THREE.MathUtils.degToRad(225);
  kingModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Create bounding box helper
      childBoundingBox = new THREE.Box3().setFromObject(child);
      childBoundingBox.min.multiply(kingModel.scale);
      childBoundingBox.max.multiply(kingModel.scale);
      childBoundingBox.min.add(kingModel.position);
      childBoundingBox.max.add(kingModel.position);
      childBBoxHelper = new THREE.Box3Helper(childBoundingBox, 0xff0000);
      enviromentBoundingBox.push(childBoundingBox)
      scene.add(childBBoxHelper);
    }
  });

  const clips = king.animations;
  kingMixer = new THREE.AnimationMixer(kingModel);
  const wavingClip = THREE.AnimationClip.findByName(clips, "CharacterArmature|Kick_Right");

  if (wavingClip) {
    const wavingAction = kingMixer.clipAction(wavingClip);
    wavingAction.setLoop(THREE.LoopRepeat);
    wavingAction.play();
  } 
});

//______________________________LOAD Bandit_____________________________
const banditLoader = new GLTFLoader();
let banditModel;

banditLoader.load("/Bandit.glb", (bandit) => {
  banditModel = bandit.scene;
  scene.add(banditModel);
  banditModel.scale.set(0.2, 0.2, 0.2);
  banditModel.position.set(-1.8*0.2, 2.2*0.2, 25*0.2);
  banditModel.rotation.y = THREE.MathUtils.degToRad(60);
  banditModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Create bounding box helper
      childBoundingBox = new THREE.Box3().setFromObject(child);
      childBoundingBox.min.multiply(banditModel.scale);
      childBoundingBox.max.multiply(banditModel.scale);
      childBoundingBox.min.add(banditModel.position);
      childBoundingBox.max.add(banditModel.position);
      childBBoxHelper = new THREE.Box3Helper(childBoundingBox, 0xff0000);
      enviromentBoundingBox.push(childBoundingBox)
      scene.add(childBBoxHelper);
    }
  });

  const clips = bandit.animations;
  banditMixer = new THREE.AnimationMixer(banditModel);
  const wavingClip = THREE.AnimationClip.findByName(clips, "CharacterArmature|Punch_Right");

  if (wavingClip) {
    const wavingAction = banditMixer.clipAction(wavingClip);
    wavingAction.setLoop(THREE.LoopRepeat);
    wavingAction.play();
  } 
});

//______________________________LOAD DOG_____________________________
const dogLoader = new GLTFLoader();
let dogModel;

dogLoader.load("/Shiba Inu.glb", (dog) => {
  dogModel = dog.scene;
  scene.add(dogModel);
  dogModel.scale.set(0.05, 0.05, 0.05);
  dogModel.position.set(18*0.2, 2.2*0.2, 27*0.2);
  dogModel.rotation.y = THREE.MathUtils.degToRad(200);
  dogModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Create bounding box helper
      childBoundingBox = new THREE.Box3().setFromObject(child);
      childBoundingBox.min.multiply(dogModel.scale);
      childBoundingBox.max.multiply(dogModel.scale);
      childBoundingBox.min.add(dogModel.position);
      childBoundingBox.max.add(dogModel.position);
      childBBoxHelper = new THREE.Box3Helper(childBoundingBox, 0xff0000);
      enviromentBoundingBox.push(childBoundingBox)
      scene.add(childBBoxHelper);
    }
  });

  const clips = dog.animations;
  dogMixer = new THREE.AnimationMixer(dogModel);
  const wavingClip = THREE.AnimationClip.findByName(clips, "Idle_2_HeadLow");

  if (wavingClip) {
    const wavingAction = dogMixer.clipAction(wavingClip);
    wavingAction.setLoop(THREE.LoopRepeat);
    wavingAction.play();
  } 
});

//______________________________LOAD lionFish_____________________________
const lionFishLoader = new GLTFLoader();
let lionFishModel;

lionFishLoader.load("/Lionfish.glb", (lionFish) => {
  lionFishModel = lionFish.scene;
  scene.add(lionFishModel);
  lionFishModel.scale.set(0.02, 0.02, 0.02);
  lionFishModel.position.set(-24*0.2, 2*0.2, 10*0.2);
  lionFishModel.rotation.y = THREE.MathUtils.degToRad(60);
  lionFishModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Create bounding box helper
      childBoundingBox = new THREE.Box3().setFromObject(child);
      childBoundingBox.min.multiply(lionFishModel.scale);
      childBoundingBox.max.multiply(lionFishModel.scale);
      childBoundingBox.min.add(lionFishModel.position);
      childBoundingBox.max.add(lionFishModel.position);
      childBBoxHelper = new THREE.Box3Helper(childBoundingBox, 0xff0000);
      enviromentBoundingBox.push(childBoundingBox)
      scene.add(childBBoxHelper);
    }
  });

  const clips = lionFish.animations;
  lionFishMixer = new THREE.AnimationMixer(lionFishModel);
  const wavingClip = THREE.AnimationClip.findByName(clips, "Fish_Armature|Out_Of_Water");

  if (wavingClip) {
    const wavingAction = lionFishMixer.clipAction(wavingClip);
    wavingAction.setLoop(THREE.LoopRepeat);
    wavingAction.play();
  } 
});

//______________________________LOAD FROG_____________________________
const frogLoader = new GLTFLoader();
let frogModel;

frogLoader.load("/Frog.glb", (frog) => {
  frogModel = frog.scene;
  scene.add(frogModel);
  frogModel.scale.set(0.02, 0.02, 0.02);
  frogModel.position.set(18*0.2, 2.2*0.2, 10*0.2);
  frogModel.rotation.y = THREE.MathUtils.degToRad(0);
  frogModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Create bounding box helper
      childBoundingBox = new THREE.Box3().setFromObject(child);
      childBoundingBox.min.multiply(frogModel.scale);
      childBoundingBox.max.multiply(frogModel.scale);
      childBoundingBox.min.add(frogModel.position);
      childBoundingBox.max.add(frogModel.position);
      childBBoxHelper = new THREE.Box3Helper(childBoundingBox, 0xff0000);
      // enviromentBoundingBox.push(childBoundingBox)
      // scene.add(childBBoxHelper);
    }
  });

  const clips = frog.animations;
  frogMixer = new THREE.AnimationMixer(frogModel);
  const wavingClip = THREE.AnimationClip.findByName(clips, "FrogArmature|Frog_Jump");

  if (wavingClip) {
    const wavingAction = frogMixer.clipAction(wavingClip);
    wavingAction.setLoop(THREE.LoopRepeat);
    wavingAction.play();
  } 
});

let frogSpeed = 1*0.002;

//________________________________CREATE GHOST CAM_______________________________
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
    1,
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

//_____________________________________CREATE LIGHT JALAN_______________________________
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

var time_prev = 0;

//______________________________BOTOL TRANSPARAN__________________________
// Geometri dan Material untuk botol kaca
const bottleGeometry = new THREE.ConeGeometry(2, 50, 32);

const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 0,  // This makes the material transparent
    opacity: 0.8,
    reflectivity: 0.6,
    transparent: true,
    side: THREE.DoubleSide,
});

// Membuat botol
const bottle = new THREE.Mesh(bottleGeometry, glassMaterial);
bottle.scale.set(0.4,0.4,0.4);
bottle.position.set(0.2*38, 0.2*30, 0.2*-50);
bottle.position.y = 5*0.04;
const bottleHelper = new THREE.BoxHelper(bottle, 0x8fffff);
// scene.add(bottleHelper);
// scene.add(bottle);

function updateSpotlightTarget(inclination) {
  const radius = 5; // Jarak antara spotlight dan target
  const angle = inclination * Math.PI * 2; // Mengubah inclination menjadi sudut dalam radian

  const x = 0.7*Math.cos(angle*2) * radius;
  const z = 1.7*Math.sin(angle*2) * radius;

  spotLight.target.position.set(x, 0.2*2, z); // Mengatur posisi target dalam bentuk lingkaran
  spotLightHelper.position.set(x, 0.2 * 2, z);;
}

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
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (witchMixer) witchMixer.update(delta);
  if (player) {
    // Check if player is defined before updating
    player.update(delta);
  }

  var dt = time - time_prev;
  dt *= 0.1;

  // Update mixer jika ada animasi
  if (farmerMixer) {
    farmerMixer.update(delta);
  }

  if (kingMixer) {
    kingMixer.update(delta);
  }

  if (banditMixer) {
    banditMixer.update(delta);
  }

  if (lionFishMixer) {
    lionFishMixer.update(delta);
  }

  if (dogMixer) {
    dogMixer.update(delta);
  }

  if(frogMixer){
    frogMixer.update(delta);
  }

  if(frogModel){
    frogModel.position.z += frogSpeed;
    if(frogModel.position.z >= 20*0.2){
      frogModel.rotation.y = THREE.MathUtils.degToRad(180);
      frogSpeed *= -1
    } else if (frogModel.position.z < 5*0.2) {
      frogModel.rotation.y = THREE.MathUtils.degToRad(0);
      frogSpeed *= -1
    }
  }

  //_____________________________UPDATE WATER______________________________
  water.material.uniforms[ 'time' ].value += 0.10 / 60.0;

  //_____________________________UPDATE SKY_______________________________
  // Update the sky
  if(tonight){
    parameters.inclination += 0.0025; // Adjust the speed of the day/night cycle
    
  }
  else{
    parameters.inclination -= 0.0025; // Adjust the speed of the day/night cycle
  }
  
  if (parameters.inclination >= 1) {
    tonight = false;
  } else if (parameters.inclination <= 0){
    tonight = true;
  }

  updateSpotlightTarget(parameters.inclination * 1.5);
  updateSky();

  // Update sun light position and color
  sunLight.position.copy(sun);
  sunLight.color.copy(sky.material.uniforms['sunColor'].value);

  //__________________________________UPDATE BOUNDING BOX & HELPER WITCH_______________________
  // Update bounding boxes and helpers for the witch
  if (witchModel && witchBoundingBox) {
    witchBoundingBox.setFromObject(witchModel);
    scene.remove(witchBoxHelper);
    witchBoxHelper = new THREE.Box3Helper(
      witchBoundingBox,
      0x0000ff
    );
    scene.add(witchBoxHelper);
  }

  time_prev = time;
}

requestAnimationFrame(animate);