/**
 * Created with JetBrains WebStorm.
 * User: zhanglo
 * Date: 3/27/13
 * Time: 1:44 AM
 * To change this template use File | Settings | File Templates.
 */

$(function() {
    // Full screen button
    //
    $('#btn_fullscreen').click(function(){
        if (!THREEx.FullScreen.activated()) {
            THREEx.FullScreen.request();
        }
        else{
            THREEx.FullScreen.cancel();
        }
    });

    $('#model_box').click(function(){
        if ($('#model_box').hasClass("active")){
            $('#model_box').removeClass("active");
            cancelSnapObj();
        }
        else {
            $('#model_box').addClass("active");
            createSnapObj();
        }
    });

    $('#model_simple').click(function(){
//        loadModelSTL();
        loadModelSTLEx('../model/stl/binary/customerFile1.stl', 18);
    });

    $('#model_fixtureRod').click(function() {
//        loadModelSTLEx('../model/stl/binary/fixtureRod.stl', 10);
        createSnapObjEX(50, 200, 50);
    })
    $('#model_fixtureCradle').click(function() {
//        loadModelSTLEx('../model/stl/binary/fixtureCradle.stl', 5);
        createSnapObjEX(60, 250, 60);
    })
    $('#model_human').click(function() {
        loadModelOBJ();
    })
    $('#btn_edit').click( function() {
        isEditMode = !isEditMode;
        if (isEditMode) {
            var ele = $('#btn_edit');
            ele.innerText = "Stop Edit";
        }
        else {
            $('#btn_edit').innerText = "Start Edit"
        }
    })
})

////////////////////////////////////////
// scene objects
var scene, renderer, projector;
// camera
var camera, cameraControls, controls;
// UI elements
var container, starts;

// objects
var objects = [], plane;
var mouse = new THREE.Vector2();
var	offset = new THREE.Vector3();
var	INTERSECTED, SELECTED;
var INTERSECTEDFACE;

// materials
var particleMaterial;

var canvasSizeObj;

var debugLine;

// support dragging/editing
var SELECTEDFACE;
var isEditMode = false;

////////////////////////////////////////
// Snap objects
var snapObj;
var snapPos = new THREE.Vector3();
var intersector;
var gridPlane;
var isContinueCreateObj = true;

function cancelSnapObj() {
    if (snapObj) {
        scene.remove(snapObj);
        snapObj = null;
    }
}
function createSnapObj() {
    isContinueCreateObj = true;
    cancelSnapObj();

    var geom = new THREE.CubeGeometry( 50, 50, 50 );
//    var mat = new THREE.MeshBasicMaterial( { color: 0x00ff00, opacity: 0.5, transparent: true } );
    var mat = new THREE.MeshNormalMaterial( {opacity: 0.5, transparent: true});

    snapObj = new THREE.Mesh( geom, mat );
    snapObj.position.copy(snapPos);
    snapObj.name = "snap object";
    objects.push( snapObj );
    scene.add( snapObj );
}

function createSnapObjEX(x, y, z) {
    isContinueCreateObj = false;
    cancelSnapObj();

    var geom = new THREE.CubeGeometry( x, y, z );
//    var mat = new THREE.MeshBasicMaterial( { color: 0x00ff00, opacity: 0.5, transparent: true } );
    var mat = new THREE.MeshNormalMaterial( {opacity: 0.5, transparent: true});

    snapObj = new THREE.Mesh( geom, mat );
    snapObj.position.copy(snapPos);
    snapObj.name = "snap object";
    objects.push( snapObj );
    scene.add( snapObj );
}

function setSnapObj(obj) {
    isContinueCreateObj = false;
    cancelSnapObj();
    snapObj = obj;
    snapObj.name = "snap object";
    objects.push( snapObj );
    scene.add( snapObj );
}

function getRealIntersector(intersects) {
    for( i = 0; i < intersects.length; i++ ) {
        intersector = intersects[ i ];
        if ( intersector.object != snapObj ) {
            return intersector;
        }
    }
    return null;
}

