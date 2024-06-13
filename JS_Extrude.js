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
camera.position.set(0, 10, 0);
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
            new THREE.PlaneGeometry(10,10),
            new THREE.MeshPhongMaterial({
                color: 0xFFFF00
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

