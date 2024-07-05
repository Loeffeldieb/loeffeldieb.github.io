import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**************************************************************************************************************************
                                            Klasse für die platzierten Gegenstände
***************************************************************************************************************************/

class interactiveObjects{
    constructor(){
        this._init();
    };

    _init(){
        //Flag, die den Baumodus aktiviert
        this.buildModeActivated = false;
        //Flag die schaut, ob ein Objekt selektiert wurde
        this.objectSelected = false;
        //Flag, dguckt, ob das Objekt platziert wurde
        this.activeObjectIsPlaced = false;
        //Erstelle GLTF Loader
        this.GLTFLoader = new GLTFLoader();
        //Flag für die Bestätigung dass objekte geladen wurden
        this.menuObjectsLoaded = false;
        //Einladen des TestObjektes
        this._loadGLTF( "./gltf/bunny/scene.gltf" ).then( result => {
            this.testObj = result.scene;
            this.testObj.children[0].scale.set( 0.4,0.4,0.4 );
            this.testObj.children[0].position.set( 0,0.35,0 );
            this.testObj.children[0].children[0].children[0].children[0].children[0].castShadow = true;
            this.testObj.children[0].children[0].children[0].children[0].children[0].material.color.set( 0xe56b84 );
        });
    };

    _createTestObject(){
        const fooGeo = new THREE.BoxGeometry( 0.5, 2, 0.1 );
        fooGeo.translate( 0.25,1,0 );
        this.testObj = new THREE.Mesh(
            fooGeo,
            new THREE.MeshPhysicalMaterial({
              color: 0xFF00FF,
              roughness: 0.5,
              metalness: 0.75,
              clearcoat: 0.33,
              clearcoatRoughness: 0.1,
            })
          );
        this.testObj.castShadow = true;
    };


    _loadGLTF( url ){
        return new Promise( resolve => {
            this.GLTFLoader.load( url, resolve) ;
        });
    };

    preloadMenuObjects( callback ){
        //Array für die Menu Objekte
        this.menuObjects = new Array( 2 );

        Promise.all([
            this._loadGLTF( './gltf/bunny/scene.gltf' ),
            this._loadGLTF( './gltf/ente/Duck.gltf' )
        ]).then( (result) => { 
            for(let i=0; i<result.length; i++){
                this.menuObjects[i] = result[i].scene;
            };
            this.menuObjectsLoaded = true;

            //Callback
            callback();
         });
    };
};

export { interactiveObjects };