function getRealIntersectorExcludeGridPlane(intersects) {
    for( i = 0; i < intersects.length; i++ ) {
        intersector = intersects[ i ];
        if (( intersector.object != snapObj )
            && (intersector.object != gridPlane) ) {
            return intersector;
        }
    }
    return null;
}

function setSnapPosition(intersector) {
    var tmpVec = new THREE.Vector3();
    tmpVec.copy(intersector.face.normal);
    tmpVec.applyMatrix4(intersector.object.matrixRotationWorld);

    snapPos.addVectors(intersector.point, tmpVec);
    snapPos.x = Math.floor( snapPos.x / 50 ) * 50 + 25;
    snapPos.y = Math.floor( snapPos.y / 50 ) * 50 + 25;
    snapPos.z = Math.floor( snapPos.z / 50 ) * 50 + 25;
}

// Update snap object position
function updateSnapObject(intersects, iscommit) {
    if (snapObj) {
        intersector = getRealIntersector( intersects );
        if ( intersector ) {
            setSnapPosition( intersector );
            //snapObj.position = snapPos;
            snapObj.position.copy(snapPos);

            // Add snap object when mouse down
            if (iscommit) {
                //snapObj.matrixAutoUpdate = false;
                snapObj.updateMatrix();
                //snapObj.matrixAutoUpdate = true;
                snapObj.material.opacity = 1.0;
                snapObj = null;

                if (isContinueCreateObj) {
                    createSnapObj();
                }
            }
        }
    }
}

// end of snap object
////////////////////////////////////////

////////////////////////////////////////
// loader
var FLOOR = -250;

function loadModelSTLEx(file, scale) {
    // Binary files

    var material = new THREE.MeshPhongMaterial( { ambient: 0x555555, color: 0xAAAAAA, specular: 0x111111, shininess: 200 } );

    var loader = new THREE.STLLoader();
    loader.addEventListener( 'load', function ( event ) {
        var geometry = event.content;
        var mesh = new THREE.Mesh( geometry, material );

        mesh.position.set( 0, - 0.37, - 0.6 );
        //mesh.rotation.set( - Math.PI / 2, 0, 0 );
        mesh.scale.set( scale, scale, scale );

        //mesh.castShadow = true;
        //mesh.receiveShadow = true;

//        scene.add( mesh );
//        objects.push(mesh);
        setSnapObj(mesh);

    } );
    loader.load( file );
}

function loadModelSTL() {
    var loader = new THREE.STLLoader();
    loader.addEventListener( 'load', function ( event ) {
        //createSnapObj();
        var geometry = event.content; // new THREE.CubeGeometry(30, 40, 50);
        var material = new THREE.MeshPhongMaterial( { ambient: 0xff5533, color: 0xff5533, specular: 0x111111, shininess: 200 } );
        var mesh = new THREE.Mesh( geometry, material );

        mesh.position.set( 0, - 0.25, 0.6 );
        mesh.rotation.set( 0, - Math.PI / 2, 0 );
        mesh.scale.set( 15, 15, 15 );

        //mesh.castShadow = true;
        //mesh.receiveShadow = true;

        //scene.add( mesh );
        //objects.push(mesh); // support dragging

        setSnapObj(mesh);

    } );
    //loader.load( 'http://localhost/model/stl/ascii/slotted_disk.stl' );
    //loader.load( 'http://localhost/model/stl/ascii/part1.stl' );
    loader.load( '../model/stl/ascii/simpleModel.stl' );


//    var loader = new THREE.STLLoader();
//    loader.addEventListener( 'load', function ( event ) {
//
//        var geometry = event.content;
//        var mesh = new THREE.Mesh( geometry, material );
//
//        mesh.position.set( 0.136, - 0.37, - 0.6 );
//        mesh.rotation.set( - Math.PI / 2, 0.3, 0 );
//        mesh.scale.set( 2, 2, 2 );
//
//        mesh.castShadow = true;
//        mesh.receiveShadow = true;
//
//        scene.add( mesh );
//
//    } );
//    loader.load( 'http://localhost/model/stl/binary/pr2_head_tilt.stl' );
}

