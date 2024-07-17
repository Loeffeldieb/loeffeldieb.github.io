import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { _line_fs, _line_vs } from './shaders.js';

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

        // Maus Koordinaten
        this.pointer = new THREE.Vector3(0,0,0);

        // Quaternion für die Drehung des Markers
        this.quaternionForMarker = new THREE.Quaternion();
        this.standardUpDirection = new THREE.Vector3( 0,1,0 );

        // Hilfslinie vom Objekt zum Marker
        this.lineForRotation = new THREE.Line();
        // Richtungs Linie für den Controller in XR
        this.lineForController = new THREE.Line();

        // Flag, ob das Menu angezeigt wird
        this.menuVisible = false;

        // Aktioves Element aus dem Menu
        this.activeElement = null; //THREE.Object

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
        this.marker.renderOrder = 3;
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

    //Esrtelle Linie, die vom XR controller aus zeigt
    createLineForXrController( ctrl ){
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1) ]);
        const lineMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0x00FFEE) },
                origin: { value: new THREE.Vector3(0,0,0) }
            },
            vertexShader: _line_vs,
            fragmentShader: _line_fs,
            transparent: true
        });
        this.lineForController = new THREE.Line( lineGeometry, lineMaterial );
        this.lineForController.scale.z = .5;
        this.lineForController.renderOrder = 3;
        ctrl.add( this.lineForController );
    };  

    updateLineForController(  ){
        if(this.firstHit !== undefined){
            this.lineForController.scale.z = this.firstHit.distance;
            //this.lineForController.material.uniforms.origin.value.copy(  );
        }else{
            this.lineForController.scale.z = .5;
        };
    };

    createMenu( objectsArray ){
        //Create Menu --> später  Add/remove from scene
        this.menuGroup = new THREE.Group();

        //Bestimme Breite Rasters
        const w = 3;
        //Breite und Höhe eines Grid Elementes
        const b = 0.3;
        const h = 0.3;
        //Grid Element Position
        let xPos = 0;
        let yPos =-2;
        //Grid Element Abstand
        let margin = 0.1;
        //Offset für Menu
        let offset = ( (w*b) + (w-1)*(margin) )*0.5  - (b*0.5);

        //Erstelle Raster
        for(let i=0; i<objectsArray.length; i++){
            
            if( i%w == 0 ){ yPos++ };
                xPos = (i%w)*(b+margin)-offset;
                
            //Grid Element Hintergrund
            let plate = new THREE.Mesh(
                new THREE.BoxGeometry( b, h, 0.05 ),
                new THREE.MeshBasicMaterial({
                    color: 0xFFFFFF
                })
            )

            //Platziere Grid Gruppe und addiere Elemente
            let gridCard = new THREE.Group();
            gridCard.name = 'gridCard';
            gridCard.position.set( xPos,yPos*(margin+h),0 );

            plate.position.set( 0,0,-0.2 );
            gridCard.add( plate );

            gridCard.add( objectsArray[i] );

            //Füge Grid Element dem Menu hinzu
            this.menuGroup.renderOrder = 999;
            this.menuGroup.add( gridCard );
        };


    }; 

    alignMenu( cam ){
        cam.getWorldDirection( this.menuGroup.position );
        this.menuGroup.position.normalize();
        this.menuGroup.position.multiplyScalar( 1 );
        this.menuGroup.position.addVectors( this.menuGroup.position, cam.position );

        this.menuGroup.position.set( this.menuGroup.position.x, this.menuGroup.position.y, this.menuGroup.position.z );
        this.menuGroup.lookAt( cam.position );
    };

    getGridCard( obj ){
        let currentObj = obj;
        while( currentObj.parent ){
            if( currentObj.name == 'gridCard' ){ return currentObj };
            currentObj = currentObj.parent;
        };
    };    

    

};

export { GUI };
