import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

console.log("Hit Test");
/**************************************************************************************************************************
                                            Three.js Setup   Initialisierung
***************************************************************************************************************************/

const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.xr.enabled = true;

const scene = new THREE.Scene();
//Kamera (FoV, AR, Near, Far Render Distance)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 1.6, 10);

//Lichtquelle
const light = new THREE.AmbientLight( 0xFFFFFF, 3.0 ); // soft white light
scene.add( light );

//Starte XR mit Button
const sessionInit = {
  optionalFeatures: [ 
    'hand-tracking',
    'hit-test'
   ]
};
document.body.appendChild(XRButton.createButton(renderer, sessionInit));
document.body.appendChild( renderer.domElement );

//Orbit Controls (Bewegen der Szene mit Maus)
let orbitControls;
orbitControls = new OrbitControls( camera, renderer.domElement );
orbitControls.target.set( 0, 1.6, 0 );
orbitControls.update();

//Variablen für die Hand Erkennung und Controller
let controller, hand, controllerGrip;

//Factories zum zeichnen der Controller
const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

//Standard Controller
controller = renderer.xr.getController( 0 );
scene.add( controller );

//Grip Controller
controllerGrip = renderer.xr.getControllerGrip( 0 );
controllerGrip.add( controllerModelFactory.createControllerModel( controllerGrip ) );
scene.add( controllerGrip );

//Hand Controller
hand = renderer.xr.getHand( 0 );
hand.add( handModelFactory.createHandModel( hand ) );
scene.add( hand );

//Zeichnet Linie ausgehend vom Controller
const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
const line = new THREE.Line( geometry );
line.name = 'line';
line.scale.z = 5;
controller.add( line.clone() );

/*
                        PickHelper Class importiert von Three.js examples
*/
/*
class PickHelper {
    constructor() {
      this.raycaster = new THREE.Raycaster();
      this.pickedObject = null;
      this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
      // restore the color if there is a picked object
      if (this.pickedObject) {
        this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
        this.pickedObject = undefined;
      }
   
      // cast a ray through the frustum
      this.raycaster.setFromCamera(normalizedPosition, camera);

      // get the list of objects the ray intersected
      const intersectedObjects = this.raycaster.intersectObjects(scene.children);

      if (intersectedObjects.length) {
        // pick the first object. It's the closest one
        this.pickedObject = intersectedObjects[0].object;
        // save its color
        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // set its emissive color to flashing red/yellow
        this.pickedObject.material.emissive.setHex((time) % 2 > 0 ? 0xFFFFFF : 0xFF0000);
        this.pickedObject.rotation.y += 0.01;
      }
    }
  }
const pickHelper = new PickHelper();
*/

// 0, 0 is the center of the view in normalized coordinates.
/*pickHelper.pick({x: 0, y: 0}, scene, camera, time);*/




/**************************************************************************************************************************
                                            Interaction
***************************************************************************************************************************/

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

//Zeichnet Frame
function render(timestamp, frame){
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

  renderer.render( scene, camera );
};

//Animation Loop
//Parameter sind durch setAnimationLoop() gesetzt!
function animate(timestamp, frame) {
  timestamp = Math.floor(timestamp*0.01); 
  //Model Animation
  model1.position.z = -5;
  render(timestamp, frame);
}

let model1;
let p = loadGLTF('Duck.gltf').then(result => {model1 = result.scene});

Promise.all([p]).then( () => {
    // Bearbeite Model
    model1.position.set(0,0,0);
    scene.add(model1);

    //Starte Render Loop nach dem einladen aller Modelle
    renderer.setAnimationLoop(animate);
});

function loadGLTF(url){
  return new Promise(resolve => {
      new GLTFLoader().load(url,resolve);
  });
};


//Select Event 
controller.addEventListener( 'select', onSelect );

function onSelect(){
    loadGLTF('Duck.gltf').then(result => {
      result.scene.position.set(0,0,-5.0).applyMatrix4( controller.matrixWorld );
      result.scene.quaternion.setFromRotationMatrix( controller.matrixWorld );
      result.scene.scale.set(0.2, 0.2, 0.2);

      scene.add( result.scene );
    });
};


/**************************************************************************************************************************
                                            Window Resize Event
***************************************************************************************************************************/

addEventListener("resize", (event) => {
    //Funktioniert nicht mit XR?
    if(renderer.xr.enabled === false){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix()
        renderer.setSize( window.innerWidth, window.innerHeight );
    };
})





