import * as THREE from 'three';
import { Enviroment } from './enviroment.js';
import { GUI } from './gui.js';
import { interactiveObjects } from './interactiveObjects.js';

//XR Spezifisch
import { XRButton } from 'three/addons/webxr/XRButton.js';

/**************************************************************************************************************************
                                            Klasse für die Haupt Game Logic
***************************************************************************************************************************/

class Game{

    constructor(){
        this._init();
    };

    _init(){
        //Config Renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: false } );  //  <-----
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.xr.enabled = false;                                                    //  <-----
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 3.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild( this.renderer.domElement );

        // Enviroment Klasse für Scene und Camera
        this.env = new Enviroment();
     
        // GUI Klasse für Interface Aktionen und Darstellung
        this.gui = new GUI();
        this.gui.initOrbitControls( this.env.camera, this.renderer.domElement );

        //Klasse für die Interactiven Elemente
        this.objHandler = new interactiveObjects();

        //Preload Interactive Objects und erstelle menu
        this.objHandler.preloadMenuObjects( () => {
            this.gui.createMenu( this.objHandler.menuObjects );
        });

        //Game Clock
        let clock = new THREE.Clock();


        //Starte XR mit Button
        const sessionInit = {
            optionalFeatures: [ 
                'hand-tracking',
                'hit-test'
                ]
        };
        //document.body.appendChild(XRButton.createButton( this.renderer, sessionInit ));      // <-----

    }; // Ende _Init
    
    startLoop(){
        // setAnimationLoop() zwingend notwendig für XR Anwendungen
        this.renderer.setAnimationLoop( (timestamp, frame) => {
            if( this.gui.menuVisible ){this.gui.alignMenu( this.env.camera )};
            this.env.animateShader( timestamp, this.renderer.domElement.width, this.renderer.domElement.height );
            this._drawFrame();
        });
    };

    _drawFrame(){
        this.renderer.render( this.env.scene, this.env.camera );
    };

    //Funktion für das Resize Event
    onWindowResize(){
        this.env.camera.aspect = window.innerWidth / window.innerHeight;
        this.env.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    };

    //Funktion für KeyUp Event
    manageKeyEvent( event ){
        switch ( event.key ){
            case 'b':
            this.objHandler.buildModeActivated = !this.objHandler.buildModeActivated;
            //if( menu.visible ){raycasterGroup.add( menu )}else{raycasterGroup.remove( menu )};
            console.log(`Bau Modus ist ${this.objHandler.buildModeActivated?'an':'aus'}`);
            break;
            case 'r':
            this.objHandler.buildModeActivated = false;
            this.objHandler.activeObjectIsPlaced = false;
            this.env.scene.remove( this.objHandler.testObj );
            this.env.scene.remove( this.gui.lineForRotation )
            console.log( "Delete" );
            break;
            case 'q':
                this.gui.menuVisible = !this.gui.menuVisible;
                if(this.gui.menuVisible) { this.env.raycasterGroup.add( this.gui.menuGroup ) }
                else { this.env.raycasterGroup.remove( this.gui.menuGroup ) };
            break;
            default:
            break;
        };
    };

    //Funktion für Mausbewegung
    onPointerMove( event ){
        this.gui.updatePointerPosition( event.clientX, event.clientY );
        // Cast Ray through Mouse ( Origin, targetGroup )
        this.gui.updateRaycasterTarget( this.env.camera, this.env.raycasterGroup.children );

        if(this.gui.firstHit){
            // Transformiere die getroffene Fläche in den World Space
            this.gui.normalToWorldSpace();
            // Richte den Marker passend zur Fläche aus
            this.gui.alignMarker( this.gui.firstHit.point, this.gui.normalWorldSpace );
            this.env.scene.add( this.gui.marker );                                          //<--- Brauch FLag sonst redundant
        };//Ende IF Element getroffen

        if(this.objHandler.activeObjectIsPlaced){
            //Brechne Schnittpunkt Ray mit Normal Plane - Speichere in Intersect
            this.gui.raycaster.ray.intersectPlane( this.gui.temporaryPlane, this.gui.intersect );
            //Richte den Marker basierend of der neuen Ebene aus
            this.gui.alignMarker( this.gui.intersect, this.gui.temporaryPlane.normal );
            //Erstelle Hilfslinie für die Rotation
            this.env.scene.remove( this.gui.lineForRotation );
            this.gui.createLine( this.objHandler.testObj.position, this.gui.intersect );
            this.env.scene.add( this.gui.lineForRotation );
            //Richte das Test Objekt aus
            this.objHandler.testObj.up = this.gui.temporaryPlane.normal;
            this.objHandler.testObj.lookAt( this.gui.intersect );
        };
    };

    //Funktion für das Click Event der Mouse
    onPointerClick( event ){

        if( this.objHandler.buildModeActivated && this.objHandler.activeObjectIsPlaced ){
            this.objHandler.buildModeActivated = false;
            this.objHandler.activeObjectIsPlaced = false;
            this.env.scene.remove( this.gui.lineForRotation );
        };

        if( this.gui.firstHit && this.objHandler.buildModeActivated ){
            //Erweitere Hit Normal in die Unendlichkeit zum abtasten
            this.gui.temporaryPlane.setFromNormalAndCoplanarPoint( this.gui.normalWorldSpace, this.gui.firstHit.point);
            
            // Setze Objekt basierend auf marker Position
            this.objHandler.testObj.position.copy( this.gui.firstHit.point );
            this.env.scene.add( this.objHandler.testObj );
            this.objHandler.activeObjectIsPlaced = true;
        };  
    };    
    
};//Ende Game Klasse

let game = new Game();
game.startLoop();

/**************************************************************************************************************************
                                           Events
***************************************************************************************************************************/

addEventListener('resize', ( e ) => {
    game.onWindowResize();
});

window.addEventListener( 'keyup', ( e ) => {
    game.manageKeyEvent( e );
});

window.addEventListener( 'pointermove', ( e ) => {
    game.onPointerMove( e );
});

window.addEventListener( 'click', ( e ) => {
    game.onPointerClick( e );
});


