"use strict";

var canvas;
var gl;
var program;
var deltaLeg1=0;
var giraTesta=1;

//-------------
var texSize = 256;
var numChecks = 8;
var texture1, texture2;
var t1, t2;

var c;

var flag = true;

var image1 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
            //c = 255*(((i & 0x8) == 0) ^ ((j & 0x8)  == 0))
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

var image2 = new Uint8Array(4*texSize*texSize);

    // Create a checkerboard pattern
    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            image2[4*i*texSize+4*j] = j;
            image2[4*i*texSize+4*j+1] = j;
            image2[4*i*texSize+4*j+2] = j;
            image2[4*i*texSize+4*j+3] = 255;
           }
    }
    var texCoordsArray = [];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

//--------------
//var steps=0;
var animOn=false;
var alternate=true;


var projectionMatrix;
var modelViewMatrix;

var instanceMatrix;

var modelViewMatrixLoc;

var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

//---------------
function configureTexture() {
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}
//------------------------

var transAn=0;
var bodyId = 0;
var headId  = 1;
var head1Id = 1;
var head2Id = 11;
var leftUpperAnteriorLegId = 2;
var leftLowerAnteriorLegId = 3;
var rightUpperAnteriorLegId = 4;
var rightLowerAnteriorLegId = 5;
var leftUpperPosteriorLegId = 6;
var leftLowerPosteriorLegId = 7;
var rightUpperPosteriorLegId = 8;
var rightLowerPosteriorLegId = 9;
var tailId=10;

//var bodyDepth=3;
var bodyHeight = 4;
var bodyWidth = 5;
var bodyDepth=8;
var UpperAnteriorLegHeight = 2.5;
var LowerAnteriorLegHeight = 1.5;
var UpperAnteriorLegWidth  = 1.0;
var LowerAnteriorLegWidth  = 1.0;
var UpperPosteriorLegWidth  = 1.0;
var LowerPosteriorLegWidth  = 1.0;
var LowerPosteriorLegHeight = 1.5;
var UpperPosteriorLegHeight = 2.5;
var headHeight = 3.0;
var headWidth = 3.0;
var headDepth = 5.0;
var tailWidth=0.75;
var tailHeight=0.75;
var tailDepth=2.5;


var numNodes = 11;
var numAngles = 12;
var angle = 0;

var theta = [0, 0, 180, 0, 180, 0, 180, 0, 180, 0, 45, 0];

var numVertices = 24;

var stack = [];

var figure = [];

for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------


