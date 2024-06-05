import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//XR Spezifisch
import { XRButton } from 'three/addons/webxr/XRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

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
camera.position.set(0, 1.6, 10);

const light = new THREE.HemisphereLight(new THREE.Color(0xff0000), new THREE.Color(0x0000ff), 1);
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

document.body.appendChild(XRButton.createButton(renderer, sessionInit));





//Variablen für die Hand Erkennung und Controller
let controller, hand, controllerGrip;

//Factories zum zeichnen der Controller
const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

//Standard Controller
controller = renderer.xr.getController( 0 );
scene.add( controller );

//Hand Controller
hand = renderer.xr.getHand( 0 );
hand.add( handModelFactory.createHandModel( hand ) );
scene.add( hand );

/**************************************************************************************************************************
                                            Starte Renderer nach Vorbereitungen wenn nötig
***************************************************************************************************************************/

/*
function initialPromise(){
    return new Promise( resolve => {
        resolve();
    });
};

let p = initialPromise();

Promise.all([p]).then( () => {
    //Setup
    scene.add(sphere);
    sphere.position.set(0,0,-5);

    //Starte Loop
    renderer.setAnimationLoop(animate);
});
*/


renderer.setAnimationLoop(animate);



/**************************************************************************************************************************
                                            Animation Loop
***************************************************************************************************************************/


function animate(timestamp, frame) {
    //Animationen
    sphere.material.color = changeColor(timestamp);

    for(let i = 0; i < scene.enten.length; i++){
        let obj = scene.enten[i];
        obj.applyForce(gravity);
        obj.updateSpeed();
        if(obj.updateAge){
            obj.updateAge(timestamp);
            if(obj.age >= 20){
            scene.remove(obj);
            scene.enten.splice(i,1)};
        };
    };

    //Rendert Frame
    renderer.render( scene, camera );
};

/**************************************************************************************************************************
                                           Körper
***************************************************************************************************************************/

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry( 1, 32, 16 ),
    new THREE.MeshPhongMaterial({
        color: 0xFF8844,
        side: THREE.FrontSide,
    })
);

scene.add(sphere);
sphere.position.set(0,0,-5);

/**************************************************************************************************************************
                                           Funktions
***************************************************************************************************************************/

function changeColor(time){
    let t = Math.floor(time*0.001);
    const c = (t%2 == 0)?new THREE.Color(0xFF8844):new THREE.Color(0x8844FF);
    return c;
};



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
    loadGLTF('Duck.gltf').then(result => {
      let gltf = result.scene;
      initDuck(gltf);
      scene.enten.push(result.scene);
      scene.add(scene.enten[scene.enten.length-1]);
    });
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




scene.enten = [];
const gravity = new THREE.Vector3(0,-0.005,0);

function initDuck(obj){
    obj.position.set(0,0,-Math.random()*5).applyMatrix4( controller.matrixWorld );
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