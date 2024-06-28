import * as THREE from "three";

export class Player {
  constructor(
    camera,
    controller,
    scene,
    speed,
    adventurerModel,
    adventurerActions,
    renderer,
    enviromentBoundingBox
  ) {
    this.camera = camera;
    this.controller = controller;
    this.scene = scene;
    this.speed = speed;
    this.adventurerModel = adventurerModel;
    this.adventurerActions = adventurerActions;
    this.renderer = renderer;
    this.enviromentBoundingBox = enviromentBoundingBox;
    this.rotationSpeed = Math.PI / 2;
    this.currentRotation = new THREE.Euler(0, 0, 0);
    this.rotationVector = new THREE.Vector3();
    this.cameraBaseOffset = new THREE.Vector3(0, 30, -20.5); // For TPP
    this.cameraHeadOffset = new THREE.Vector3(0, 30, 0); // For FPP
    this.zoomLevel = 0;
    this.zoomIncrement = 5;
    this.camera.positionOffset = this.cameraBaseOffset.clone();
    this.camera.targetOffset = new THREE.Vector3(0, 30, 0);
    this.mouseLookSpeed = 1.5;
    this.cameraRotationY = 0;
    this.cameraRotationZ = 0;
    this.isFpp = false;
    this.isZoomed = false;
    this.camera.setup(this.adventurerModel.position, this.currentRotation);

    this.activeAction = this.adventurerActions["idle"];
    this.activeAction.play();
  }
  checkCollision() {
    const playerBoundingBox = new THREE.Box3().setFromObject(this.adventurerModel);
    for (const boundingBox of this.enviromentBoundingBox) {
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
    //animation
    if(this.checkCollision()) this.controller.keys["forward"] = false;
    if (this.controller.keys["Shift"]) {
      this.switchAnimation(this.adventurerActions["run"]);
    } else if (
      this.controller.keys["Shift"] &&
      (this.controller.keys["forward"] ||
        this.controller.keys["left"] ||
        this.controller.keys["backward"] ||
        this.controller.keys["right"])
    ) {
      this.switchAnimation(this.adventurerActions["run"]);
    } else if (
      this.controller.keys["forward"] ||
      this.controller.keys["left"] ||
      this.controller.keys["backward"] ||
      this.controller.keys["right"]
    ) {
      this.switchAnimation(this.adventurerActions["walk"]);
    } else {
      this.switchAnimation(this.adventurerActions["idle"]);
    }

    //
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
    if (this.controller.keys["fpp"]) {
      this.isFpp = true;
      this.camera.positionOffset.copy(this.cameraHeadOffset); // Set to head position for FPP
    }
    if (this.controller.keys["tpp"]) {
      this.isFpp = false;
      this.camera.positionOffset.copy(this.cameraBaseOffset); // Set to default for TPP
      this.cameraRotationZ = 0;
    }
    if (this.controller.keys["rotateLeft"]) {
      this.cameraRotationY += this.rotationSpeed * dt;
    }
    if (this.controller.keys["rotateRight"]) {
      this.cameraRotationY -= this.rotationSpeed * dt;
    }
    if (this.controller.keys["zoomIn"]) {
      this.zoomLevel -= this.zoomIncrement;
      const zoomFactor = this.zoomLevel * 0.1;
      if (!this.isFpp && -20.5 - zoomFactor < -0) {
        const zoomedOffset = new THREE.Vector3(0, 30, -20.5 - zoomFactor);
        this.camera.positionOffset.copy(zoomedOffset);
      }
    }
    if (this.controller.keys["zoomOut"]) {
      this.zoomLevel += this.zoomIncrement;
      if (!this.isFpp) {
        const zoomFactor = this.zoomLevel * 0.1;
        const zoomedOffset = new THREE.Vector3(0, 30, -20.5 - zoomFactor);
        this.camera.positionOffset.copy(zoomedOffset);
      }
    }
    if (this.controller.keys["resetZoom"]) {
      this.zoomLevel = 0;
      if (this.isFpp) this.camera.positionOffset.copy(this.cameraHeadOffset);
      else this.camera.positionOffset.copy(this.cameraBaseOffset);
    }
    const headTiltSpeed = 0.1;
    if (this.isFpp) {
      if (this.controller.keys["tiltLeft"]) {
        this.cameraRotationZ = Math.min(
          this.cameraRotationZ + this.rotationSpeed * dt,
          15 * (Math.PI / 180)
        );
      }

      if (this.controller.keys["tiltRight"]) {
        this.cameraRotationZ = Math.max(
          this.cameraRotationZ - this.rotationSpeed * dt,
          -15 * (Math.PI / 180)
        );
      }
    }
    this.currentRotation.z = THREE.MathUtils.lerp(
      this.currentRotation.z,
      this.cameraRotationZ,
      headTiltSpeed
    );

    if (this.controller.mouseDown) {
      var dtMouse = this.controller.deltaMousePos;
      dtMouse.x = dtMouse.x / Math.PI;
      dtMouse.y = dtMouse.y / Math.PI;

      this.rotationVector.y += dtMouse.x * 100000 * dt;
      this.camera.targetOffset.y -= dtMouse.y * verticalMouseLookSpeed;
      this.camera.targetOffset.y = THREE.MathUtils.clamp(
        this.camera.targetOffset.y,
        0,
        60
      );
    }

    this.currentRotation.y += this.rotationVector.y * dt;
    this.currentRotation.z += this.rotationVector.z * dt;

    // Reset
    this.rotationVector.set(0, 0, 0);

    // Apply player rotation to direction vector
    direction.applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.currentRotation.y
    );

    if (this.isFpp) {
      // Apply camera rotation in FPP
      direction.applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.cameraRotationY
      );
    }

    this.adventurerModel.position.add(direction);
    this.adventurerModel.rotation.copy(this.currentRotation);
    this.camera.setup(
      this.adventurerModel.position,
      this.currentRotation,
      this.cameraRotationY,
      this.isFpp,
      this.cameraRotationZ,
      this.zoomLevel
    );
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
    this.mousePos = new THREE.Vector2();
    this.mouseDown = false;
    this.deltaMousePos = new THREE.Vector2();
    this.camera = camera;

    document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
    document.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
    document.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
    document.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
  }

  onMouseDown(event) {
    this.mouseDown = true;
  }

  onMouseUp(event) {
    this.mouseDown = false;
  }

  onMouseMove(event) {
    var currentMousePos = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    this.deltaMousePos.subVectors(currentMousePos, this.mousePos);
    this.mousePos.copy(currentMousePos);

    this.deltaMousePos.y *= -100;
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
      case "+":
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
      case "+":
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

    if (!isFpp) {
      temp.applyAxisAngle(
        new THREE.Vector3(0, 0, 1),
        rotation.z + cameraRotationZ
      );
    }

    const zoomFactor = zoomLevel * 0.1;

    if (isFpp) {
      temp.set(target.x, target.y + 30, target.z - zoomFactor);
    } else {
      temp.add(target);
    }

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
