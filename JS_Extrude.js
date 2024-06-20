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
const pointer = new THREE.Vector2(0,0);

// Speicher Orte für vom Raycaster getroffene Objekte
const raycasterGroup = new THREE.Group();
let firstHit; 

// Quaternion für die Drehung des Objektes im Raum
const markerQuaternion = new THREE.Quaternion();

// Flags für die Platzierung des Objektes
const machinePlaced = false;
const machineRoteted = false;

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
            new THREE.MeshNormalMaterial({
              wireframe: true
            })
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

    // Animationen
    
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
    color: 0xEEEEEE,
    opacity: 0.5
  })
);

/**************************************************************************************************************************
                                           Funktionen
***************************************************************************************************************************/

function loadGLTF(url){
    return new Promise(resolve => {
        new GLTFLoader().load(url,resolve);
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

  //Lade Objekte an der Pointer stelle
  if(firstHit){
    
    // Setze neuen Marker
    marker.position.copy( firstHit.point );
    markerQuaternion.setFromUnitVectors( new THREE.Vector3(0,1,0) , firstHit.face.normal);
    marker.quaternion.copy ( markerQuaternion );
    scene.add( marker );

};//Ende IF intersection

};

// Mouse click Event
window.addEventListener( 'click', onClick );
function onClick( event ) {
  //Lade Objekte an der Pointer stelle
  if(firstHit){
      
      // Setze Objekt basierend auf marker Position
      machine.quaternion.copy( markerQuaternion );
      machine.position.copy( firstHit.point );
      scene.add( machine );

  };//Ende IF intersection
  
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


// Zeichnet Linie ausgehend vom Controller
/*
const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
const line = new THREE.Line( geometry );
line.name = 'line';
line.scale.z = 5;
controller.add( line.clone() );
*/

//obj.position.set(0,0,-Math.random()*5).applyMatrix4( controller.matrixWorld );
//obj.quaternion.setFromRotationMatrix( controller.matrixWorld ); //Drehung im Moment Deaktiviert

// Alte MArker Klasser zum binär State testen
/*
const marker = {
  isSet: 0b000,
  planeVector: {
    a: new THREE.Vector3(0,0,0),
    b: new THREE.Vector3(0,0,0),
    c: new THREE.Vector3(0,0,0)
  },
  setMarker: function(pos){
    let c = 0x000000;

    switch(this.isSet){
      case 0b000:
        c = 0xFF0000;
        this.isSet ^= 0b001;
        this.planeVector.a = pos;
        break;
      case 0b001:
        c = 0x00FF00;
        this.isSet ^= 0b010;
        this.planeVector.b = pos;
        break;
      case 0b011:
        c = 0x0000FF;
        this.isSet ^= 0b100;
        this.planeVector.c = pos;
        break;
      case 0b111:
        c = 0xFFFF00;
        this.isSet ^= 0b111;
        break;
      default: 
        c = 0x000000;
        this.isSet = 0b000;
        break;
    };

    const markerBody = new THREE.Mesh(
      new THREE.SphereGeometry(.05),
      new THREE.MeshBasicMaterial({
        color: c
      })
    );
    markerBody.name = 'marker';
    return markerBody;
  } 
};
*/


// Alte Marker Bedingungen 
// Zeiche Dreieck durch die Punkte
/*
if(marker.isSet == 0b111){

  let v1 = new THREE.Vector3().subVectors(marker.planeVector.b, marker.planeVector.a);;
  let v2 = new THREE.Vector3().subVectors(marker.planeVector.c, marker.planeVector.a);
  let v3 = new THREE.Vector3().crossVectors(v1,v2);
  v3.normalize();
  let groundNormal = new THREE.Vector3(0,1,0);

  let tri = new THREE.Mesh(
    new THREE.PlaneGeometry(5,5,1,1),
    new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
    })
  );
  tri.name = 'marker';
  if(v3.dot( groundNormal ) < 0 ) {v3.multiplyScalar(-1)};
  tri.lookAt(v3);
  tri.position.copy( marker.planeVector.a );
  scene.add(tri);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1,1),
    new THREE.MeshBasicMaterial({
      color: 0xFFFF00
    })
  );
};
*/