function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}
function stopAnimation() {
    transAn=0;
    theta[leftUpperAnteriorLegId]=180;
    theta[rightUpperPosteriorLegId]=180;
    theta[rightUpperAnteriorLegId]=180;
    theta[leftUpperPosteriorLegId]=180;
    theta[leftLowerAnteriorLegId]=0;
    theta[rightLowerPosteriorLegId]=0;
    theta[rightLowerAnteriorLegId]=0;
    theta[leftLowerPosteriorLegId]=0;
    deltaLeg1=0;
    theta[head2Id]=0;
    initNodes(leftUpperAnteriorLegId);
    initNodes(rightUpperPosteriorLegId);
    initNodes(bodyId);
    initNodes(rightUpperAnteriorLegId);
    initNodes(leftUpperPosteriorLegId);
    initNodes(leftLowerAnteriorLegId);
    initNodes(rightLowerPosteriorLegId);
    initNodes(head2Id);
    initNodes(rightLowerAnteriorLegId);
    initNodes(leftLowerPosteriorLegId);
    return;
}
function animation() {
      theta[head2Id]-=1*giraTesta;
      if(theta[head2Id]==-90 || theta[head2Id]==0){
        giraTesta=-giraTesta;
      }
      initNodes(head2Id);
      if(deltaLeg1<30 && alternate){


    theta[leftUpperAnteriorLegId]=180+deltaLeg1;
    theta[rightUpperPosteriorLegId]=180+deltaLeg1;
    theta[leftLowerAnteriorLegId]=deltaLeg1;
    theta[rightLowerPosteriorLegId]=deltaLeg1;

    initNodes(leftUpperAnteriorLegId);
    initNodes(rightUpperPosteriorLegId);
    initNodes(bodyId);
    theta[rightUpperAnteriorLegId]=180-deltaLeg1;
    theta[leftUpperPosteriorLegId]=180-deltaLeg1;
    theta[leftLowerPosteriorLegId]=deltaLeg1;
    theta[rightLowerAnteriorLegId]=deltaLeg1;
    initNodes(rightLowerPosteriorLegId);
    initNodes(rightLowerAnteriorLegId);
    initNodes(leftLowerPosteriorLegId);
    initNodes(rightUpperAnteriorLegId);
    initNodes(leftUpperPosteriorLegId);
    initNodes(leftLowerAnteriorLegId);
    //steps-=0.5;
    deltaLeg1+=0.50;
    transAn+=0.25;
    //headHeight+=1;
    if(deltaLeg1==30) alternate=!alternate;

    return;}

    else{
      transAn+=0.25;
      initNodes(bodyId);
      theta[leftUpperAnteriorLegId]=180+deltaLeg1;
      theta[rightUpperPosteriorLegId]=180+deltaLeg1;
      theta[leftLowerAnteriorLegId]=deltaLeg1;
      theta[rightLowerPosteriorLegId]=deltaLeg1;
      initNodes(leftUpperAnteriorLegId);
      initNodes(rightUpperPosteriorLegId);
      theta[rightUpperAnteriorLegId]=180-deltaLeg1;
      theta[leftUpperPosteriorLegId]=180-deltaLeg1;
      theta[leftLowerPosteriorLegId]=deltaLeg1;
      theta[rightLowerAnteriorLegId]=deltaLeg1;
      initNodes(rightUpperAnteriorLegId);
      initNodes(leftUpperPosteriorLegId);
      initNodes(leftLowerAnteriorLegId);
      initNodes(rightLowerPosteriorLegId);
      initNodes(rightLowerAnteriorLegId);
      initNodes(leftLowerPosteriorLegId);
      initNodes(leftLowerAnteriorLegId);
      //steps-=0.5;
      deltaLeg1-=0.5;

      if(deltaLeg1<1) alternate=!alternate;
      return;
    }




}
function round(param){
  if (param>30) param=-60
 return param;
}

function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case bodyId:
    transAn=round(transAn);
    m= mult(m,translate(transAn, 25.0, 0.0));
    m = mult(m,rotate(90, 0, 1, 0 ));

    figure[bodyId] = createNode( m, body, null, headId );

    break;

    case headId:
    case head1Id:
    case head2Id:


    m = translate(0.0, bodyHeight+0.5*headHeight, +0.5*(bodyDepth)+0.25*(headDepth));
  	m = mult(m, rotate(theta[head1Id], 1, 0, 0))
	  m = mult(m, rotate(theta[head2Id], 0, 1, 0));
    m = mult(m, translate(0.0, -0.5*headHeight, 0.0));
    figure[headId] = createNode( m, head, leftUpperAnteriorLegId, null);
    break;


    case leftUpperAnteriorLegId:

    m = translate((-0.5*bodyWidth+0.5*UpperAnteriorLegWidth), 0.1*bodyHeight, (0.5*bodyDepth-0.5*LowerAnteriorLegWidth));
	m = mult(m, rotate(theta[leftUpperAnteriorLegId], 1, 0, 0));
    figure[leftUpperAnteriorLegId] = createNode( m, leftUpperAnteriorLeg, rightUpperAnteriorLegId, leftLowerAnteriorLegId );
    break;

    case rightUpperAnteriorLegId:

    m = translate(0.5*bodyWidth-0.5*UpperAnteriorLegWidth, 0.1*bodyHeight,  0.5*bodyDepth-0.5*UpperAnteriorLegWidth);
	m = mult(m, rotate(theta[rightUpperAnteriorLegId], 1, 0, 0));
    figure[rightUpperAnteriorLegId] = createNode( m, rightUpperAnteriorLeg, leftUpperPosteriorLegId, rightLowerAnteriorLegId );
    break;

    case leftUpperPosteriorLegId:

    m = translate(-(0.5*bodyWidth-0.5*UpperPosteriorLegWidth), 0.1*UpperPosteriorLegHeight, -(0.5*bodyDepth-0.5*UpperPosteriorLegWidth));
	m = mult(m , rotate(theta[leftUpperPosteriorLegId], 1, 0, 0));
    figure[leftUpperPosteriorLegId] = createNode( m, leftUpperPosteriorLeg, rightUpperPosteriorLegId, leftLowerPosteriorLegId );
    break;

    case rightUpperPosteriorLegId:

    m = translate(0.5*bodyWidth-0.5*UpperAnteriorLegWidth, 0.1*UpperPosteriorLegHeight, -(0.5*bodyDepth-0.5*UpperPosteriorLegWidth));
	m = mult(m, rotate(theta[rightUpperPosteriorLegId], 1, 0, 0));
    figure[rightUpperPosteriorLegId] = createNode( m, rightUpperPosteriorLeg, tailId, rightLowerPosteriorLegId );
    break;
    case tailId:

    m = translate(0.0, bodyHeight, -0.5*bodyDepth-0.25*tailDepth);
	  m = mult(m, rotate(theta[tailId], 1, 0, 0));
  //  m = mult(m, rotate(-45, 1, 0, 0));
    figure[tailId] = createNode( m, tail, null, null );
    break;

    case leftLowerAnteriorLegId:

    m = translate(0.0, 0.90*UpperAnteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[leftLowerAnteriorLegId], 1, 0, 0));
    figure[leftLowerAnteriorLegId] = createNode( m, leftLowerAnteriorLeg, null, null );
    break;

    case rightLowerAnteriorLegId:

    m = translate(0.0, 0.90*UpperAnteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[rightLowerAnteriorLegId], 1, 0, 0));
    figure[rightLowerAnteriorLegId] = createNode( m, rightLowerAnteriorLeg, null, null );
    break;

    case leftLowerPosteriorLegId:

    m = translate(0.0, 0.90*UpperPosteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[leftLowerPosteriorLegId], 1, 0, 0));
    figure[leftLowerPosteriorLegId] = createNode( m, leftLowerPosteriorLeg, null, null );
    break;

    case rightLowerPosteriorLegId:

    m = translate(0.0, 0.90*UpperPosteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[rightLowerPosteriorLegId], 1, 0, 0));
    figure[rightLowerPosteriorLegId] = createNode( m, rightLowerPosteriorLeg, null, null );
    break;



    }

}

