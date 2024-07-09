import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**************************************************************************************************************************
                                            Klasse für Interface Aktionen
***************************************************************************************************************************/

class GUI{

    constructor(){
        this._init();
    };
    
    _init(){
        // Raycaster der von dem Controller ausgehen wird
        this.raycaster = new THREE.Raycaster();
        this.intersect = new THREE.Vector3();
        this.firstHit; // THREE.Object
        this.normalWorldSpace = new THREE.Vector3();
        this.temporaryPlane = new THREE.Plane(); // Unendlichkeits Ebene für den Raycaster nach PLatzierung

        // Maus Coordinates
        this.pointer = new THREE.Vector3(0,0,0);

        // Quaternion für die Drehung des Markers
        this.quaternionForMarker = new THREE.Quaternion();
        this.standardUpDirection = new THREE.Vector3( 0,1,0 );

        // Hilfslinie vom Objekt zum Marker
        this.lineForRotation = new THREE.Line();

        //Flag, ob das Menu angezeigt wird
        this.menuVisible = false;

        this._createMarker();
    };

    //Orbit Controlls für leichte Navigierung mit der Maus
    initOrbitControls( cam, renderer ){
        this.orbitControls = new OrbitControls( cam, renderer );
        this.orbitControls.target.set( 0, 1.6, 0 );
        this.orbitControls.update();
    };

    //Erstelle einen Maus Marker
    _createMarker(){
        const markerGeo = new THREE.ConeGeometry( .05, .2, 6 );
        markerGeo.translate(0,.1,0);
        this.marker = new THREE.Mesh(
            markerGeo,
            new THREE.MeshPhysicalMaterial({
                color: 0xFF0000,
                roughness: 0.5,
                metalness: 0.33,
                clearcoat: 0.75,
                clearcoatRoughness: 0.2,
            })
        );
        this.marker.castShadow = true;
    };

    // Aktualisisere Maus Position (Normalisiert)
    updatePointerPosition( x,y ){
        this.pointer.x = ( x / window.innerWidth ) * 2 - 1; 
        this.pointer.y = - ( y / window.innerHeight ) * 2 + 1;
    };

    //Cast Ray und update firstHit Variable
    updateRaycasterTarget( cam, group ){
        this.raycaster.setFromCamera( this.pointer, cam );
        this.firstHit = this.raycaster.intersectObjects( group )[0];
    };

    //Erstelle eine Normale im World Space basierend of der getroffenen Normale
    normalToWorldSpace(){
        this.normalWorldSpace = this.firstHit.face.normal.clone();
        this.normalWorldSpace.transformDirection( this.firstHit.object.matrixWorld ).normalize();
    };

    //Richte den Marker passend zur Normale aus
    alignMarker( pos, normal ){
        this.marker.position.copy( pos );
        this.quaternionForMarker.setFromUnitVectors( this.standardUpDirection, normal );
        this.marker.quaternion.copy ( this.quaternionForMarker );
    };

    //Erstelle eine Hilfslinie zum Marker
    createLine( origin, target ){
        this.lineForRotation = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ origin, target ]));
    };


    createMenu( objectsArray ){
        //Create Menu --> später  Add/remove from scene
        this.menuGroup = new THREE.Group();

        //Bestimme Breite und Höhe des Rasters
        const w = 3;

        //Counter für Positionierung in der Höhe
        let counter = -1;

        //Erstelle Raster
        for(let i=0; i<objectsArray.length; i++){
            //Erstelle Gruppe für einzelnes Grid Element
            let gridCard = new THREE.Group();
            gridCard.name = 'gridCard';

            if( i%w == 0 ){ counter++ };
            let xPos = (i%w)*1.1 - 1;
            let yPos = counter*1.1;

            //Placeholder
            let plate = new THREE.Mesh(
                new THREE.BoxGeometry( 1, 1, 0.05 ),
                new THREE.MeshBasicMaterial({
                    color: 0xFFFFFF
                })
            )

            //Placeholder
            plate.position.set( xPos, yPos, -1 );
            gridCard.add( plate );

            objectsArray[i].position.set( xPos,yPos,0 );
            gridCard.add( objectsArray[i] );

            this.menuGroup.add( gridCard );
        };
    }; 

    alignMenu( cam ){
        cam.getWorldDirection( this.menuGroup.position );
        this.menuGroup.position.normalize();
        this.menuGroup.position.multiplyScalar( 5 );
        this.menuGroup.position.addVectors( this.menuGroup.position, cam.position );

        this.menuGroup.position.set( this.menuGroup.position.x, this.menuGroup.position.y, this.menuGroup.position.z );
        this.menuGroup.lookAt( cam.position );

        for(let i=0; i<this.menuGroup.children.length; i++){
            this.menuGroup.children[i].children[0].lookAt( cam.position.x, cam.position.y, cam.position.z );
            this.menuGroup.children[i].children[1].lookAt( cam.position.x, cam.position.y, cam.position.z );
            //this.menuGroup.children[i].rotateY( (180 / Math.PI) * 0.001 );
            //this.menuGroup.children[i].children[0].lookAt( cam.position );
            //this.menuGroup.children[i].children[1].lookAt( cam.position );
        };
    };

    getGridCard( obj ){
        let currentObj = obj;
        while( currentObj.parent ){
            if( currentObj.name == 'gridCard' ){ return currentObj };
            currentObj = currentObj.parent;
        };
        //return currentObj;
    };    

    // foo(){
    //     this.menuGroup.addEventListener( 'mouseover', ( e ) => {

    //         if( this.gui.menuVisible ){
    //             this.gui.updateRaycasterTarget( this.env.camera, this.gui.menuGroup.children );
    //             if( this.gui.firstHit ){
    //                 let mg = this.getGridCard( this.gui.firstHit.object );
    //                 mg.children[1].rotateY( (180 / Math.PI) * 0.1 );
    //                 console.log( mg );
    //             };
    //         };
        
    //     });
    // }

};

export { GUI };
