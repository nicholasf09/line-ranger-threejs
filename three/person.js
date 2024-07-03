import * as THREE from "three";

export class Player {
  constructor(
    camera,
    controller,
    scene,
    speed,
    playerModel,
    playerActions,
    renderer,
    enviromentBoundingBox
  ) {
    this.camera = camera;
    this.controller = controller;
    this.scene = scene;
    this.speed = speed;
    this.playerModel = playerModel;
    this.playerActions = playerActions;
    this.renderer = renderer;
    this.enviromentBoundingBox = enviromentBoundingBox;
    this.rotationSpeed = Math.PI / 2;
    this.currentRotation = new THREE.Euler(0, 0, 0);
    this.rotationVector = new THREE.Vector3();
    this.cameraBaseOffset = new THREE.Vector3(0, 2*0.2, -5*0.2); // For TPP
    this.cameraHeadOffset = new THREE.Vector3(0, 2*0.2, 0); // For FPP
    this.zoomLevel = 0;
    this.zoomIncrement = 0.06;
    this.camera.positionOffset = this.cameraBaseOffset.clone();
    this.camera.targetOffset = new THREE.Vector3(0, 2*0.2, 0);
    this.mouseLookSpeed = 1.5;
    this.cameraRotationY = 0;
    this.cameraRotationZ = 0;
    this.cameraRotationX = 0;
    this.xLevel = 0;
    this.isFpp = false;
    this.isZoomed = false;
    this.isZooming = false;
    this.camera.setup(this.playerModel.position, this.currentRotation);

    //Animasi awal idle
    this.activeAction = this.playerActions["idle"];
    this.activeAction.play();
  }
  
  checkCollision() {
    //Buat bounding box dr model char
    const playerBoundingBox = new THREE.Box3().setFromObject(this.playerModel);
    for (const boundingBox of this.enviromentBoundingBox) {
      //Jika menabrak bounding box env
      if (playerBoundingBox.intersectsBox(boundingBox)) {
        return true;
      }
    }
    return false;
  }

  switchAnimation(newAction) {
    if (newAction !== this.activeAction) {
      const previousAction = this.activeAction;
      this.activeAction = newAction;
      previousAction.fadeOut(0.5);
      this.activeAction.reset().fadeIn(0.5).play();
    }
  }

