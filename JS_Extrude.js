import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//XR Spezifisch
import { XRButton } from 'three/addons/webxr/XRButton.js';


/**************************************************************************************************************************
                                            Three.js Setup   Initialisierung
***************************************************************************************************************************/

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );  //  <-----
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = false;                                                    //  <-----

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xffffff );

//Kamera (FoV, AR, Near, Far Render Distance)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 3, 10);
camera.lookAt(0,0,0);
camera.updateProjectionMatrix();

const light = new THREE.DirectionalLight(0xFFFFFF, 3);
light.position.set(0, 10, 0);
light.target.position.set(-5, 0, 0);
scene.add(light);
scene.add(light.target);

document.body.appendChild( renderer.domElement );


//Orbit Controls (Bewegen der Szene mit Maus)
let orbitControls;
orbitControls = new OrbitControls( camera, renderer.domElement );
orbitControls.target.set( 0, 1.6, 0 );
orbitControls.update();


//Starte XR mit Button
const sessionInit = {
    optionalFeatures: [ 
        'hand-tracking',
        'hit-test'
        ]
};

//document.body.appendChild(XRButton.createButton(renderer, sessionInit));      // <-----




/**************************************************************************************************************************
                                            Zusätzliche Setups
***************************************************************************************************************************/


// Raycaser für die Maus
const raycaster = new THREE.Raycaster();

// Maus Pointer für späteres abtasten
const pointer = new THREE.Vector3(0,0,0);

// Speicher Orte für vom Raycaster getroffene Objekte
const raycasterGroup = new THREE.Group();
const intersect = new THREE.Vector3();
let firstHit; //THREE.object
let normalWorldSpace;

// Quaternion für die Drehung des Objektes im Raum
const quaternionForMarker = new THREE.Quaternion();

// Flags für die Platzierung des Objektes
let buildModeActivated = false;
let machineIsPlaced = false;

// Variablen für die Hand Erkennung und Controller
let controller;

// Standard Controller
controller = renderer.xr.getController( 0 );
scene.add( controller );


// EXTRA Zeug für die Plants
let plants = [];
let plant;
let tempObj;



/**************************************************************************************************************************
                                            Starte Renderer nach Vorbereitungen wenn nötig
***************************************************************************************************************************/


function setupPromise(){
    return new Promise( resolve => {

        const planeGeo = new THREE.PlaneGeometry(10,10,10,10);
        planeGeo.rotateX(-Math.PI / 2);
        const plane = new THREE.Mesh(
            planeGeo,
            new THREE.MeshBasicMaterial({color: 0x696969})
        );
        raycasterGroup.add(plane);

        const boxGeo = new THREE.BoxGeometry(1,1,1);
        const box = new THREE.Mesh(
          boxGeo,
          new THREE.MeshNormalMaterial()
        );
        box.rotateX( 180/Math.PI*45 );
        box.rotateY( 180/Math.PI*45 );
        box.translateY( -1 );
        raycasterGroup.add(box);

        scene.add( raycasterGroup );
        resolve(`Ground Plane loaded`);
    });
};

let setup = setupPromise();

Promise.all([setup]).then( (resolve) => {
    //Setup
    console.log(resolve[0]);

    //Starte Loop
    renderer.setAnimationLoop(animate);
});



/**************************************************************************************************************************
                                            Animation Loop
***************************************************************************************************************************/


function animate(timestamp, frame) {
    // Rendert Frame
    renderer.render( scene, camera );
};



/**************************************************************************************************************************
                                           Körper
***************************************************************************************************************************/

// Marker für den Zeiger
const markerGeo = new THREE.ConeGeometry( .05, .2, 6 );
markerGeo.translate(0,.1,0);
const marker = new THREE.Mesh(
  markerGeo,
  new THREE.MeshPhongMaterial({
    color: 0xFF0000,
  })
);

// Object was in den Raum gestellt werden soll
const machineGeo = new THREE.BoxGeometry(1,5,0.25);
machineGeo.translate(0.5, 2.5, 0.125);
const machine = new THREE.Mesh(
  machineGeo,
  new THREE.MeshBasicMaterial({
    color: 0xDDDDDD
  })
);

// Unendlichkeits Ebene für den Raycaster nach PLatzierung
const temporaryPlane = new THREE.Plane();

// Hilfslinie für die Roation
let lineForRotation;

/**************************************************************************************************************************
                                           Funktionen
***************************************************************************************************************************/

function loadGLTF( url ){
  return new Promise( resolve => {
    new GLTFLoader().load( url, resolve) ;
  });
};

