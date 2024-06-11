import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//XR Spezifisch
//import { XRButton } from 'three/addons/webxr/XRButton.js';


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
camera.position.set(0, 10, 0);
camera.lookAt(0,0,0);
camera.updateProjectionMatrix();

const light = new THREE.HemisphereLight(new THREE.Color(0xffffff), new THREE.Color(0xffffff), 1);
scene.add( light );

document.body.appendChild( renderer.domElement );





//Orbit Controls (Bewegen der Szene mit Maus)
let orbitControls;
orbitControls = new OrbitControls( camera, renderer.domElement );
orbitControls.target.set( 0, 1.6, 0 );
orbitControls.update();

/*
Starte XR mit Button
const sessionInit = {
    optionalFeatures: [ 
        'hand-tracking',
        'hit-test'
        ]
};

document.body.appendChild(XRButton.createButton(renderer, sessionInit));           // <-----


//Variablen für die Hand Erkennung und Controller
let controller;


//Standard Controller
controller = renderer.xr.getController( 0 );
scene.add( controller );
*/

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

    let zeit = Math.floor(timestamp*0.1);
    let theta = Math.PI / 180 * (360 * Math.random());
    if(zeit%10 == 0){
        scene.movers.push(new Mover(new THREE.Vector3( 7*Math.sin(theta), 0, 7*Math.cos(theta) )));
    };

    //Loop durch Mover
    for(let i=0; i<scene.movers.length; i++){
        const foo = new THREE.Vector3().subVectors(sphere.position, scene.movers[i].body.position);
        foo.normalize()
        foo.multiplyScalar(scene.movers[i].maxSpeed);
        let target = scene.movers[i].seek(sphere.position);
        scene.movers[i].body.lookAt(target);
        scene.movers[i].applyForce(target);
        scene.movers[i].updatePosition();

        if(scene.movers[i].isAlive == false){
            scene.remove(scene.movers[i].body);
            scene.movers.splice(i,1);
            console.log(scene.children.length, scene.movers.length);
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
sphere.position.set(0,0,0);
sphere.name = 'attractor';

//Klasse für Verfolger
class Mover{

    constructor(p){
        this.velocity = new THREE.Vector3(0,0,0);
        this.acceleration = new THREE.Vector3(0,0,0);
        this.mass = Math.random();
        this.force = 1.0;
        this.maxSpeed = 0.01;
        this.body = this.createMesh();
        this.isAlive = true;
        this.body.position.set(p.x,p.y,p.z);
        scene.add(this.body); // Muss Raus später
    };

    createMesh(){
        let mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry( this.mass ),
            new THREE.MeshPhongMaterial({
                color: new THREE.Color(Math.random(), Math.random(), Math.random()),
                side: THREE.FrontSide,
            })
        );
        return mesh;
    };

    seek(target){
        let desiredVelocity = new THREE.Vector3().subVectors(target, this.body.position);
        if(desiredVelocity.length() < 0.5) this.isAlive = false;
        desiredVelocity.multiplyScalar(this.maxSpeed);
        let steering = new THREE.Vector3().subVectors(desiredVelocity, this.velocity);
        return steering;
    };

    applyForce(source){
        this.acceleration.add(source);
    };

    updatePosition(){
        this.velocity.add(this.acceleration);
        this.body.position.add(this.velocity);
        this.acceleration.multiplyScalar(0);
    };
};

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
//controller.addEventListener( 'select', onSelect );

const test = document.getElementsByTagName('canvas')[0];
test.addEventListener('click', onSelect);

scene.movers = [];

function onSelect(){
    let foo = new Mover(new THREE.Vector3(0,0,0));
    scene.movers.push(foo);
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
