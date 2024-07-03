import * as THREE from 'three';

/**************************************************************************************************************************
                                            Klasse für die darstellung der Szene
***************************************************************************************************************************/

class Enviroment{
    constructor(){
        this._init();
        this._basicSetup();
        this._createTestPlane();
    };

    _init(){
        //Szene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xffffff );

        //Kamera (FoV, AR, Near, Far Render Distance)
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.set( 0, 3, 10 );
        this.camera.lookAt( 0,0,0 );
        this.camera.updateProjectionMatrix();

        //Licht
        const pointLight = new THREE.PointLight( 0xfcf071, 20, 100 );
        pointLight.position.set( 3, 5, 2 );
        pointLight.castShadow = true;
        this.scene.add( pointLight );
        const ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.75 );
        this.scene.add( ambientLight );

        //Gruppe die später speziell vom Raycaster abgetastet werden soll
        this.raycasterGroup = new THREE.Group();
    };

    _basicSetup(){
        // Erstelle Test Plane
        const planeGeo = new THREE.PlaneGeometry(10,10,10,10);
        planeGeo.rotateX(-Math.PI / 2);
        const plane = new THREE.Mesh(
            planeGeo,
            new THREE.MeshPhongMaterial({color: 0xDDDD33})
        );
        plane.receiveShadow = true;

        // Erstelle Test Box
        const boxGeo = new THREE.BoxGeometry(1,1,1);
        const box = new THREE.Mesh(
            boxGeo,
            new THREE.MeshPhysicalMaterial({
                color: 0x37ad27,
                roughness: 0.5,
                metalness: 0.33,
                clearcoat: 0.75,
                clearcoatRoughness: 0.2,
            })
        );
        box.translateY( 1.6 );
        box.rotateX( 180/Math.PI*45 );
        box.rotateY( 180/Math.PI*45 );
        box.castShadow = true;
        box.receiveShadow = true;

        this.raycasterGroup.add( box );
        this.raycasterGroup.add( plane );
        this.scene.add( this.raycasterGroup );
    };

    addToScene( obj ){
        this.scene.add( obj );
    };

    removeFromScene( obj ){
        this.scene.remove( obj );
    };

    _createTestPlane(){
        let testPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3,3,3,3),
            new THREE.MeshBasicMaterial({
                color: 0x272727,
                wireframe: true
            })
        );
        testPlane.position.set( 0,1.5,-3 );
        this.scene.add( testPlane );
        this.indexArray = testPlane.geometry.getIndex().array;
        console.log( this.indexArray );
    };

};

export { Enviroment };
