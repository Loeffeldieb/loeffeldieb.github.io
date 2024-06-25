import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
let firstHit; //THREE.object
let intersect = new THREE.Vector3();

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




/**************************************************************************************************************************
                                            Starte Renderer nach Vorbereitungen wenn nötig
***************************************************************************************************************************/


function initialPromise(){
    return new Promise( resolve => {

        const planeGeo = new THREE.PlaneGeometry(10,10,10,10);
        planeGeo.rotateX(-Math.PI / 2);
        const plane = new THREE.Mesh(
            planeGeo,
            new THREE.MeshBasicMaterial({color: 0x696969})
        );
        raycasterGroup.add(plane);

        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1,1,1),
          new THREE.MeshNormalMaterial()
        );
        box.position.set(0,0.5,0);
        raycasterGroup.add(box);

        scene.add( raycasterGroup );
        resolve(`Ground Plane loaded`);
    });
};

let p = initialPromise();

Promise.all([p]).then( (resolve) => {
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
console.log(machine);

// Unendlichkeits Ebene für den Raycaster nach PLatzierung
const temporaryPlane = new THREE.Plane();

// Hilfslinie für die Roation
let lineForRotation;

/**************************************************************************************************************************
                                           Funktionen
***************************************************************************************************************************/

function loadGLTF(url){
  return new Promise(resolve => {
      new GLTFLoader().load(url,resolve);
  });
};


function updateLine(){
  
};

/**************************************************************************************************************************
                                            Events
***************************************************************************************************************************/

let v1;
let v2;

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
    
    marker.position.copy( firstHit.point );
    quaternionForMarker.setFromUnitVectors( new THREE.Vector3(0,1,0), firstHit.face.normal );
    marker.quaternion.copy ( quaternionForMarker );
    scene.add( marker );

  };//Ende IF intersection

  if(machineIsPlaced){
    raycaster.ray.intersectPlane( temporaryPlane, intersect );

    scene.remove( lineForRotation );
    lineForRotation = new THREE.Line(new THREE.BufferGeometry().setFromPoints([machine.position, intersect]));
    scene.add( lineForRotation );

    //Lege Bezugs Vektor fest
    v1 = new THREE.Vector3().subVectors( intersect, machine.position );
    v2 = new THREE.Vector3().crossVectors( v1, temporaryPlane.normal );
    
    
    quaternionForMarker.setFromUnitVectors( new THREE.Vector3(0,1,0), temporaryPlane.normal );
    marker.quaternion.copy ( quaternionForMarker );
    machine.quaternion.copy( quaternionForMarker );

    //machine.rotateOnWorldAxis( temporaryPlane.normal, Math.PI * alpha );
    machine.lookAt( intersect ); // Klappt nicht, weil sich das Objekt dreht

  };

};

// Mouse click Event
window.addEventListener( 'click', onClick );
function onClick( event ) {

  if(buildModeActivated && machineIsPlaced){
    buildModeActivated = false;
    machineIsPlaced = false;
    scene.remove( lineForRotation );
  };


  //Lade Objekte an der Pointer stelle
  if(firstHit && buildModeActivated){
      
      temporaryPlane.setFromNormalAndCoplanarPoint( firstHit.face.normal, firstHit.point); 

      // Setze Objekt basierend auf marker Position
      machine.position.copy( firstHit.point );
      scene.add( machine );
      machineIsPlaced = true;

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

