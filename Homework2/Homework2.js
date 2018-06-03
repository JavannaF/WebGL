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
var leftAnteriorLegId = 2;
var leftAnteriorPawId = 3;
var rightAnteriorLegId = 4;
var rightAnteriorPawId = 5;
var leftPosteriorLegId = 6;
var leftPosteriorPawId = 7;
var rightPosteriorLegId = 8;
var rightPosteriorPawId = 9;
var tailId=10;

//var bodyDepth=3;
var bodyHeight = 4;
var bodyWidth = 5;
var bodyDepth=8;
var AnteriorLegHeight = 3;
var AnteriorPawHeight = 1;
var AnteriorLegWidth  = 1.0;
var AnteriorPawWidth  = 1.0;
var PosteriorLegWidth  = 1.0;
var PosteriorPawWidth  = 1.0;
var PosteriorPawHeight = 1;
var PosteriorLegHeight = 3;
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
    theta[leftAnteriorLegId]=180;
    theta[rightPosteriorLegId]=180;
    theta[rightAnteriorLegId]=180;
    theta[leftPosteriorLegId]=180;
    theta[leftAnteriorPawId]=0;
    theta[rightPosteriorPawId]=0;
    theta[rightAnteriorPawId]=0;
    theta[leftPosteriorPawId]=0;
    deltaLeg1=0;
    theta[head2Id]=0;
    initNodes(leftAnteriorLegId);
    initNodes(rightPosteriorLegId);
    initNodes(bodyId);
    initNodes(rightAnteriorLegId);
    initNodes(leftPosteriorLegId);
    initNodes(leftAnteriorPawId);
    initNodes(rightPosteriorPawId);
    initNodes(head2Id);
    initNodes(rightAnteriorPawId);
    initNodes(leftPosteriorPawId);
    return;
}
function animation() {
      theta[head2Id]-=1*giraTesta;
      if(theta[head2Id]==-90 || theta[head2Id]==0){
        giraTesta=-giraTesta;
      }
      initNodes(head2Id);
      if(deltaLeg1<30 && alternate){


    theta[leftAnteriorLegId]=180+deltaLeg1;
    theta[rightPosteriorLegId]=180+deltaLeg1;
    theta[leftAnteriorPawId]=deltaLeg1;
    theta[rightPosteriorPawId]=deltaLeg1;

    initNodes(leftAnteriorLegId);
    initNodes(rightPosteriorLegId);
    initNodes(bodyId);
    theta[rightAnteriorLegId]=180-deltaLeg1;
    theta[leftPosteriorLegId]=180-deltaLeg1;
    theta[leftPosteriorPawId]=deltaLeg1;
    theta[rightAnteriorPawId]=deltaLeg1;
    initNodes(rightPosteriorPawId);
    initNodes(rightAnteriorPawId);
    initNodes(leftPosteriorPawId);
    initNodes(rightAnteriorLegId);
    initNodes(leftPosteriorLegId);
    initNodes(leftAnteriorPawId);
    //steps-=0.5;
    deltaLeg1+=0.50;
    transAn+=0.25;
    //headHeight+=1;
    if(deltaLeg1==30) alternate=!alternate;

    return;}

    else{
      transAn+=0.25;
      initNodes(bodyId);
      theta[leftAnteriorLegId]=180+deltaLeg1;
      theta[rightPosteriorLegId]=180+deltaLeg1;
      theta[leftAnteriorPawId]=deltaLeg1;
      theta[rightPosteriorPawId]=deltaLeg1;
      initNodes(leftAnteriorLegId);
      initNodes(rightPosteriorLegId);
      theta[rightAnteriorLegId]=180-deltaLeg1;
      theta[leftPosteriorLegId]=180-deltaLeg1;
      theta[leftPosteriorPawId]=deltaLeg1;
      theta[rightAnteriorPawId]=deltaLeg1;
      initNodes(rightAnteriorLegId);
      initNodes(leftPosteriorLegId);
      initNodes(leftAnteriorPawId);
      initNodes(rightPosteriorPawId);
      initNodes(rightAnteriorPawId);
      initNodes(leftPosteriorPawId);
      initNodes(leftAnteriorPawId);
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
    figure[headId] = createNode( m, head, leftAnteriorLegId, null);
    break;


    case leftAnteriorLegId:

    m = translate((-0.5*bodyWidth+0.5*AnteriorLegWidth), 0.1*bodyHeight, (0.5*bodyDepth-0.5*AnteriorPawWidth));
	m = mult(m, rotate(theta[leftAnteriorLegId], 1, 0, 0));
    figure[leftAnteriorLegId] = createNode( m, leftAnteriorLeg, rightAnteriorLegId, leftAnteriorPawId );
    break;

    case rightAnteriorLegId:

    m = translate(0.5*bodyWidth-0.5*AnteriorLegWidth, 0.1*bodyHeight,  0.5*bodyDepth-0.5*AnteriorLegWidth);
	m = mult(m, rotate(theta[rightAnteriorLegId], 1, 0, 0));
    figure[rightAnteriorLegId] = createNode( m, rightAnteriorLeg, leftPosteriorLegId, rightAnteriorPawId );
    break;

    case leftPosteriorLegId:

    m = translate(-(0.5*bodyWidth-0.5*PosteriorLegWidth), 0.1*PosteriorLegHeight, -(0.5*bodyDepth-0.5*PosteriorLegWidth));
	m = mult(m , rotate(theta[leftPosteriorLegId], 1, 0, 0));
    figure[leftPosteriorLegId] = createNode( m, leftPosteriorLeg, rightPosteriorLegId, leftPosteriorPawId );
    break;

    case rightPosteriorLegId:

    m = translate(0.5*bodyWidth-0.5*AnteriorLegWidth, 0.1*PosteriorLegHeight, -(0.5*bodyDepth-0.5*PosteriorLegWidth));
	m = mult(m, rotate(theta[rightPosteriorLegId], 1, 0, 0));
    figure[rightPosteriorLegId] = createNode( m, rightPosteriorLeg, tailId, rightPosteriorPawId );
    break;
    case tailId:

    m = translate(0.0, bodyHeight, -0.5*bodyDepth-0.25*tailDepth);
	  m = mult(m, rotate(theta[tailId], 1, 0, 0));
  //  m = mult(m, rotate(-45, 1, 0, 0));
    figure[tailId] = createNode( m, tail, null, null );
    break;

    case leftAnteriorPawId:

    m = translate(0.0, 0.90*AnteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[leftAnteriorPawId], 1, 0, 0));
    figure[leftAnteriorPawId] = createNode( m, leftAnteriorPaw, null, null );
    break;

    case rightAnteriorPawId:

    m = translate(0.0, 0.90*AnteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[rightAnteriorPawId], 1, 0, 0));
    figure[rightAnteriorPawId] = createNode( m, rightAnteriorPaw, null, null );
    break;

    case leftPosteriorPawId:

    m = translate(0.0, 0.90*PosteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[leftPosteriorPawId], 1, 0, 0));
    figure[leftPosteriorPawId] = createNode( m, leftPosteriorPaw, null, null );
    break;

    case rightPosteriorPawId:

    m = translate(0.0, 0.90*PosteriorLegHeight, 0.0);
    m = mult(m, rotate(theta[rightPosteriorPawId], 1, 0, 0));
    figure[rightPosteriorPawId] = createNode( m, rightPosteriorPaw, null, null );
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

function leftAnteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * AnteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(AnteriorLegWidth, AnteriorLegHeight, AnteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftAnteriorPaw() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * AnteriorPawHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(AnteriorPawWidth, AnteriorPawHeight, AnteriorPawWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightAnteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * AnteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(AnteriorLegWidth, AnteriorLegHeight, AnteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightAnteriorPaw() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * AnteriorPawHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(AnteriorPawWidth, AnteriorPawHeight, AnteriorPawWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  leftPosteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * PosteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(PosteriorLegWidth, PosteriorLegHeight, PosteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftPosteriorPaw() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * PosteriorPawHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(PosteriorPawWidth, PosteriorPawHeight, PosteriorPawWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightPosteriorLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * PosteriorLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(PosteriorLegWidth, PosteriorLegHeight, PosteriorLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightPosteriorPaw() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * PosteriorPawHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(PosteriorPawWidth, PosteriorPawHeight, PosteriorPawWidth) )
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
