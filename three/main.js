import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

//setup Scene and Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,window.innerWidth
  /window.innerHeight,0.1,1000);
camera.position.set(0,0,100);
camera.lookAt(0,0,0);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,5,0)
controls.update()

//LIGHT
//Directional light
var color = 0xFFFFF;
var light = new THREE.DirectionalLight(color, 0.5)
light.position.set(0,10,0);
light.target.position.set(-5,0,0)
scene.add(light)
scene.add(light.target)

// Hemisphere light
light = new THREE.HemisphereLight(0xB1E1FF,0xB97A20,0.5)
scene.add(light)

// Point light
light = new THREE.PointLight(0xFFFF00, 50)
light.position.set(10,10,0)
scene.add(light)

//Spot light
light = new THREE.SpotLight(0xFF0000, 50)
light.position.set(10,10,10)
scene.add(light)

//Geometry
const objects = [];

//Planet
{
  var planetGeo = new THREE.PlaneGeometry(40,40);
  var planetMat = new THREE.MeshPhongMaterial({color: '#8AC'});
  var mesh = new THREE.Mesh(planetGeo,planetMat)
  mesh.rotation.x = Math.PI * -0.5;
  scene.add(mesh);
}

//Cube
{
  var cubeGeo = new THREE.BoxGeometry(4,4,4);
  var cubeMat = new THREE.MeshPhongMaterial({color: '#8AC'})
  mesh = new THREE.Mesh(cubeGeo, cubeMat)
  mesh.position.set(5,3.5,8)
  scene.add(mesh)
}

//Sphere
{
  var sphereGeo = new THREE.SphereGeometry(3,32,16)
  var sphereMat = new THREE.MeshPhongMaterial({color: '#CAB'})
  mesh = new THREE.Mesh(sphereGeo,sphereMat)
  mesh.position.set(-4,-5,0)
  scene.add(mesh)
}

const onProgress = function ( xhr ) {

  if ( xhr.lengthComputable ) {

    const percentComplete = xhr.loaded / xhr.total * 100;
    console.log( percentComplete.toFixed( 2 ) + '% downloaded' );

  }

};



new MTLLoader()
					.setPath( 'resources/' )
					.load( 'magic_book_OBJ.mtl', function ( materials ) {

						materials.preload();

						new OBJLoader()
							.setMaterials( materials )
							.setPath( 'resources/' )
							.load( 'magic_book_OBJ.obj', function ( object ) {
								scene.add( object );

							}, onProgress );

} );

new MTLLoader()
					.setPath( 'resources/' )
					.load('',function ( materials ) {

						materials.preload();

						new OBJLoader()
							.setMaterials( materials )
							.setPath( 'resources/' )
							.load( 'Kids_Room.obj', function ( object ) {
								scene.add( object );

							}, onProgress );

} );

//sun
var radius = 1;
var widthSegments = 12;
var heightSegments = 3;
var geometry = new THREE.SphereGeometry(radius,widthSegments
  ,heightSegments);
var material = new THREE.MeshBasicMaterial({color:0xffff00});
var sun = new THREE.Mesh(geometry,material);
scene.add(sun);
objects.push(sun);

//earth
radius = 0.33;
widthSegments = 12;
heightSegments = 3;
geometry = new THREE.SphereGeometry(radius,widthSegments
  ,heightSegments);
material = new THREE.MeshBasicMaterial({color:0x00AAFF});
var earth = new THREE.Mesh(geometry,material);
earth.position.x = 2;
scene.add(earth);
objects.push(earth);

sun.add(earth);

var time_prev = 0;
function animate(time){
  var dt = time - time_prev;
  dt *= 0.1;

  objects.forEach((obj)=>{
    obj.rotation.z += dt * 0.01;
  });

  renderer.render(scene,camera);

  time_prev = time;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

