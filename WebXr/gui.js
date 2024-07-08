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
        const h = 3;

        //Counter für Positionierung in der Höhe
        let counter = -1;
        //Erstelle Raster

        for(let i=0; i<objectsArray.length; i++){

            if( i%w == 0 ){ counter++ };
            let xPos = (i%w)*1.1;
            let yPos = counter*1.1;

            //Placeholder
            let plate = new THREE.Mesh(
                new THREE.BoxGeometry( 1, 1, 0.05 ),
                new THREE.MeshBasicMaterial({
                    color: 0xFFFFFF
                })
            )

            //Placeholder
            plate.position.set( xPos, yPos, 0 );
            this.menuGroup.add( plate );

            objectsArray[i].position.set( xPos,yPos,0 );
            this.menuGroup.add( objectsArray[i] );

        };

        //Lade 9 Objecte vor
        //Ordne Objecte in Raster an
        //Animation on hover
        //onClick kopiere Obj und binde es an den cursor
    }; 


};

export { GUI };
