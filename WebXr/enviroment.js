import * as THREE from 'three';
import { _vs, _fs } from './shaders.js';
import { XRButton } from 'three/addons/webxr/XRButton.js';

//Post Processing
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GlitchPass } from 'three/examples/jsm/Addons.js';
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
        this.debugTexture = new THREE.CanvasTexture(this.ctx.canvas);
        
        
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

    // //Post Processing                                                                        //<------ PostProcessing
        this.composer = new EffectComposer( this.renderer );
        const renderPass = new RenderPass( this.scene, this.camera );
        this.composer.addPass( renderPass );

        const glitchPass = new GlitchPass( );
        this.composer.addPass( glitchPass );

        const outputPass = new OutputPass();
        this.composer.addPass( outputPass );


    };

    _basicSetup(){
        // Erstelle Boden unsichtbar
        const groundPlaneGeo = new THREE.PlaneGeometry(100,100,10,10);
        groundPlaneGeo.rotateX(-Math.PI / 2);
        const groundPlane = new THREE.Mesh(
            groundPlaneGeo,
            new THREE.MeshPhongMaterial({color: 0xDDDD33, colorWrite: false})
        );
        groundPlane.receiveShadow = true;

        // Erstelle Innere Box mit Textur
        const innerBoxGeo = new THREE.BoxGeometry(0.499,0.499,0.499);
        this.shader_mat = new THREE.ShaderMaterial({
            uniforms: {
                iTime: {value: 0},
                iResolution: {value: new THREE.Vector3()}
            },
            vertexShader: _vs,
            fragmentShader: _fs,
            side: THREE.BackSide,
        });
        const innerBox = new THREE.Mesh(
            innerBoxGeo,
            this.shader_mat,
        );
        //Platziere innere Box
        innerBox.translateY( 0.5 );
        innerBox.translateZ( -0.0 );
        innerBox.castShadow = true;
        innerBox.receiveShadow = true;

        //Erstelle äußere Box unsichtbar
        let outerBoxGeo = new THREE.BoxGeometry( 0.5,0.5,0.5 );
        let outerBoxMat = new THREE.MeshBasicMaterial({ color: 0xFF0000, colorWrite: false });
        let faceIndex = 2;
        // erstelle neues IndexArray, das die die unerwünschten Flächen ausschließt
        let newIndices = [];
        for (let i = 0; i < outerBoxGeo.index.count; i += 6) {
                if (i !== faceIndex * 6) {
                    newIndices.push(
                        outerBoxGeo.index.array[i], 
                        outerBoxGeo.index.array[i + 1], 
                        outerBoxGeo.index.array[i + 2],
                        outerBoxGeo.index.array[i + 3],
                        outerBoxGeo.index.array[i + 4],
                        outerBoxGeo.index.array[i + 5]
                    );
                };
        };
        outerBoxGeo.setIndex(new THREE.BufferAttribute(new Uint16Array(newIndices), 1));
        let outerBox = new THREE.Mesh( outerBoxGeo, outerBoxMat );
        //Platziere äußere Box
        outerBox.translateY( 0.5 );
        outerBox.translateZ( -0.0 );
        outerBox.renderOrder = -1;

        //erstelle Plane als Fenster
        let windowPlaneGeo = new THREE.PlaneGeometry(0.5, 0.5, 7, 7);
        //entferene Face aus der Plane
        let planeIndex = 24;
        let planeIndices = [];
        for( let i=0; i<windowPlaneGeo.index.count; i+=6 ){
            if( i !== planeIndex * 6 ){
                planeIndices.push(
                    windowPlaneGeo.index.array[i],
                    windowPlaneGeo.index.array[i + 1],
                    windowPlaneGeo.index.array[i + 2],
                    windowPlaneGeo.index.array[i + 3],
                    windowPlaneGeo.index.array[i + 4],
                    windowPlaneGeo.index.array[i + 5]
                );
            };
        };
        windowPlaneGeo.setIndex(new THREE.BufferAttribute(new Uint16Array( planeIndices ), 1));
        let windowPlane = new THREE.Mesh( windowPlaneGeo, new THREE.MeshBasicMaterial({ color: 0xFF0000, colorWrite: false }) );
        //Platziere Fenster Plane
        windowPlane.translateY( 0.5 + 0.25 );
        windowPlane.rotateX( (Math.PI/180) * 270 );
        windowPlane.renderOrder = -1;

        this.scene.add( windowPlane );
        this.raycasterGroup.add( innerBox );
        this.scene.add( outerBox )
        this.raycasterGroup.add( groundPlane );
        this.scene.add( this.raycasterGroup );
    };

    addToScene( obj ){
        this.scene.add( obj );
    };

    removeFromScene( obj ){
        this.scene.remove( obj );
    };

    _createDebugPlane(){
        const debugPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3,3,3,3),
            new THREE.MeshBasicMaterial({
                map: this.debugTexture
            })
        );
        debugPlane.position.set( 0,1.5,-3 );
        debugPlane.castShadow = true;
        debugPlane.receiveShadow = true;

        this.raycasterGroup.add( debugPlane );
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
