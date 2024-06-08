import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let renderer, scene, camera;

let spotLight, lightHelper;

init();

function init() {

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;


    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    renderer.setAnimationLoop( render );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 7, 4, 1 );

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set( 0, 1, 0 );
    controls.update();

    const ambient = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 0.15 );
    scene.add( ambient );

    const loader = new THREE.TextureLoader().setPath( 'textures/' );
    const filenames = [ 'disturb.jpg', 'colors.png', 'uv_grid_opengl.jpg' ];

    const textures = { none: null };

    for ( let i = 0; i < filenames.length; i ++ ) {

        const filename = filenames[ i ];

        const texture = loader.load( filename );
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        textures[ filename ] = texture;

    }

    spotLight = new THREE.SpotLight( 0xffffff, 100 );
    spotLight.position.set( 2.5, 5, 2.5 );
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 1;
    spotLight.decay = 2;
    spotLight.distance = 0;

    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.focus = 1;
    scene.add( spotLight );

    lightHelper = new THREE.SpotLightHelper( spotLight );
    scene.add( lightHelper );

    //

    const geometry = new THREE.PlaneGeometry( 200, 200 );
    const material = new THREE.MeshLambertMaterial( { color: 0xbcbcbc } );

    const mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( 0, - 1, 0 );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function render() {

    const time = performance.now() / 3000;

    spotLight.position.x = Math.cos( time ) * 2.5;
    spotLight.position.z = Math.sin( time ) * 2.5;

    lightHelper.update();

    renderer.render( scene, camera );

}