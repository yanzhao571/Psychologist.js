
function Surface(id, is3D, w, h){
    this.width = w || CANV_WIDTH;
    this.height = h || CANV_HEIGHT;

    this.canv = document.getElementById(id);
    if(!this.canv){
        this.canv = document.createElement("canvas");
        this.canv.id = id;
    }
    this.canv.width = this.width;
    this.canv.height = this.height;

    this.is3d = is3D;

    if(this.is3d){
        this.gl = this.canv.getContext("webgl") || this.canv.getContext("experimental-webgl");
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0, 0, this.width, this.height);
    }
    else{
        this.gfx = this.canv.getContext("2d");
        this.gfx.font = "20px Arial";
    }
}

Surface.prototype.drawImage = function(i, x, y, w, h){
    i = i.canv || i;
    w = w || i.width || i.videoWidth;
    h = h || i.height || i.videoHeight;
    this.gfx.drawImage(i, x, y, w, h);
};

Surface.prototype.clear = function(){
    if(this.is3d){
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    else{
        this.gfx.fillStyle = "#000000";
        this.gfx.fillRect(0, 0, this.width, this.height);
    }
};

Surface.prototype.drawTextBox = function(text, y, lineHeight, color){
    this.gfx.fillStyle = color;
    text = text.split("\n");
    var gfx = this.gfx;
    var maxWidth = Math.max.apply(Math, text.map(function(line){
        return gfx.measureText(line).width;
    }));
    var cx = 0.5 * (this.width - maxWidth);
    text.forEach(function(line, i){
        gfx.fillText(line, cx, y + lineHeight * i);
    });
};

Surface.prototype.initBuffer = function(vertices){
    var buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    return buffer;
};

Surface.prototype.do3d = function(thunk){
    thunk(this.gl);
};

Surface.prototype.initShader = function(fragShaderID, vertShaderID){
    this.do3d(function(gl){
        var getShader = function(id, type){        
            var shaderScriptBlock = document.getElementById(id),
                shaderScript = shaderScriptBlock.innerText || shaderScriptBlock.textContent,
                shader = gl.createShader(type);

            gl.shaderSource(shader, shaderScript);
            gl.compileShader(shader);
            if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
                throw new Error(fmt("Error compiling shader [$1]:\n$2", id, gl.getShaderInfoLog(shader)));
            }
            return shader;
        };

        this.fragmentShader = getShader(fragShaderID, gl.FRAGMENT_SHADER);
        this.vertexShader = getShader(vertShaderID, gl.VERTEX_SHADER);

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, this.vertexShader);
        gl.attachShader(this.shaderProgram, this.fragmentShader);
        gl.linkProgram(this.shaderProgram);
        
        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
            throw new Error("Unable to initialize the shader program.");
        }
  
        gl.useProgram(this.shaderProgram);
  
        this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(this.vertexPositionAttribute);
    }.bind(this));
};