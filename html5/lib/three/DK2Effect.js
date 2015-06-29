/**
 * @author troffmo5 / http://github.com/troffmo5
 *
 * Effect to render the scene in stereo 3d side by side with lens distortion.
 * It is written to be used with the Oculus Rift (http://www.oculusvr.com/) but
 * it works also with other HMD using the same technology
 */

THREE.VREffect = function (renderer, vrDisplay) {
    // Specific HMD parameters
    var HMD = null;
    
    this.setHMD = function(vrDisplay){
        if(vrDisplay){
            HMD = {
                viewportLeft: vrDisplay.getRecommendedEyeRenderRect("left"),
                viewportRight: vrDisplay.getRecommendedEyeRenderRect("right"),
                translateLeft: vrDisplay.getEyeTranslation("left"),
                translateRight: vrDisplay.getEyeTranslation("right"),
                fovLeft: vrDisplay.getRecommendedEyeFieldOfView("left"),
                fovRight: vrDisplay.getRecommendedEyeFieldOfView("right")
            };
        }
    };
    
    this.setHMD(vrDisplay);

    // Render target
    var RTParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        antialias: renderer.antialias
    };
    
    var renderTarget = new THREE.WebGLRenderTarget(
            HMD.viewportLeft.width + HMD.viewportRight.width,
            (HMD.viewportLeft.height + HMD.viewportRight.height) / 2,
            RTParams);
    var RTMaterial = new THREE.ShaderMaterial({				
        uniforms: {
                "tDiffuse": 		{ type: "t", value: null },
                "strength": 		{ type: "f", value: 1 },
                "height": 			{ type: "f", value: 1 },
                "aspectRatio":		{ type: "f", value: HMD.viewportLeft.width / HMD.viewportLeft.height },
                "cylindricalRatio": { type: "f", value: 1 }
        },

        vertexShader: [
                "uniform float strength;",          // s: 0 = perspective, 1 = stereographic
                "uniform float height;",            // h: tan(verticalFOVInRadians / 2)
                "uniform float aspectRatio;",       // a: screenWidth / screenHeight
                "uniform float cylindricalRatio;",  // c: cylindrical distortion ratio. 1 = spherical

                "varying vec3 vUV;",                // output to interpolate over screen
                "varying vec2 vUVDot;",             // output to interpolate over screen

                "void main() {",
                        "gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));",

                        "float scaledHeight = strength * height;",
                        "float cylAspectRatio = aspectRatio * cylindricalRatio;",
                        "float aspectDiagSq = aspectRatio * aspectRatio + 1.0;",
                        "float diagSq = scaledHeight * scaledHeight * aspectDiagSq;",
                        "vec2 signedUV = (2.0 * uv + vec2(-1.0, -1.0));",

                        "float z = 0.5 * sqrt(diagSq + 1.0) + 0.5;",
                        "float ny = (z - 1.0) / (cylAspectRatio * cylAspectRatio + 1.0);",

                        "vUVDot = sqrt(ny) * vec2(cylAspectRatio, 1.0) * signedUV;",
                        "vUV = vec3(0.5, 0.5, 1.0) * z + vec3(-0.5, -0.5, 0.0);",
                        "vUV.xy += uv;",
                "}"
        ].join("\n"),

        fragmentShader: [
                "uniform sampler2D tDiffuse;",      // sampler of rendered scene�s render target
                "varying vec3 vUV;",                // interpolated vertex output data
                "varying vec2 vUVDot;",             // interpolated vertex output data

                "void main() {",
                        "vec3 uv = dot(vUVDot, vUVDot) * vec3(-0.5, -0.5, -1.0) + vUV;",
                        "gl_FragColor = texture2DProj(tDiffuse, uv);",
                "}"
        ].join("\n")
    });



    // Perspective camera
    var cameraLeft = new THREE.PerspectiveCamera(),
        cameraRight = new THREE.PerspectiveCamera();
    //cameraLeft.position.copy(HMD.translateLeft);
    //cameraRight.position.copy(HMD.translateRight);

    // Orthographic camera
    var oCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
    oCamera.position.z = 1;
    
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), RTMaterial);

    // Final scene
    var finalScene = new THREE.Scene();
    finalScene.add(mesh);

    
    this.render = function (scene, camera) {

        renderer.enableScissorTest(true);
        renderer.clear();

        if (camera.parent === undefined) {
            camera.updateMatrixWorld();
        }

        cameraLeft.projectionMatrix = this.FovToProjection(HMD.fovLeft, camera.near, camera.far);
        cameraRight.projectionMatrix = this.FovToProjection(HMD.fovRight, camera.near, camera.far);

        camera.matrixWorld.decompose(cameraLeft.position, cameraLeft.quaternion, cameraLeft.scale);
        camera.matrixWorld.decompose(cameraRight.position, cameraRight.quaternion, cameraRight.scale);
        

        cameraLeft.translateX(HMD.translateLeft.x);
        cameraRight.translateX(HMD.translateRight.x);
        
        renderer.setViewport(HMD.viewportLeft.x, HMD.viewportLeft.y, HMD.viewportLeft.width, HMD.viewportLeft.height);
        renderer.setScissor(HMD.viewportLeft.x, HMD.viewportLeft.y, HMD.viewportLeft.width, HMD.viewportLeft.height);
        renderer.render(scene, cameraLeft, renderTarget, true);
        renderer.render(finalScene, oCamera);

        renderer.setViewport(HMD.viewportRight.x, HMD.viewportRight.y, HMD.viewportRight.width, HMD.viewportRight.height);
        renderer.setScissor(HMD.viewportRight.x, HMD.viewportRight.y, HMD.viewportRight.width, HMD.viewportRight.height);
        renderer.render(scene, cameraRight, renderTarget, true);
        renderer.render(finalScene, oCamera);
        
        renderer.enableScissorTest(false);
    };
    
    this.setSize = function(){};

    this.FovToNDCScaleOffset = function (fov) {
        var pxscale = 2.0 / (fov.leftTan + fov.rightTan);
        var pxoffset = (fov.leftTan - fov.rightTan) * pxscale * 0.5;
        var pyscale = 2.0 / (fov.upTan + fov.downTan);
        var pyoffset = (fov.upTan - fov.downTan) * pyscale * 0.5;
        return {scale: [pxscale, pyscale], offset: [pxoffset, pyoffset]};
    };

    this.FovPortToProjection = function (fov, zNear /* = 0.01 */, zFar /* = 10000.0 */)
    {
        zNear = zNear === undefined ? 0.01 : zNear;
        zFar = zFar === undefined ? 10000.0 : zFar;

        // and with scale/offset info for normalized device coords
        var scaleAndOffset = this.FovToNDCScaleOffset(fov);


        // start with an identity matrix
        var mobj = new THREE.Matrix4();
        var m = mobj.elements;
        // X result, map clip edges to [-w,+w]
        m[0 * 4 + 0] = scaleAndOffset.scale[0];
        m[0 * 4 + 1] = 0.0;
        m[0 * 4 + 2] = -scaleAndOffset.offset[0];
        m[0 * 4 + 3] = 0.0;

        // Y result, map clip edges to [-w,+w]
        // Y offset is negated because this proj matrix transforms from world coords with Y=up,
        // but the NDC scaling has Y=down (thanks D3D?)
        m[1 * 4 + 0] = 0.0;
        m[1 * 4 + 1] = scaleAndOffset.scale[1];
        m[1 * 4 + 2] = scaleAndOffset.offset[1];
        m[1 * 4 + 3] = 0.0;

        // Z result (up to the app)
        m[2 * 4 + 0] = 0.0;
        m[2 * 4 + 1] = 0.0;
        m[2 * 4 + 2] = zFar / (zNear - zFar);
        m[2 * 4 + 3] = (zFar * zNear) / (zNear - zFar);

        // W result (= Z in)
        m[3 * 4 + 0] = 0.0;
        m[3 * 4 + 1] = 0.0;
        m[3 * 4 + 2] = -1.0;
        m[3 * 4 + 3] = 0.0;

        mobj.transpose();

        return mobj;
    };

    this.FovToProjection = function (fov, zNear /* = 0.01 */, zFar /* = 10000.0 */)
    {
        var fovPort = {
            upTan: Math.tan(fov.upDegrees * Math.PI / 180.0),
            downTan: Math.tan(fov.downDegrees * Math.PI / 180.0),
            leftTan: Math.tan(fov.leftDegrees * Math.PI / 180.0),
            rightTan: Math.tan(fov.rightDegrees * Math.PI / 180.0)
        };
        return this.FovPortToProjection(fovPort, zNear, zFar);
    };

    this.dispose = function () {
        if (RTMaterial) {
            RTMaterial.dispose();
        }
        if (renderTarget) {
            renderTarget.dispose();
        }
    };
};