function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}

function body() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*bodyHeight, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( bodyWidth, bodyHeight, bodyDepth));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function head() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(headWidth, headHeight, headDepth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftUpperAnteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperAnteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperAnteriorLegWidth, UpperAnteriorLegHeight, UpperAnteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerAnteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * LowerAnteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerAnteriorLegWidth, LowerAnteriorLegHeight, LowerAnteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperAnteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperAnteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperAnteriorLegWidth, UpperAnteriorLegHeight, UpperAnteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerAnteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * LowerAnteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerAnteriorLegWidth, LowerAnteriorLegHeight, LowerAnteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  leftUpperPosteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperPosteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperPosteriorLegWidth, UpperPosteriorLegHeight, UpperPosteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerPosteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * LowerPosteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerPosteriorLegWidth, LowerPosteriorLegHeight, LowerPosteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperPosteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperPosteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperPosteriorLegWidth, UpperPosteriorLegHeight, UpperPosteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerPosteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * LowerPosteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerPosteriorLegWidth, LowerPosteriorLegHeight, LowerPosteriorLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function tail() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * tailHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(tailWidth, tailHeight, tailDepth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function quad(a, b, c, d) {
     pointsArray.push(vertices[a]);
     texCoordsArray.push(texCoord[0]);

     pointsArray.push(vertices[b]);
     texCoordsArray.push(texCoord[1]);

     pointsArray.push(vertices[c]);
     texCoordsArray.push(texCoord[2]);

     pointsArray.push(vertices[d]);
     texCoordsArray.push(texCoord[3]);

}


function cube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-50.0,50.0,-50.0, 50.0,-10.0,10.0);
    modelViewMatrix = mat4();


    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    vBuffer = gl.createBuffer();

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    configureTexture();

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1);



    document.getElementById("Animate").onclick= function(){ animOn=!animOn;};




    for(i=0; i<numNodes; i++) initNodes(i);

    render();
}



var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT );
        traverse(bodyId);
        if(animOn){
        animation();
        //steps=steps-1;
      }
      else{
        stopAnimation();
      } //transAn=0;}

        //console.log(steps);
       //console.log(transAn);
        requestAnimFrame(render);
}
