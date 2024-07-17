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
        //Aktives Objekt
        this.activeObject = null;
        //Array mit neu gesezten Objekten
        this.placedObjects = [];
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
                result[i].scene.scaleWert = scale;

                //Fülle Position nachrichten weil unterschiedlicher Ursprung in den Modellen
                //Objekte sollten vorher shcon ausgerichtet werden
                //das hier ist scheiße
                switch (i){
                    case 0:
                        result[i].scene.children[0].position.set( 0,-0.71,0 );
                        break;
                    case 1:
                        result[i].scene.children[0].position.set( 0,-0.925,0 );
                        break;
                    case 2:
                        result[i].scene.children[0].position.set( 0,-1.05,0 );
                        break;
                    case 3:
                        result[i].scene.children[0].position.set( 0,-0.9,0 );
                        result[i].scene.children[0].children[0].rotateY( Math.PI / 2 );
                        break;
                    case 4:
                        result[i].scene.children[0].position.set( 0,-1.8,0 );
                        break;
                    case 5:
                        result[i].scene.children[0].position.set( -1.8,-1.85,1 );
                        break;
                };
                this.menuObjects[i] = result[i].scene;
                //Füge Flag für das Hovern hinzu
                this.menuObjects[i].isHovered = false;
            };

            //Callback
            callback();
         });
    };//Ende Preload Funktion

    animateOnHover( obj, t ){
        if( obj.isHovered ){
            obj.rotateY( 180/Math.PI * 1 + t );
        };
    };

};

export { interactiveObjects };
