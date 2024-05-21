import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
//import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';


/*
                        Three.js Setup
*/

//Initialisiere Szene
const scene = new THREE.Scene();
//Kamera (FoV, AR, Near, Far Render Distance)
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
//Initialisiere Renderer und füge dem DOM hinzu
const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );

//Initialisiere WebXR & ARButton
renderer.xr.enabled = true;
document.body.appendChild(ARButton.createButton(renderer));

document.body.appendChild( renderer.domElement );


/*
                        PickHelper Class importiert von Three.js examples
*/
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
        this.pickedObject.rotation.y += 0.01;
        this.pickedObject.material.emissive.setHex((time) % 2 > 0 ? 0xFFFFFF : 0xFF0000);
      }
    }
  }
  const pickHelper = new PickHelper();



/*
                        Three.js Scene Bearbeiten
*/

//Camera Adjustment
camera.position.set(0, 1.6, 10);

//Lichtquelle
const light = new THREE.AmbientLight( 0xFFFFFF, 3.0 ); // soft white light
scene.add( light );

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
      result.scene.position.set(0,0,-0.3).applyMatrix4( controller.matrixWorld );
      result.scene.quaternion.setFromRotationMatrix( controller.matrixWorld );
      result.scene.scale.set(0.2, 0.2, 0.2);
      scene.add( result.scene );
    });
};

let controller = renderer.xr.getController( 0 );
controller.addEventListener( 'select', onSelect );
scene.add( controller );

/*
                        Animation Loop
*/


function animate(time) {
    time = Math.floor(time*0.01); 
    //Model Animation
    model1.position.z = -5;
    //model1.rotation.y += 0.01;
    // 0, 0 is the center of the view in normalized coordinates.
    pickHelper.pick({x: 0, y: 0}, scene, camera, time);

    //Füge dem Renderer Szene und Camera hinzu
    render();
}

function render(){
    renderer.render( scene, camera);
};

//renderer.setAnimationLoop(animate);


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





