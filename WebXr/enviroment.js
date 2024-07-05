import * as THREE from 'three';
import { _vs, _fs } from './shaders.js';

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
        const pointLight = new THREE.PointLight( 0xFFFFFF, 20, 100 );
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
        this.shader_mat = new THREE.ShaderMaterial({
            uniforms: {
                iTime: {value: 0},
                iResolution: {value: new THREE.Vector3()}
            },
            vertexShader: _vs,
            fragmentShader: _fs,
        });

        const testPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3,3,3,3),
            this.shader_mat,
        );
        testPlane.position.set( 0,1.5,-3 );
        testPlane.castShadow = true;
        testPlane.receiveShadow = true;
        
        
        this.indexArray = testPlane.geometry.index.array;
        this.positionArray = Array.from( testPlane.geometry.attributes.position.array );

        for(let i=0; i<this.indexArray.length; i+=3){
            if(i==24){
                this.a = this.indexArray[i];
                this.b = this.indexArray[i+1];
                this.c = this.indexArray[i+2];
            }
        };

        for( let i=this.positionArray.length; i>=0; i-- ){
            if( i==this.a || i==this.b || i==this.c ){
                this.positionArray.splice(i,1);
            };
        };

        let newT =  new Float32Array( this.positionArray );
        //console.log( testPlane.geometry.attributes.position.array );

        
        // console.log( testPlane.geometry.attributes.position.array );
        // console.log( testPlane.geometry.index.array);

        this.raycasterGroup.add( testPlane );
    };

    animateShader( time, w, h ){
        const t = time * 0.001;
        this.shader_mat.uniforms.iResolution.value.set(w, h, 1);
        this.shader_mat.uniforms.iTime.value = t;
    };

};

export { Enviroment };
