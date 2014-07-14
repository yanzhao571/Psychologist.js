var squareBuffer, perspectiveMatrix, mvMatrix, vertextPositionAttribute, shaderProgram;

function setupScene(surface, fragShaderID, vertShaderID){
    var square = [
        1, 1, 0,
        -1, 1, 0,
        1, -1, 0,
        -1, -1, 0
    ];

    squareBuffer = surface.initBuffer(square);
    surface.initShader(fragShaderID, vertShaderID);
    vertextPositionAttribute = surface.vertextPositionAttribute;
    shaderProgram = surface.shaderProgram;
}

function drawScene(surface){
    surface.clear();

    perspectiveMatrix = makePerspective(45, CANV_WIDTH / CANV_HEIGHT, 0.1, 100);
    loadIdentity();
    mvTranslate([0,0,-6]);

    surface.do3d(function(gl){
        gl.bindBuffer(gl.ARRAY_BUFFER, squareBuffer);
        gl.vertexAttribPointer(vertextPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        setMatrixUniforms(gl);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }.bind(this));
}

function loadIdentity(){
    mvMatrix = Matrix.I(4);
}

function multMatrix(m){
    mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v){
    multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms(gl){
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}