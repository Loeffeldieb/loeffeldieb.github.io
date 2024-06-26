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

const gravity = new THREE.Vector3(0,-0.005,0);
scene.enten = [];

//let p1 = loadGLTF('Duck.gltf').then(result => {model2 = result.scene;});
let p2 = initialPromise().then( (result) => {
    console.log("box placed");
    result.position.set(0,1,0);
    console.log(result);

    //Create Plane
    
    const m = new THREE.LineBasicMaterial({color: 0xff00ff});
    const g = new THREE.CircleGeometry( 2, 32 );
    const plane = new THREE.Mesh( g, m );
    plane.rotateX((Math.PI / 180) * 270);
    plane.position.set(0,0,0);
    scene.add(plane);
    

    scene.add(result);
});

Promise.all([p2]).then( () => {
    //Starte Render Loop nach dem einladen aller Modelle
    renderer.setAnimationLoop(animate);
});

//Animation Loop
//Parameter sind durch setAnimationLoop() gesetzt!
function animate(timestamp, frame) {

  for(let i = 0; i < scene.enten.length; i++){
    let obj = scene.enten[i];

    if(obj.position.z < -5) obj.age = 19;

    //obj.changeMat();
    obj.applyForce(gravity);
    obj.updateSpeed();
    if(obj.updateAge){
      obj.updateAge(timestamp);
      if(obj.age >= 20){
        scene.remove(obj);
        scene.enten.splice(i,1)};
    };
  };

  //Animate Plane
  scene.children[4].material.color = new THREE.Color(Math.cos(timestamp*.001), -Math.sin(timestamp*.001), Math.sin(timestamp*.001));

  renderer.render( scene, camera );
}

//Select Event 
controller.addEventListener( 'select', onSelect );

function onSelect(){
    loadGLTF('Duck.gltf').then(result => {
      let gltf = result.scene;
      initDuck(gltf);
      scene.enten.push(result.scene);
      scene.add(scene.enten[scene.enten.length-1]);
    });
};

/**************************************************************************************************************************
                                            Functions
***************************************************************************************************************************/
function loadGLTF(url){
  return new Promise(resolve => {
      new GLTFLoader().load(url,resolve);
  });
};

function initialPromise(){
  return new Promise( resolve => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load( 'bg.jpg' );
    texture.colorSpace = THREE.SRGBColorSpace;

    const g = new THREE.SphereGeometry( 1, 32, 16 ); 
    const m = new THREE.MeshBasicMaterial({
      //color: 0xFF8844,
      side: THREE.DoubleSide,
      map: texture,
    });

    //const m = new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide} );
    const sphere = new THREE.Mesh( g, m );
    resolve(sphere);
  });
};

function initDuck(obj){
  obj.position.set(0,0,-Math.random()*5).applyMatrix4( controller.matrixWorld );
  //obj.quaternion.setFromRotationMatrix( controller.matrixWorld ); //Drehung im Moment Deaktiviert
  const theta = 360 * Math.random() * (Math.PI / 180);
  obj.rotateY(theta);
  const scaling = Math.random()*0.33;
  obj.scale.set(scaling, scaling, scaling);
  
  obj.children[0].children[0].material.color = new THREE.Color(Math.random(), Math.random(), Math.random());
  obj.children[0].children[0].material.emissive = new THREE.Color(Math.random(), Math.random(), Math.random());

  obj.acceleration = new THREE.Vector3(0,0,0);
  obj.velocity = new THREE.Vector3(0,0,0);
  obj.age = 0.0;

  obj.applyForce = function(source){
      this.acceleration.add(source);
  };
  obj.updateSpeed = function(){
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.multiplyScalar(0);

    
    if(this.position.y < 0 && this.velocity.y < 0 ){
      this.velocity.y *= -0.8;
      this.velocity.y += gravity.y; // Ich verliere eine Iteration Gravity, sollte nicht so sein!
      this.position.y = 0;
    };

    if(Math.abs(this.velocity.y) < 0.01 && this.position.y < 0.1){
      this.velocity.y = 0;
      this.position.y = 0;
    };
    

  };
  
  obj.changeMat = function(){
    if(this.velocity.y <= 0.1){
      this.children[0].children[0].material.emissive = new THREE.Color(0x0000ff);
    };

    if(this.velocity.y > 0.1){
      this.children[0].children[0].material.emissive = new THREE.Color(0xff0000);
    };
  };

  obj.updateAge = function(t){
    if(!this.birth) {this.birth = Math.floor(0.001*t)};
    this.age = Math.floor(0.001*t)-this.birth;
  };
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