  update(dt) {
    var direction = new THREE.Vector3(0, 0, 0);
    let verticalMouseLookSpeed = this.mouseLookSpeed;
    //Cek collision
    if(this.checkCollision()){
      this.controller.keys["forward"] = false;
      this.controller.keys["left"] = false;
      // this.controller.keys["backward"] = false;
      this.controller.keys["right"] = false;
    } 

    //Update animasi, idle, walk, atau run
    if (this.controller.keys["Shift"]) {
      this.switchAnimation(this.playerActions["run"]);
    } else if (
      this.controller.keys["Shift"] &&
      (this.controller.keys["forward"] ||
        this.controller.keys["left"] ||
        this.controller.keys["backward"] ||
        this.controller.keys["right"])
    ) {
      this.switchAnimation(this.playerActions["run"]);
    } else if (
      this.controller.keys["forward"] ||
      this.controller.keys["left"] ||
      this.controller.keys["backward"] ||
      this.controller.keys["right"]
    ) {
      this.switchAnimation(this.playerActions["walk"]);
    } else {
      this.switchAnimation(this.playerActions["idle"]);
    }

    //Update arah char dan rotasi
    if (this.controller.keys["forward"]) {
      direction.z += this.speed * dt;
    }
    if (this.controller.keys["backward"]) {
      direction.z -= this.speed * dt;
    }
    if (this.controller.keys["left"]) {
      this.currentRotation.y += this.rotationSpeed * dt;
    }
    if (this.controller.keys["right"]) {
      this.currentRotation.y -= this.rotationSpeed * dt;
    }
    if (this.controller.keys["Shift"]) {
      direction.multiplyScalar(2);
    }

//Switch ke kamera FPP
if (this.controller.keys["fpp"]) {
  this.isFpp = true;
  //Set posisi ke head char
  this.camera.positionOffset.copy(this.cameraHeadOffset); 
}

//Switch ke kamera TPP
if (this.controller.keys["tpp"]) {
  this.isFpp = false;
  //Set posisi ke belakang char
  this.camera.positionOffset.copy(this.cameraBaseOffset); 
  this.cameraRotationZ = 0;
}

const maxHeadRotationAngle = 60 * (Math.PI / 180); // Batas rotasi kepala dalam FPP (60 derajat)
const rotationReturnSpeed = 0.1; // Kecepatan kamera kembali ke posisi semula
//_____________________________________ROTASI_________________________________________-
if (this.controller.keys["rotateLeft"]) {
  if (this.isFpp) { //fpp kalo < 60 masih boleh
    this.cameraRotationY = Math.min(this.cameraRotationY + this.rotationSpeed * dt, maxHeadRotationAngle);
  } else { //tpp
    this.cameraRotationY += this.rotationSpeed * dt;
  }
} else if (this.controller.keys["rotateRight"]) {
  if (this.isFpp) { //fpp kalo > -60 boleh
    this.cameraRotationY = Math.max(this.cameraRotationY - this.rotationSpeed * dt, -maxHeadRotationAngle);
  } else { //tpp
    this.cameraRotationY -= this.rotationSpeed * dt;
  }
} else {
   //reset
   this.cameraRotationY = THREE.MathUtils.lerp(this.cameraRotationY, 0, rotationReturnSpeed);
}

//_______________________________________HEAD UP/DOWN______________________________________
const maxHeadRotationAngleX = 45 * (Math.PI / 180); // Batas rotasi kepala dalam FPP (45 derajat) untuk Pitch
if (this.controller.keys["headUp"]) {
  if (this.isFpp) {
    //Rotasi hanya boleh max 45 derajat ke atas
    this.cameraRotationX = Math.max(this.cameraRotationX - this.rotationSpeed * dt, -maxHeadRotationAngleX);
  } else {
    this.cameraRotationX -= this.rotationSpeed * dt;
  }
} else if (this.controller.keys["headDown"]) {
  if (this.isFpp) {
    //Rotasi hanya boleh max 45 derajat ke bawah
    this.cameraRotationX = Math.min(this.cameraRotationX + this.rotationSpeed * dt, maxHeadRotationAngleX);
  } else {
    this.cameraRotationX += this.rotationSpeed * dt;
  }
} else {
  // Jika tidak ditekan, reset kamera ke posisi awal
  this.cameraRotationX = THREE.MathUtils.lerp(this.cameraRotationX, 0, rotationReturnSpeed);
}

let cameraRotation = new THREE.Euler(this.cameraRotationX, this.currentRotation.y, this.currentRotation.z);
    
    //_______________________________________________ZOOM IN/OUT_________________________________________
  if (this.controller.keys["zoomIn"] || this.controller.keys["zoomOut"]) {
    this.isZooming = true; // Set zooming state
    var incr = 0;
    if (this.controller.keys["zoomIn"]){
      incr = -this.zoomIncrement;
    } else { //zoom out
      incr = this.zoomIncrement;
    }
    this.zoomLevel += incr;
    
    if (this.controller.keys["zoomOut"] && this.isFpp){
      this.zoomLevel -= this.zoomIncrement;
    } // kalo fpp cuma bisa zoom in, dikurangi biar ga gerak

    const zoomFactor = this.zoomLevel * 0.1;
    if (!this.isFpp) { //tpp
      const zoomedOffset = new THREE.Vector3(
        0,
        2*0.2 + zoomFactor * this.xLevel,
        -5*0.2 - zoomFactor
      ); 
      this.camera.positionOffset.copy(zoomedOffset);
    }
    else{ //fpp
      const zoomedOffset = new THREE.Vector3(
        0,
        2*0.2 + zoomFactor * this.xLevel,
        0 - zoomFactor
      ); 
      this.camera.positionOffset.copy(zoomedOffset);
      }
  } else { //reset
    this.zoomLevel = 0;
    this.isZooming = false; // Reset zooming state
    if (this.isFpp) {
      this.camera.positionOffset.copy(this.cameraHeadOffset);
    }
    else {
      this.camera.positionOffset.copy(this.cameraBaseOffset);
    }
  }

    //_______________________________________________HEAD TILT_______________________________________________
    const headTiltSpeed = 0.1;
    const maxTiltAngle = 5 * (Math.PI / 180);

    if (this.isFpp) {
      //Rotasi max 5 derajat
      if (this.controller.keys["tiltLeft"]) {
        this.cameraRotationZ = Math.min(this.cameraRotationZ + this.rotationSpeed * dt, maxTiltAngle);
      } else if (this.controller.keys["tiltRight"]) {
        this.cameraRotationZ = Math.max(this.cameraRotationZ - this.rotationSpeed * dt, -maxTiltAngle);
      } else {
        //Jika tidak ditekan, reset kamera ke posisi awal
        if (this.cameraRotationZ > 0) {
          this.cameraRotationZ = Math.max(this.cameraRotationZ - this.rotationSpeed * dt, 0);
        } else if (this.cameraRotationZ < 0) {
          this.cameraRotationZ = Math.min(this.cameraRotationZ + this.rotationSpeed * dt, 0);
        }
      }
    }

    this.currentRotation.z = THREE.MathUtils.lerp(this.currentRotation.z,this.cameraRotationZ,headTiltSpeed);
    this.currentRotation.y += this.rotationVector.y * dt;
    this.currentRotation.z += this.rotationVector.z * dt;

    // Reset
    this.rotationVector.set(0, 0, 0);

    //Rotasi karakter ke arah lihat
    direction.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.currentRotation.y
    );