function loadOBJ( url ){
  return new Promise( resolve => {
    new OBJLoader().load( url, resolve );
  });
};

function loadOBJ2( url1, url2 ){

  return new Promise( resolve => {
    let objl = new OBJLoader();
    new MTLLoader().load( url1, mtl => {
      mtl.preload();
      objl.setMaterials( mtl );
    });
    objl.load( url2, resolve);
  });

};
/**************************************************************************************************************************
                                            Events
***************************************************************************************************************************/

// Select Event 
controller.addEventListener( 'select', onSelect );
function onSelect(){
   
};

// Mouse Move Event
window.addEventListener( 'pointermove', onPointerMove );
function onPointerMove( event ) {
  
  // Aktualisisere Maus Position (Normalisiert)
  pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1; 
  pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // Raycasting und speichern der getroffenen Objekte
  raycaster.setFromCamera( pointer, camera );
  firstHit = raycaster.intersectObjects( raycasterGroup.children )[0];

  // Setze Marker auf Kollisions Punkt
  if(firstHit){

    // Transformiere die getroffene Fläche in den World Space
    normalWorldSpace = firstHit.face.normal.clone().transformDirection( firstHit.object.matrixWorld ).normalize();
    
    // Richte den MArker passend zur Fläche aus
    marker.position.copy( firstHit.point );
    quaternionForMarker.setFromUnitVectors( new THREE.Vector3(0,1,0), normalWorldSpace );
    marker.quaternion.copy ( quaternionForMarker );
    scene.add( marker );

  };//Ende IF intersection

  if(machineIsPlaced){

    raycaster.ray.intersectPlane( temporaryPlane, intersect );

    // scene.remove( lineForRotation );
    // lineForRotation = new THREE.Line(new THREE.BufferGeometry().setFromPoints([machine.position, intersect]));
    // scene.add( lineForRotation );

    scene.remove( lineForRotation );
    lineForRotation = new THREE.Line(new THREE.BufferGeometry().setFromPoints([plant.position, intersect]));
    scene.add( lineForRotation );

    quaternionForMarker.setFromUnitVectors( new THREE.Vector3(0,1,0), temporaryPlane.normal );
    marker.quaternion.copy ( quaternionForMarker );

    // machine.up = temporaryPlane.normal;
    // machine.lookAt( intersect );

    plant.up = temporaryPlane.normal;
    plant.lookAt( intersect );

  };

};

// Mouse click Event
window.addEventListener( 'click', onClick );
function onClick( event ) {

  if( buildModeActivated && machineIsPlaced ){
    buildModeActivated = false;
    machineIsPlaced = false;
    plant = null;
    scene.remove( lineForRotation );
  };


  //Lade Objekte an der Pointer stelle
  if( firstHit && buildModeActivated ){
    
    // Erstelle Ebene für die Rotation
    temporaryPlane.setFromNormalAndCoplanarPoint( normalWorldSpace, firstHit.point);
    
    // Setze Objekt basierend auf marker Position
    //machine.position.copy( firstHit.point );
    //scene.add( machine );
    //machineIsPlaced = true;

    //Platziert Blumen 
    let rnd = (Math.random()*10) | 0;
    loadOBJ2(`../obj/${rnd}/${rnd}.mtl`, `../obj/${rnd}/${rnd}.obj`).then( resolve => {
      plant = resolve;
      plant.scale.set( 0.01,0.01,0.01 );
      plant.position.copy( firstHit.point );
      plant.name = "plant";
      plants.push( plant );
      scene.add( plant );
      machineIsPlaced = true;
    });

  };//Ende IF intersection

};

// Keyboard Events
window.addEventListener( 'keyup', manageKeyEvent)
function manageKeyEvent(event){

  switch (event.key){
    case 'b':
      buildModeActivated = !buildModeActivated;
      console.log(`Bau Modus ist ${buildModeActivated?'an':'aus'}`);
    break;
    case 'r':
      buildModeActivated = false;
      machineIsPlaced = false;
      plant = null;
      for(let i=plants.length; i >= 0; i--){
        let obj = plants[i];
        scene.remove(obj);
        plants.splice(i,1)
      };
      scene.remove( machine );
      scene.remove( lineForRotation )
    break;
    default:
    break;
  };

};



/**************************************************************************************************************************
                                            Window Resize Event
***************************************************************************************************************************/

addEventListener("resize", (event) => {
    if(renderer.xr.enabled === false){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix()
        renderer.setSize( window.innerWidth, window.innerHeight );
    };
});

