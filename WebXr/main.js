import * as THREE from 'three';
import { Enviroment } from './enviroment.js';
import { GUI } from './gui.js';
import { interactiveObjects } from './interactiveObjects.js';

/**************************************************************************************************************************
                                            Klasse für die Haupt Game Logic
***************************************************************************************************************************/

class Game{

    constructor(){
        this._init();
    };

    _init(){
        // Enviroment Klasse für Scene und Camera
        this.env = new Enviroment();
     
        // GUI Klasse für Interface Aktionen und Darstellung
        this.gui = new GUI();
        this.gui.initOrbitControls( this.env.camera, this.env.renderer.domElement );

        //Klasse für die Interactiven Elemente
        this.objHandler = new interactiveObjects();

        //Preload Interactive Objects und erstelle menu
        this.objHandler.preloadMenuObjects( () => {
            this.gui.createMenu( this.objHandler.menuObjects );
        });

        //Game Clock
        let clock = new THREE.Clock();

    }; // Ende _Init
    
    startLoop(){
        // setAnimationLoop() zwingend notwendig für XR Anwendungen
        this.env.renderer.setAnimationLoop( (timestamp, frame) => {

            //Hier onPointerMove wenn XR enabled
            if( this.env.renderer.xr.isPresenting ){
                this.onPointerMove();

                //Beschreibe Canvas mit Debugging shit
                //Fill Canvas
                this.env.ctx.fillStyle = '#FFF';
                this.env.ctx.fillRect(0, 0, this.env.ctx.canvas.width, this.env.ctx.canvas.height);
                this.env.ctx.fillStyle = '#000';
                this.env.ctx.font = "12px sans";
                this.env.ctx.fillText(`Connected?: ${this.env.isConnected}`,10,20);
                
                if( this.env.controller.gamepad ){
                    this.env.ctx.fillText(`B-Length: ${this.env.controller.gamepad.buttons.length}`,10,40);
                    for(let i=0; i<this.env.controller.gamepad.buttons.length; i++){
                        this.env.ctx.fillText(`i: ${this.env.controller.gamepad.buttons[i].pressed},${this.env.controller.gamepad.buttons[i].touched},${this.env.controller.gamepad.buttons[i].value.toFixed(1)}`,10,60+20*i)
                    };
                };
            
                this.env.texture.needsUpdate = true;
            };

            //Menu Spezifische Funktionen
            if( this.gui.menuVisible ){
                this.gui.alignMenu( this.env.camera );

                //Durchlaufe Objekte  muss geändert werden wenn möglich
                //sodass das Array nicht immer ganz durhclaufen wird
                this.objHandler.menuObjects.forEach( e => {
                    if( e.isHovered ){ e.rotateY( 180/Math.PI * 0.0001 ) }
                });
            };

            this.env.animateShader( timestamp, this.env.renderer.domElement.width, this.env.renderer.domElement.height );
            this._drawFrame();
        });
    };

    _drawFrame(){
        this.env.renderer.render( this.env.scene, this.env.camera );
    };

    //Funktion für das Resize Event
    onWindowResize(){
        this.env.camera.aspect = window.innerWidth / window.innerHeight;
        this.env.camera.updateProjectionMatrix();
        this.env.renderer.setSize( window.innerWidth, window.innerHeight );
    };

    //Funktion für KeyUp Event
    manageKeyEvent( event ){
        switch ( event.key ){
            case 'b':
            this.objHandler.buildModeActivated = !this.objHandler.buildModeActivated;
            console.log(`Bau Modus ist ${this.objHandler.buildModeActivated?'an':'aus'}`);
            break;
            case 'r':
            this.objHandler.buildModeActivated = false;
            this.objHandler.activeObjectIsPlaced = false;
            this.objHandler.activeObject = null;
            this.env.scene.remove( this.objHandler.activeObject );
            //Hier lösche ale neu hinzugefügten Elemente
            for(let i=this.env.scene.children.length-1; i>=0; i--){
                if( this.env.scene.children[i]['name'] == 'placedObject' ){
                    this.env.scene.remove( this.env.scene.children[i] );
                    this.objHandler.placedObjects.splice(i,1);
                };
            };
            this.env.scene.remove( this.gui.lineForRotation )
            console.log( "Delete" );
            break;
            case 'q':
                this.gui.menuVisible = !this.gui.menuVisible;
                if(this.gui.menuVisible) { this.env.raycasterGroup.add( this.gui.menuGroup ) }
                else {
                    if( this.gui.activeElement !== null){
                        this.gui.activeElement.children[1].isHovered = false;
                        this.gui.activeElement = null;
                    };
                    this.gui.activeElement = null;
                    this.objHandler.activeObject = null;
                    this.env.raycasterGroup.remove( this.gui.menuGroup ) 
                };
            break;
            default:
            break;
        };
    };

