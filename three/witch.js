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

moveCharacter();
  if (mixer) mixer.update(dt * 0.01); // Update the mixer
