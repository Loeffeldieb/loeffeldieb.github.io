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
        this.menuObjects = [];

        Promise.all([
            this._loadGLTF( './gltf/bunny/scene.gltf' ),
            this._loadGLTF( './gltf/ente/Duck.gltf' ),
            this._loadGLTF( './gltf/tisch/scene.gltf' ),
            this._loadGLTF( './gltf/fahrrad/scene.gltf' ),
            this._loadGLTF( './gltf/kiste/scene.gltf' ),
            this._loadGLTF( './gltf/workbench/scene.gltf' ),
        ]).then( (result) => { 

            for(let i=0; i<result.length; i++){
                //Normalisiere die Größe der Objekte
                const bbox = new THREE.Box3().setFromObject( result[i].scene );
                let size = new THREE.Vector3();
                bbox.getSize( size );
                const scaleVec = new THREE.Vector3(1,1,1).divide( size );
                const scale = Math.min( scaleVec.x, Math.min( scaleVec.y, scaleVec.z ));
                result[i].scene.scale.setScalar( scale );


                //Fülle Position nachrichten weil unterschiedlicher Ursprung in den Modellen
                //Objekte sollten vorher shcon ausgerichtet werden
                //das hier ist scheiße
                switch (i){
                    case 0:
                        console.log( result[i].scene );
                        //result[i].scene.children[0].children[0].children[0].children[0].children[0].position.set( 0,-0.25,0 );
                        break;
                    case 1:
                        result[i].scene.position.set( 0,-5,0 );
                        break;
                    case 2:
                        result[i].scene.position.set( 0,0,0 );
                        break;
                    case 3:
                        result[i].scene.position.set( 0,0,0 );
                        break;
                    case 4:
                        result[i].scene.position.set( 0,0,0 );
                        break;
                    case 5:
                        result[i].scene.position.set( 0,0,0 );
                        break;
                };
                this.menuObjects[i] = result[i].scene;
            };

            //Callback
            callback();
         });
    };
};

export { interactiveObjects };