function loadModelOBJ() {
    var loader = new THREE.JSONLoader();
    var callbackMale = function ( geometry, materials ) { createScene222( geometry, materials, 90, FLOOR, 50, 105 ) };
    var callbackFemale = function ( geometry, materials ) { createScene222( geometry, materials, -80, FLOOR, 50, 0 ) };

    //loader.load( "../model/obj/male02/Male02_dds.js", callbackMale );
    loader.load( "../model/obj/female02/Female02_slim.js", callbackFemale );
    //loader.load( "http://localhost/model/obj/box/box.js", callbackFemale );
}

function createScene222( geometry, materials, x, y, z, b ) {

    zmesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial( materials ) );
    zmesh.position.set( x, y, z );
    zmesh.scale.set( 2, 2, 2 );
    //scene.add( zmesh );
    setSnapObj(zmesh);

    //createMaterialsPalette( materials, 100, b );

}

function createMaterialsPalette( materials, size, bottom ) {

    for ( var i = 0; i < materials.length; i ++ ) {

        // material

        mesh = new THREE.Mesh( new THREE.PlaneGeometry( size, size ), materials[i] );
        mesh.position.x = i * (size + 5) - ( ( materials.length - 1 )* ( size + 5 )/2);
        mesh.position.y = FLOOR + size/2 + bottom;
        mesh.position.z = -100;
        scene.add( mesh );

        // number

        var x = document.createElement( "canvas" );
        var xc = x.getContext( "2d" );
        x.width = x.height = 128;
        xc.shadowColor = "#000";
        xc.shadowBlur = 7;
        xc.fillStyle = "orange";
        xc.font = "50pt arial bold";
        xc.fillText( i, 10, 64 );

        var xm = new THREE.MeshBasicMaterial( { map: new THREE.Texture( x ), transparent: true } );
        xm.map.needsUpdate = true;

        mesh = new THREE.Mesh( new THREE.PlaneGeometry( size, size ), xm );
        mesh.position.x = i * ( size + 5 ) - ( ( materials.length - 1 )* ( size + 5 )/2);
        mesh.position.y = FLOOR + size/2 + bottom;
        mesh.position.z = -99;
        scene.add( mesh );

    }

}

////////////////////////////////////////


init();

animate();

//////////////////////////////////////////////
// Basic Methods
//////////////////////////////////////////////

// init the scene
function init(){

    createCanvas();

    createCanvasControls();

    createBasicObjects();

    //createObjects();


    scene.add( plane );
}

// animation loop
function animate() {

    // loop on request animation loop
    // - it has to be at the begining of the function
    // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
    requestAnimationFrame( animate );

    controls.update();

    // do the render
    render();

    // update stats
    stats.update();
}

// render the scene
function render() {

    // update camera controls
    //cameraControls.update();

    // actually render the scene
    renderer.render( scene, camera );
}

//////////////////////////////////////////////
// Mouse Events
//////////////////////////////////////////////

