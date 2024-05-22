import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
//Für Hand Input
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';


/*
                        Three.js Setup   Initialisierung
*/

//Variabllen für die Hand Erkennung
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let controls;

//Initialisiere Szene
const scene = new THREE.Scene();
//Kamera (FoV, AR, Near, Far Render Distance)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
//Initialisiere Renderer und füge dem DOM hinzu
const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );

//Camera Adjustment
camera.position.set(0, 1.6, 10);

//Lichtquelle
const light = new THREE.AmbientLight( 0xFFFFFF, 3.0 ); // soft white light
scene.add( light );

//Initialisiere WebXR & ARButton
const sessionInit = {
  optionalFeatures: [ 'hand-tracking' ]
  //requiredFeatures: ["hand-tracking"],
};

renderer.xr.enabled = true;
document.body.appendChild(XRButton.createButton(renderer, sessionInit));
document.body.appendChild( renderer.domElement );

//Orbit Controls
controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 1.6, 0 );
controls.update();




// controllers

controller1 = renderer.xr.getController( 0 );
scene.add( controller1 );

controller2 = renderer.xr.getController( 1 );
scene.add( controller2 );

const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

// Hand 1
controllerGrip1 = renderer.xr.getControllerGrip( 0 );
controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
scene.add( controllerGrip1 );
*/
hand1 = renderer.xr.getHand( 0 );
hand1.add( handModelFactory.createHandModel( hand1 ) );

scene.add( hand1 );

// Hand 2
controllerGrip2 = renderer.xr.getControllerGrip( 1 );
controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
scene.add( controllerGrip2 );

hand2 = renderer.xr.getHand( 1 );
hand2.add( handModelFactory.createHandModel( hand2 ) );
scene.add( hand2 );

//

const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

const line = new THREE.Line( geometry );
line.name = 'line';
line.scale.z = 5;

controller1.add( line.clone() );
controller2.add( line.clone() );




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

/*
                        Model einladen durhc erstellen von Promise
*/
function load3DModel(url){
    return new Promise(resolve => {
        new GLTFLoader().load(url,resolve);
    });
};

let model1;

let p = load3DModel('Duck.gltf').then(result => {model1 = result.scene});

Promise.all([p]).then( () => {

    // Bearbeite Model
    model1.position.set(0,0,0);
    scene.add(model1);

    //Starte Render Loop nach dem einladen aller Modelle
    renderer.setAnimationLoop(animate);
});


function onSelect(){
    load3DModel('Duck.gltf').then(result => {
      result.scene.position.set(0,0,-5.0).applyMatrix4( controller.matrixWorld );
      result.scene.quaternion.setFromRotationMatrix( controller.matrixWorld );
      result.scene.scale.set(0.2, 0.2, 0.2);

      scene.add( result.scene );
    });
};

//let controller = renderer.xr.getController( 0 );
controller1.addEventListener( 'select', onSelect );
//scene.add( controller );

/*
                        Animation Loop
*/


function animate(time) {
    time = Math.floor(time*0.01); 
    //Model Animation
    model1.position.z = -5;

    // 0, 0 is the center of the view in normalized coordinates.
    /*pickHelper.pick({x: 0, y: 0}, scene, camera, time);*/

    //Rendert einen Frame
    render();
}

function render(){
    renderer.render( scene, camera);
};




/*
                        Reset On Resize
*/
addEventListener("resize", (event) => {
    if(renderer.xr.enabled === false){
        // Update camera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix()
        renderer.setSize( window.innerWidth, window.innerHeight );
    };
})