    if (this.isFpp) {
      //Rotasi kamera untuk arah lihat
      direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.cameraRotationY
      );
    }

    this.playerModel.position.add(direction);
    this.playerModel.rotation.copy(this.currentRotation);
    this.camera.setup(this.playerModel.position, cameraRotation, this.cameraRotationY, this.isFpp, this.cameraRotationZ, this.zoomLevel);
  }

}

export class PlayerController {
  constructor(camera) {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      Shift: false,
      fpp: false,
      tpp: false,
      tiltLeft: false,
      tiltRight: false,
      rotateLeft: false,
      rotateRight: false,
      zoomIn: false,
      zoomOut: false,
      resetZoom: false,
    };
    this.camera = camera;

    document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
  }

  onKeyDown(event) {
    switch (event.key) {
      case "W":
      case "w":
        this.keys["forward"] = true;
        break;
      case "S":
      case "s":
        this.keys["backward"] = true;
        break;
      case "A":
      case "a":
        this.keys["left"] = true;
        break;
      case "D":
      case "d":
        this.keys["right"] = true;
        break;
      case "R":
      case "r":
        this.keys["resetZoom"] = true;
        break;
      case "F":
      case "f":
        this.keys["fpp"] = !this.keys["fpp"];
        this.keys["tpp"] = false;
        break;
      case "T":
      case "t":
        this.keys["tpp"] = !this.keys["tpp"];
        this.keys["fpp"] = false;
        break;

      case "Shift":
        this.keys["Shift"] = true;
        break;
      case "ArrowUp":
        this.keys["tiltLeft"] = true;
        break;
      case "ArrowDown":
        this.keys["tiltRight"] = true;
        break;
      case "ArrowLeft":
        this.keys["rotateLeft"] = true;
        break;
      case "ArrowRight":
        this.keys["rotateRight"] = true;
        break;
      case "U":
      case "u":
        this.keys["headUp"] = true;
        break;
      case "I":
      case "i":
        this.keys["headDown"] = true;
        break;
      case "=":
        this.keys["zoomIn"] = true;
        break;
      case "-":
        this.keys["zoomOut"] = true;
        break;
    }
  }

  onKeyUp(event) {
    switch (event.key) {
      case "W":
      case "w":
        this.keys["forward"] = false;
        break;
      case "S":
      case "s":
        this.keys["backward"] = false;
        break;
      case "A":
      case "a":
        this.keys["left"] = false;
        break;
      case "D":
      case "d":
        this.keys["right"] = false;
        break;
      case "R":
      case "r":
        this.keys["resetZoom"] = false;
        break;
      case "Shift":
        this.keys["Shift"] = false;
        break;
      case "ArrowUp":
        this.keys["tiltLeft"] = false;
        break;
      case "ArrowDown":
        this.keys["tiltRight"] = false;
        break;
      case "ArrowLeft":
        this.keys["rotateLeft"] = false;
        break;
      case "ArrowRight":
        this.keys["rotateRight"] = false;
        break;
      case "U":
      case "u":
        this.keys["headUp"] = false;
        break;
      case "I":
      case "i":
        this.keys["headDown"] = false;
        break;
      case "=":
        this.keys["zoomIn"] = false;
        break;
      case "-":
        this.keys["zoomOut"] = false;
        break;
    }
  }
}

export class ThirdPersonCamera {
  constructor(camera, positionOffset, targetOffset) {
    this.camera = camera;
    this.positionOffset = positionOffset;
    this.targetOffset = targetOffset;
    this.cameraRotationZ = 0;
  }

  setup(
    target,
    rotation,
    cameraRotationY = 0,
    isFpp = false,
    cameraRotationZ = 0,
    zoomLevel
  ) {
    var temp = new THREE.Vector3();
    temp.copy(this.positionOffset);

    temp.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotation.y + cameraRotationY
    );

    temp.applyAxisAngle(
      new THREE.Vector3(0, 0, 1),
      rotation.z + cameraRotationZ
    );

    temp.add(target);

    this.camera.position.copy(temp);

    if (!isFpp) {
      var lookAtTarget = new THREE.Vector3();
      lookAtTarget.addVectors(target, this.targetOffset);
      this.camera.lookAt(lookAtTarget);
    } else {
      this.camera.rotation.set(
        rotation.x,
        rotation.y + Math.PI - cameraRotationY,
        rotation.z + cameraRotationZ
      );
    }
  }
}