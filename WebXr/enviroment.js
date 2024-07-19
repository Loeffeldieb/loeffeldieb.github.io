import * as THREE from 'three';
import { _vs, _fs } from './shaders.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';
/**************************************************************************************************************************
                                            Klasse für die darstellung der Szene
***************************************************************************************************************************/

class Enviroment{
    constructor(){
        this._init();
        this._basicSetup();
        
        // Plane Canvas zum Debuggen 
        //this._createTestPlane();
    };

    _init(){
        //Config Renderer
        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );  //  <-----
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.xr.enabled = true;                                                    //  <-----
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 3.0;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild( this.renderer.domElement );

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

        //Flags für den Controller
        this.isSelected = false;
        this.a_Button_ON = false;
        this.b_Button_ON = false;
        this.isConnected = false;

        //Starte XR mit Button
        const sessionInit = {
            optionalFeatures: [ 
                'hand-tracking',
                //'hit-test'
                ]
        };
        document.body.appendChild(XRButton.createButton( this.renderer, sessionInit ));      //<----------


        //Canvas zum Debuggen
        this.ctx = document.createElement('canvas').getContext('2d');
        this.ctx.canvas.width = 256;
        this.ctx.canvas.height = 256;
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.texture = new THREE.CanvasTexture(this.ctx.canvas);
        
        
        //Controller Variablen für Controller und Hand
        this.controller = this.renderer.xr.getController( 0 );
        this.scene.add( this.controller );

        // this.controller.addEventListener('connected', (e) => {
        //     this.controller.gamepad = e.data.gamepad;
        //     this.isConnected = true;
           
        // });
        // this.controller.addEventListener('disconnected', (e) => {
        //     this.isConnected = false;
        // });
        
        //Eventlistener Für den Select Button am Controller
        //this.controller.addEventListener( 'selectstart', this.onSelectStart );
	    //this.controller.addEventListener( 'selectend', this.onSelectEnd );
    };

    _basicSetup(){
        // Erstelle Test Plane
        const planeGeo = new THREE.PlaneGeometry(100,100,10,10);
        planeGeo.rotateX(-Math.PI / 2);
        const plane = new THREE.Mesh(
            planeGeo,
            new THREE.MeshPhongMaterial({color: 0xDDDD33, colorWrite: false})
        );
        plane.receiveShadow = true;

        // Erstelle Test Box
        const boxGeo = new THREE.BoxGeometry(0.5,0.5,0.5);
        
        this.shader_mat = new THREE.ShaderMaterial({
            uniforms: {
                iTime: {value: 0},
                iResolution: {value: new THREE.Vector3()}
            },
            vertexShader: _vs,
            fragmentShader: _fs,
            side: THREE.BackSide,
        });

        const box = new THREE.Mesh(
            boxGeo,
            this.shader_mat
        );


        box.translateY( 1.6 );
        box.translateZ( -1.0 );
        box.rotateX( 180/Math.PI*45 );
        box.rotateY( 180/Math.PI*45 );
        box.castShadow = true;
        box.receiveShadow = true;


        //Umantelnde Box für Portal Effect
        let boxGeo2 = new THREE.BoxGeometry( 0.501,0.501,0.501 );
        let boxMat2 = new THREE.MeshBasicMaterial({ colorWrite: false });
        let faceIndex = 2;
        // Create a new index array that excludes the indices corresponding to the vertices of the face
        let newIndices = [];
        for (let i = 0; i < boxGeo2.index.count; i += 6) {
                if (i !== faceIndex * 6) {
                    newIndices.push(
                        boxGeo2.index.array[i], 
                        boxGeo2.index.array[i + 1], 
                        boxGeo2.index.array[i + 2],
                        boxGeo2.index.array[i + 3],
                        boxGeo2.index.array[i + 4],
                        boxGeo2.index.array[i + 5])
                };
        };
        boxGeo2.setIndex(new THREE.BufferAttribute(new Uint16Array(newIndices), 1));
        let box2 = new THREE.Mesh( boxGeo2, boxMat2 );
        box2.translateY( 1.6 );
        box2.translateZ( -1.0 );
        box2.rotateX( 180/Math.PI*45 );
        box2.rotateY( 180/Math.PI*45 );
        box2.renderOrder = -1;

        this.raycasterGroup.add( box );
        this.scene.add( box2 )
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
        const testPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3,3,3,3),
            new THREE.MeshBasicMaterial({
                map: this.texture
            })
        );
        testPlane.position.set( 0,1.5,-3 );
        testPlane.castShadow = true;
        testPlane.receiveShadow = true;

        this.raycasterGroup.add( testPlane );
    };

    animateShader( time, w, h ){
        const t = time * 0.001;
        this.shader_mat.uniforms.iResolution.value.set(w, h, 1);
        this.shader_mat.uniforms.iTime.value = t;
    };

    onSelectStart(){
        this.isSelected = true;
    };

    onSelectEnd(){
        this.isSelected = false;
    };

};

export { Enviroment };
