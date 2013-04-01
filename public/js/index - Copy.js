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
})

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

init();

animate();

// init the scene
function init(){

    // #. set render
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

    // add Stats.js - https://github.com/mrdoob/stats.js
    //
    stats = new Stats();
    stats.domElement.style.position	= 'absolute';
    stats.domElement.style.bottom	= '0px';
    document.body.appendChild( stats.domElement );

    // create a scene
    scene = new THREE.Scene();

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

    createObjects(scene);

    // #. add plane
    //
    plane = new THREE.Mesh( new THREE.PlaneGeometry( 4000, 4000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
    plane.visible = false;
    scene.add( plane );

    // #. Events
    //
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    // handle selection
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

    // #. Others
    //
    // Projector
    projector = new THREE.Projector();

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

function onDocumentMouseMove( event ) {

    event.preventDefault();

    var raycaster = getRayCaster(event);

    if ( SELECTED ) {

        // Drag: move object along with the temp plane, to update the selected/moving object position
        var intersects = raycaster.intersectObject( plane );
        SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );
        return;
    }

    var intersects = raycaster.intersectObjects( objects );
    //var intersects = raycaster.intersectObjects( scene.children );

    if ( intersects.length > 0 ) {

        if ( INTERSECTED != intersects[ 0 ].object ) {

            // clear/restore previous pre-selected
            if ( INTERSECTED ) {
                //INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
                INTERSECTEDFACE.color.setHex(0x00ff80); //(INTERSECTEDFACE.currentHex);
            }

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            //INTERSECTED.material.color.setHex(0xff0000);

            // highlight face
            INTERSECTEDFACE = intersects[ 0 ].face;
            //INTERSECTEDFACE.currentHex = INTERSECTEDFACE.color.getHex();
            intersects[ 0 ].face.color.setHex(0xff8000);

            plane.position.copy( INTERSECTED.position );
            plane.lookAt( camera.position );

        }

        container.style.cursor = 'pointer';

    } else {

        if ( INTERSECTED ) {
            //INTERSECTED.material.color.setHex( INTERSECTED.currentHex );
            INTERSECTEDFACE.color.setHex(0x00ff80); //(INTERSECTEDFACE.currentHex);
        }

        INTERSECTED = null;
        INTERSECTEDFACE = null;

        container.style.cursor = 'auto';

    }

}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    projector.unprojectVector( vector, camera );

    var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    var intersects = raycaster.intersectObjects( objects );

    if ( intersects.length > 0 ) {

        controls.enabled = false;

        SELECTED = intersects[ 0 ].object;

        var intersects = raycaster.intersectObject( plane );
        offset.copy( intersects[ 0 ].point ).sub( plane.position );

        container.style.cursor = 'move';

    }
}

function onDocumentMouseUp( event ) {

    event.preventDefault();

    controls.enabled = true;

    if ( INTERSECTED ) {

        plane.position.copy( INTERSECTED.position );

        SELECTED = null;

    }

    container.style.cursor = 'auto';

}

function createGrid(scene) {
    // Grid

    var size = 500, step = 50;

    var geometry = new THREE.Geometry();

    for ( var i = - size; i <= size; i += step ) {

        geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
        geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

        geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
        geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );

    }

    var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );

    var line = new THREE.Line( geometry, material );
    line.type = THREE.LinePieces;
    scene.add( line );


    // Axis
    createWorkAxis();
}

function createWorkAxis() {
    createAxis(new THREE.Vector3(50, 0, 0), 0xff0000);  // red
    createAxis(new THREE.Vector3(0, 50, 0), 0x00ff00);  // green
    createAxis(new THREE.Vector3(0, 0, 50), 0x0000ff);  // blue
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

function createObjects(scene) {

    //    // #. Add objects
//    //
//    //var geometry	= new THREE.TorusGeometry( 1, 0.42 );
//    var geometry = new THREE.CubeGeometry(30, 40, 50);
//    var material	= new THREE.MeshNormalMaterial();
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

    var geometry = new THREE.CubeGeometry( 40, 40, 40 );

    for ( var i = 0; i < geometry.faces.length; i ++ ) {

        geometry.faces[ i ].color.setHex(0x0000ff); // 0x00ff80 );

    }

    for ( var i = 0; i < 3; i ++ ) {

        //var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

        var material = new THREE.MeshLambertMaterial( { vertexColors: THREE.FaceColors } );
        var object = new THREE.Mesh( geometry, material);

        object.material.ambient = object.material.color;

        object.position.x = Math.random() * 1000 - 500;
        object.position.y = Math.random() * 600 - 300;
        object.position.z = Math.random() * 800 - 400;

        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        object.scale.x = Math.random() * 2 + 1;
        object.scale.y = Math.random() * 2 + 1;
        object.scale.z = Math.random() * 2 + 1;

        //object.castShadow = true;
        //object.receiveShadow = true;

        scene.add( object );

        objects.push( object );

    }
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