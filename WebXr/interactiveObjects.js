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

        this._createTestObject();
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
};

export { interactiveObjects };