function onDocumentMouseMove( event ) {

    event.preventDefault();

    var raycaster = getRayCaster(event);

    // #. Drag/move object along temp plane by updating its position
    if ( SELECTED ) {
        var intersects = raycaster.intersectObject( plane );

        if (!isEditMode) {
            SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );
            return;
        }

        // drag the face
        var va = SELECTED.geometry.vertices[SELECTEDFACE.a];
        var vb = SELECTED.geometry.vertices[SELECTEDFACE.b];
        var vc = SELECTED.geometry.vertices[SELECTEDFACE.c];
        var vd = SELECTED.geometry.vertices[SELECTEDFACE.d];

        var faceNormal = SELECTEDFACE.normal;
        var offset2 = faceNormal.multiplyScalar(1);
        va.add(offset2);
        vb.add(offset2);
        vc.add(offset2);
        if (vd) {
            vd.add(offset2);
        }
        //SELECTED.geometry.height += 20;

        SELECTED.geometry.verticesNeedUpdate = true;
        //SELECTED.geometry.elementsNeedUpdate = true;
        //SELECTED.geometry.computeBoundingSphere();
        return;
    }

    var intersects = raycaster.intersectObjects( objects );
    //var intersects = raycaster.intersectObjects( scene.children );

    // #. Support drag selected object
    var interobj = getRealIntersectorExcludeGridPlane(intersects);
    if (interobj) {
        if ( INTERSECTED != interobj.object ) {
             // clear/restore previous pre-selected
            if ( INTERSECTED ) {
                //INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
            }

            INTERSECTED = interobj.object;
            //INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            //INTERSECTED.material.color.setHex(0xff0000);

            plane.position.copy( INTERSECTED.position );
            plane.lookAt( camera.position );
        }
        container.style.cursor = 'pointer';

        // Highlight face
        //
        if (INTERSECTEDFACE) {
            INTERSECTEDFACE.color.setHex(0x00ff80);
        }
        INTERSECTEDFACE = interobj.face;
        INTERSECTEDFACE.color.setHex(0xff8000);
    }
    else {
        if ( INTERSECTED ) {
            //INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
            //INTERSECTEDFACE.color.setHex(0x00ff80); //(INTERSECTEDFACE.currentHex);
        }
        INTERSECTED = null;
        INTERSECTEDFACE = null;

        container.style.cursor = 'auto';
    }

    updateSnapObject(intersects);
}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    projector.unprojectVector( vector, camera );
    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    var intersects = raycaster.intersectObjects( objects );

    // #. Select object to drag later
    var interobj = getRealIntersectorExcludeGridPlane(intersects);
    if (interobj) {
        controls.enabled = false;

        SELECTED = interobj.object;
        SELECTEDFACE = interobj.face;

        var intersects2 = raycaster.intersectObject( plane );
        offset.copy( intersects2[ 0 ].point ).sub( plane.position );

        container.style.cursor = 'move';
    }

    // Add snap object when mouse down
    updateSnapObject(intersects, true);
}

function onDocumentMouseUp( event ) {

    event.preventDefault();

    controls.enabled = true;

    if ( INTERSECTED ) {

        plane.position.copy( INTERSECTED.position );

        SELECTED = null;
        SELECTEDFACE = null;

    }

    container.style.cursor = 'auto';

}

//////////////////////////////////////////////
// Helper methods
//////////////////////////////////////////////

function createCanvas() {
    // #. create render
    //
    if( Detector.webgl ){
        renderer = new THREE.WebGLRenderer({
            antialias		: true,	// to get smoother output
            preserveDrawingBuffer	: true	// to allow screenshot
        });

        // below makes grid hard to see
//        renderer.setClearColorHex( 0xBBBBBB, 1 );

        // uncomment if webgl is required
        //}else{
        //	Detector.addGetWebGLMessage();
        //	return true;
    }else{
        renderer	= new THREE.CanvasRenderer();
    }

    // Settings
    //
    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

//    renderer.setSize( window.innerWidth, window.innerHeight );
    canvasSizeObj = getCanvasSize(container);
    renderer.setSize(canvasSizeObj.width, canvasSizeObj.height);

    // further settings
    // below settings require adding needed light
    //
//    renderer.sortObjects = false;
//    renderer.shadowMapEnabled = true;
//    renderer.shadowMapType = THREE.PCFShadowMap;

    // create a scene
    scene = new THREE.Scene();

    // add Stats.js - https://github.com/mrdoob/stats.js
    //
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild( stats.domElement );
}

function createCanvasControls() {
    // #. camera
    //
    //camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera = new THREE.PerspectiveCamera(40, canvasSizeObj.aspect, 1, 10000 );
    //camera.position.set(200, 300, 500);
    camera.position.x = 500;
    camera.position.y = 700;
    camera.position.z = 1000;
    scene.add(camera);

    // #. camera contol
    //cameraControls	= new THREEx.DragPanControls(camera)
    // use orbit control
    //controls = new THREE.OrbitControls( camera );
    //controls.addEventListener( 'change', render );
    controls = new THREE.TrackballControls( camera, renderer.domElement, container );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    createLight(scene);

    // #. window resize/screenshot/fullscreen
    //
    THREEx.WindowResize.bind(renderer, camera, container);
    // allow 'p' to make screenshot
    THREEx.Screenshot.bindKey(renderer);
    // allow 'f' to go fullscreen where this feature is supported
    if( THREEx.FullScreen.available() ){
        THREEx.FullScreen.bindKey();
        document.getElementById('inlineDoc').innerHTML	+= "- <i>f</i> for fullscreen";
    }

    // #. Events
    //
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    // handle selection
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

    // Projector
    projector = new THREE.Projector();
}

