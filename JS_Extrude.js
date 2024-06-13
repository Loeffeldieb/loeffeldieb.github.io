import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//XR Spezifisch
import { XRButton } from 'three/addons/webxr/XRButton.js';

/**************************************************************************************************************************
                                            Three.js Setup   Initialisierung
***************************************************************************************************************************/

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );  //  <-----
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;                                                    //  <-----

const scene = new THREE.Scene();

//Kamera (FoV, AR, Near, Far Render Distance)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 3, 10);
camera.lookAt(0,0,0);
camera.updateProjectionMatrix();

const light = new THREE.HemisphereLight(new THREE.Color(0xffffff), new THREE.Color(0x9999ff), 1);
scene.add( light );

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

document.body.appendChild(XRButton.createButton(renderer, sessionInit));      // <-----


//Variablen für die Hand Erkennung und Controller
let controller;


//Standard Controller
controller = renderer.xr.getController( 0 );
scene.add( controller );




/**************************************************************************************************************************
                                            Starte Renderer nach Vorbereitungen wenn nötig
***************************************************************************************************************************/


function initialPromise(){
    return new Promise( resolve => {
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(10,10, 10, 10),
            new THREE.MeshBasicMaterial({
                color: 0x272727,
                wireframe: true,
                side: THREE.DoubleSide
            })
        );
        
        plane.rotateX(Math.PI*-0.5);
        plane.position.set(0,0,0);
        scene.add(plane);
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



//renderer.setAnimationLoop(animate);



/**************************************************************************************************************************
                                            Animation Loop
***************************************************************************************************************************/


function animate(timestamp, frame) {

    //Animationen
    
    //Rendert Frame
    renderer.render( scene, camera );
};



/**************************************************************************************************************************
                                           Körper
***************************************************************************************************************************/

//Zeichnet Linie ausgehend vom Controller
const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
const line = new THREE.Line( geometry );
line.name = 'line';
line.scale.z = 5;
controller.add( line.clone() );

//obj.position.set(0,0,-Math.random()*5).applyMatrix4( controller.matrixWorld );
//obj.quaternion.setFromRotationMatrix( controller.matrixWorld ); //Drehung im Moment Deaktiviert


/**************************************************************************************************************************
                                           Funktions
***************************************************************************************************************************/

function loadGLTF(url){
    return new Promise(resolve => {
        new GLTFLoader().load(url,resolve);
    });
};

/**************************************************************************************************************************
                                            Events
***************************************************************************************************************************/



//Select Event 
controller.addEventListener( 'select', onSelect );

function onSelect(){
    
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
})





/*
//Hit Test Testing
let reticle = new THREE.Mesh(
  new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
  new THREE.MeshBasicMaterial()
);
reticle.matrixAutoUpdate = false;
reticle.visible = false;
scene.add( reticle );

let hitTestSource = null;
let hitTestSourceRequested = false;

//Hit Test Zeug für die Animation Loop
if ( frame ) {
  const referenceSpace = renderer.xr.getReferenceSpace();
  const session = renderer.xr.getSession();

  if ( hitTestSourceRequested === false ) {
    session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
      session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
        hitTestSource = source;
      } );
    } );

    session.addEventListener( 'end', function () {
      hitTestSourceRequested = false;
      hitTestSource = null;
    } );

    hitTestSourceRequested = true;
  }

  if ( hitTestSource ) {
    const hitTestResults = frame.getHitTestResults( hitTestSource );
    if ( hitTestResults.length ) {
      const hit = hitTestResults[ 0 ];
      reticle.visible = true;
      reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
    } else {
      reticle.visible = false;
    }
  }
}

*/