    //Funktion für Mausbewegung
    onPointerMove( event ){
        //Raycasting von Maus oder Controller bei XR enabled
        if( this.env.renderer.xr.isPresenting ){
            this.gui.raycaster.setFromXRController( this.env.controller );
            this.gui.firstHit = this.gui.raycaster.intersectObjects( this.env.raycasterGroup.children )[0];
        }else{
            this.gui.updatePointerPosition( event.clientX, event.clientY );
            // Cast Ray through Mouse ( Origin, targetGroup )
            this.gui.updateRaycasterTarget( this.env.camera, this.env.raycasterGroup.children );
        };

        //Menu spezifisch
        if( this.gui.menuVisible ){
            //Neuer Ray auf nur auf das Menu
            //Raycasting von Maus oder Controller bei XR enabled
            if( this.env.renderer.xr.isPresenting ){
                this.gui.raycaster.setFromXRController( this.env.controller );
                this.gui.firstHit = this.gui.raycaster.intersectObjects( this.gui.menuGroup.children )[0];
            }else{
                this.gui.updateRaycasterTarget( this.env.camera, this.gui.menuGroup.children );
            };

            //Hover Logic für das Menu
            if( this.gui.firstHit ){
                if( this.gui.activeElement !== this.gui.getGridCard( this.gui.firstHit.object ) ){
                    //Setze alte flag auf flase
                    if( this.gui.activeElement !== null){
                        this.gui.activeElement.children[1].isHovered = false;
                    };
                    //Setze neue flag auf true
                    this.gui.activeElement = this.gui.getGridCard( this.gui.firstHit.object );
                    this.gui.activeElement.children[1].isHovered = true;
                };
            }else{
                //Nichts getroffen Setze alles zurück
                if( this.gui.activeElement !== null){
                    this.gui.activeElement.children[1].isHovered = false;
                };
                this.gui.activeElement = null;
            };
        };


        if(this.gui.firstHit){
            // Transformiere die getroffene Fläche in den World Space
            this.gui.normalToWorldSpace();
            // Richte den Marker passend zur Fläche aus
            this.gui.alignMarker( this.gui.firstHit.point, this.gui.normalWorldSpace );
            this.env.scene.add( this.gui.marker );    
            
            //Baumodus platzierung
            if(this.objHandler.buildModeActivated && !this.objHandler.activeObjectIsPlaced){
                //Richte das Test Objekt aus
                this.objHandler.activeObject.position.copy( this.gui.firstHit.point );
                this.objHandler.activeObject.quaternion.copy ( this.gui.quaternionForMarker );
            };

        };

        
        //Baumodus Drehung
        if(this.objHandler.buildModeActivated && this.objHandler.activeObjectIsPlaced){
            //Brechne Schnittpunkt Ray mit Normal Plane - Speichere in Intersect
            this.gui.raycaster.ray.intersectPlane( this.gui.temporaryPlane, this.gui.intersect );
            //Richte den Marker basierend of der neuen Ebene aus
            this.gui.alignMarker( this.gui.intersect, this.gui.temporaryPlane.normal );
            //Erstelle Hilfslinie für die Rotation
            this.env.scene.remove( this.gui.lineForRotation );
            this.gui.createLine( this.objHandler.activeObject.position, this.gui.intersect );
            this.env.scene.add( this.gui.lineForRotation );
            //Richte das active Objekt aus
            this.objHandler.activeObject.up = this.gui.temporaryPlane.normal;
            this.objHandler.activeObject.lookAt( this.gui.intersect );
        }
    };

    //Funktion für das Click Event der Mouse
    onPointerClick( event ){

        //Reset State to blank after objact is placed and rotated
        if( this.objHandler.buildModeActivated && this.objHandler.activeObjectIsPlaced ){
            this.objHandler.buildModeActivated = false;
            this.objHandler.activeObjectIsPlaced = false;
            this.env.scene.remove( this.gui.lineForRotation );
            //this.objHandler.activeObject = null;  // würde sich aber noch im später bewegen lassen
        };


        //Objekt wurde platziert
        if( this.gui.firstHit && this.objHandler.buildModeActivated ){
            //Erweitere Hit Normal in die Unendlichkeit zum abtasten
            this.gui.temporaryPlane.setFromNormalAndCoplanarPoint( this.gui.normalWorldSpace, this.gui.firstHit.point);
            
            // Setze Objekt basierend auf marker Position
            this.objHandler.activeObjectIsPlaced = true;
        };  

        //Wähle hovered Element aus
        if( this.gui.firstHit && this.gui.activeElement && this.gui.activeElement.children[1].isHovered ){
            //Erstelle Kopie aus einem der Menu Objekte
            this.objHandler.activeObject = this.gui.activeElement.children[1].clone();
            this.objHandler.activeObject.name = "placedObject";
            this.objHandler.placedObjects.push( this.objHandler.activeObject );
            //Bearbeite Position und Skalierung
            this.objHandler.activeObject.scale.setScalar( 1-this.gui.activeElement.children[1].scaleWert );
            this.objHandler.activeObject.children[0].position.set( 0,0,0 );
            //Schließe Menu und setze relevante Flags zurück
            this.gui.menuVisible = false;
            this.env.raycasterGroup.remove( this.gui.menuGroup );
            this.gui.activeElement.children[1].isHovered = false;
            this.gui.activeElement = null;
            //Flag für den BuildModus
            this.objHandler.buildModeActivated = true;
            this.env.scene.add( this.objHandler.activeObject );
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