function getRayCaster(mouseEvent) {

    canvasSizeObj = getCanvasSize(container);

    var adjustedClientX = event.clientX - container.offsetLeft;
    var adjustedClientY = event.clientY - container.offsetTop;

    mouse.x = ( adjustedClientX / canvasSizeObj.width ) * 2 - 1;
    mouse.y = - ( adjustedClientY / canvasSizeObj.height ) * 2 + 1;

    //mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    //mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    projector.unprojectVector( vector, camera );

    // test
    var dir = vector.sub( camera.position ).normalize();

    var raycaster = new THREE.Raycaster( camera.position, dir );

    var v2 = new THREE.Vector3();
    v2.set(camera.position.x, camera.position.y, camera.position.z);
    var dirtemp = new THREE.Vector3();
    dirtemp.x = dir.x;
    dirtemp.y = dir.y;
    dirtemp.z = dir.z;
    v2.add(dirtemp.multiplyScalar(2000));
    debugCreateLine(camera.position, v2);

    return raycaster;
}

function createGrid(scene) {
    // Grid
    var geometry = new THREE.PlaneGeometry( 1000, 1000, 20, 20 );
    var material = new THREE.MeshBasicMaterial( { color: 0x555555, wireframe: true } );

    gridPlane = new THREE.Mesh(geometry, material);
    // plane is created at xy plane by default, so rotate -90 by x axis
    gridPlane.rotation.x = - Math.PI / 2;
    gridPlane.visible = true;
    gridPlane.name = "grid plane";
    scene.add( gridPlane );
    objects.push(gridPlane);

    // Another way to create grid
    //
//    var size = 500, step = 50;
//    var geometry = new THREE.Geometry();
//    for ( var i = - size; i <= size; i += step ) {
//
//        geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
//        geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );
//
//        geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
//        geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );
//    }
//    var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
//    var line = new THREE.Line( geometry, material );
//    line.type = THREE.LinePieces;
//    scene.add( line );


    // Axis
    createWorkAxis();
}

function createWorkAxis() {
    createAxis(new THREE.Vector3(100, 0, 0), 0xff0000);  // red
    createAxis(new THREE.Vector3(0, 100, 0), 0x00ff00);  // green
    createAxis(new THREE.Vector3(0, 0, 100), 0x0000ff);  // blue
}

function createAxis(point, color) {
    var geom = new THREE.Geometry();
    geom.vertices.push( new THREE.Vector3(0, 0, 0) );
    geom.vertices.push( point );
    var mat = new THREE.LineBasicMaterial( { color: color } );
    mat.linewidth = 2;

    var axisLine = new THREE.Line(geom, mat);
    axisLine.type = THREE.LinePieces;
    scene.add( axisLine );
}

function debugCreateLine(p1, p2) {

    if (debugLine) {
        scene.remove(debugLine);
    }
    var geom = new THREE.Geometry();
    geom.vertices.push( p1 );
    geom.vertices.push( p2 );
    var mat = new THREE.LineBasicMaterial( { color: 0xff0000 } );

    debugLine = new THREE.Line(geom, mat);
    debugLine.type = THREE.LinePieces;
    scene.add( debugLine );
}

