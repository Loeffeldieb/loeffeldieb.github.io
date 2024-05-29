import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';


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
  
};

let pos = new THREE.Vector3(0, 6, -10);
const gravity = new THREE.Vector3(0,-0.01,0);

scene.enten = [];


//Animation Loop
//Parameter sind durch setAnimationLoop() gesetzt!
function animate(timestamp, frame) {

  for(let i = 0; i < scene.enten.length; i++){
    let obj = scene.enten[i];
    obj.applyForce(gravity);
    obj.updateSpeed();
  };

  model1.changeMat();

  //Hit Test Zeug
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
}

let model2;
let geo = new THREE.BoxGeometry(1, 1, 1)
let mat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
let model1 = new THREE.Mesh(geo, mat)
scene.add(model1);

let p = loadGLTF('Duck.gltf').then(result => {model2 = result.scene;});

Promise.all([p]).then( () => {
    // Bearbeite Model
    model1.position.set(pos.x,pos.y,pos.z);
    model1.acceleration = new THREE.Vector3(0,0,0);
    model1.velocity = new THREE.Vector3(0,0,0);

    model1.applyForce = function(source){
        this.acceleration.add(source);
    };
    model1.updateSpeed = function(){
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.multiplyScalar(0);
    
      if(this.position.y < 0 && this.velocity.y < 0 ){
        this.velocity.y *= -1.0;
        this.velocity.y += 0.01; // Ich verliere eine Iteration Grvaity, sollte nicht so sein!
        this.position.y = 0;
      };
    };
    
    model1.changeMat = function(){

      if(this.velocity.y <= 0.1){
        this.material.color.set(0x00ff00);
      };

      if(this.velocity.y > 0.1){
        this.material.color.set(0xff0000);
      };
      
    
    };

    console.log(model1.material);

    scene.add(model1);
    scene.enten.push(model1);

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
      result.scene.scale.set(0.2,0.2,0.2);

      result.scene.acceleration = new THREE.Vector3(0,0,0);
      result.scene.velocity = new THREE.Vector3(0,0,0);
      result.scene.applyForce = function(source){
        this.acceleration.add(source);
      };
      result.scene.updateSpeed = function(){
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.acceleration.multiplyScalar(0);
      
        if(this.position.y < 0 && this.velocity.y < 0 ){
          this.velocity.y *= -1.0;
          this.velocity.y += 0.01; // Ich verliere eine Iteration Grvaity, sollte nicht so sein!
          this.position.y = 0;
        };
      };

      scene.add( result.scene );
      scene.enten.push(result.scene);
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