function createLight(scene) {

    // add light in scene
//    scene.add( new THREE.AmbientLight( 0x505050 ) );
//    var light = new THREE.SpotLight( 0xffffff, 1.5 );
//    light.position.set( 0, 500, 2000 );
//    light.castShadow = true;
//    light.shadowCameraNear = 200;
//    light.shadowCameraFar = camera.far;
//    light.shadowCameraFov = 50;
//    light.shadowBias = -0.00022;
//    light.shadowDarkness = 0.5;
//    light.shadowMapWidth = 2048;
//    light.shadowMapHeight = 2048;
//    scene.add( light );

    var ambientLight = new THREE.AmbientLight( 0x606060 );
    scene.add( ambientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff );
    directionalLight.position.x = Math.random() - 0.5;
    directionalLight.position.y = Math.random() - 0.5;
    directionalLight.position.z = Math.random() - 0.5;
    directionalLight.position.normalize();
    scene.add( directionalLight );

    var directionalLight = new THREE.DirectionalLight( 0x808080 );
    directionalLight.position.x = Math.random() - 0.5;
    directionalLight.position.y = Math.random() - 0.5;
    directionalLight.position.z = Math.random() - 0.5;
    directionalLight.position.normalize();
    scene.add( directionalLight );

}

function createBasicObjects() {
    // #. add plane
    //
    plane = new THREE.Mesh( new THREE.PlaneGeometry( 4000, 4000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
    plane.visible = false;
    plane.name = "plane for intersection";
    //scene.add( plane );

    // partical material
    var PI2 = Math.PI * 2;
    particleMaterial = new THREE.ParticleCanvasMaterial( {
        color: 0x000000,
        program: function ( context ) {

            context.beginPath();
            context.arc( 0, 0, 1, 0, PI2, true );
            context.closePath();
            context.fill();
        }
    } );

    createGrid(scene);
}

function createObjects() {

    //    // #. Add objects
//    //
//    //var geometry	= new THREE.TorusGeometry( 1, 0.42 );
//    var geometry = new THREE.CubeGeometry(30, 40, 50);
    var material	= new THREE.MeshNormalMaterial();
//    //material.opacity = 0.5;
//    var material2 = new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, opacity: 1.0 } );
//    var object1	= new THREE.Mesh( geometry, material );
//    scene.add( object1 );
//    objects.push( object1 );
//
//    // add another object
//    var geometry2 = new THREE.CylinderGeometry(30, 30, 60, 60);
//    var object2 = new THREE.Mesh( geometry2, material2 );
//    object2.position.x = 50;
//    object2.position.y = 50;
//    object2.position.z = 50;
//    scene.add(object2);
//    objects.push( object2 );

    //var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xffffcc } );
    //var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );
    //var multiMaterial = [ darkMaterial, wireframeMaterial ];

    var geometry = new THREE.CubeGeometry( 50, 50, 50 );

    for ( var i = 0; i < geometry.faces.length; i ++ ) {

        geometry.faces[ i ].color.setHex(0x00ff80);

    }

    for ( var i = 0; i < 3; i ++ ) {

        //var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

        var material = new THREE.MeshLambertMaterial( { vertexColors: THREE.FaceColors } );
        var object = new THREE.Mesh( geometry, material);

        object.material.ambient = object.material.color;

        object.position.x = Math.random() * 1000 - 500;
        object.position.y = Math.random() * 600 - 300;
        object.position.y = 0;
        object.position.z = Math.random() * 800 - 400;

//        object.rotation.x = Math.random() * 2 * Math.PI;
//        object.rotation.y = Math.random() * 2 * Math.PI;
//        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() * 2 + 1;
        object.scale.y = Math.random() * 2 + 1;
        object.scale.z = Math.random() * 2 + 1;

        //object.castShadow = true;
        //object.receiveShadow = true;

        object.name = "geom-" + i;
        scene.add( object );

        objects.push( object );
    }

    //createSnapObj();
}

function getCanvasSize(container) {
    var  canvasOffsetLeft = container.offsetLeft;
    var  canvasOffsetTop = container.offsetTop;
    var  canvasWidth = window.innerWidth - canvasOffsetLeft - 20;
    var  canvasHeight = window.innerHeight - canvasOffsetTop - 20;

    var canvasSizeObj = {};
    canvasSizeObj.width = canvasWidth;
    canvasSizeObj.height = canvasHeight;
    canvasSizeObj.aspect =  canvasWidth / canvasHeight;

    return canvasSizeObj;
}