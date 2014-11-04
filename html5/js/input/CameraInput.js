/* 
 * Copyright (C) 2014 Sean McBeth
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function CameraInput(id, size, x, y, z, options){
    this.options = combineDefaults(options, CameraInput);
    this.videoElement = document.createElement("video");
    this.buffer = document.createElement("canvas");
    this.gfx = this.buffer.getContext("2d");
    this.texture = new THREE.Texture(this.buffer);
    var material = new THREE.MeshBasicMaterial({
        map: this.texture,
        useScreenCoordinates: false,
        color: 0xffffff,
        shading: THREE.FlatShading
    });
    
    this.gfx.width = 500;
    this.gfx.height = 500;
    this.gfx.fillStyle = "white";
    this.gfx.fillRect(0, 0, 500, 500);
    
    var geometry = new THREE.PlaneGeometry(size / 0.75, size);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    
    this.streaming = false;
    this.videoElement.autoplay = 1;
    var getUserMediaFallthrough = function(vidOpt, success, err){
        navigator.getUserMedia({video: vidOpt}, function (stream){
            streamURL = window.URL.createObjectURL(stream);
            this.videoElement.src = streamURL;
            success();
        }.bind(this), err);
    }.bind(this);

    var tryModesFirstThen = function(source, err, i){
        i = i || 0;
        if(this.options.videoModes && i < this.options.videoModes.length){
            var mode = this.options.videoModes[i];
            var opt = { optional: [{ sourceId: source }] };
            if(mode !== "default"){
                opt.mandatory = {
                    minWidth: mode.w,
                    minHeight: mode.h
                };
                mode = fmt("[w:$1, h:$2]", mode.w, mode.h);
            }
            getUserMediaFallthrough(opt, function(){
                console.log(fmt("Connected to camera at mode $1.", mode));
            }, function(err){
                console.error(fmt("Failed to connect at mode $1. Reason: $2", mode, err));
                tryModesFirstThen(source, err, i+1);
            });
        }
        else{
            err();
        }
    }.bind(this);

    this.videoElement.addEventListener("canplay", function (){
        if (!this.streaming){
            this.streaming = true;
        }
    }.bind(this), false);

    this.videoElement.addEventListener("playing", function (){
        this.videoElement.height = this.buffer.height = this.videoElement.videoHeight;
        this.videoElement.width = this.buffer.width = this.videoElement.videoWidth;
    }.bind(this), false);

    this.connect = function(source){
        if (this.streaming){
            try {
                if (window.stream){
                    window.stream.stop();
                }
                this.videoElement.src = null;
                this.streaming = false;
            }
            catch (err){
                console.error("While stopping", err);
            }
        }

        tryModesFirstThen(source, function(err){
            console.error("Couldn't connect at requested resolutions. Reason: ", err);
            getUserMediaFallthrough(true,
                console.log.bind(console, "Connected to camera at default resolution"),
                console.error.bind(console, "Final connect attempt"));
        });
    }.bind(this);
    
    if(id){
        this.connect(id);
    }
}

CameraInput.setup = function(elem, id){
    MediaStreamTrack.getVideoTracks(function (infos){
        for(var i = 0; i < infos.length; ++i){
            var option = document.createElement("option");
            option.value = infos[i].id;
            option.innerHTML = fmt("[Facing: $1] [ID: $2...]", infos[i].facing || "N/A", infos[i].id.substring(0, 8));
            option.selected = infos[i].id === id;
            elem.appendChild(option);
        }
    });
};

CameraInput.DEFAULTS = {
    videoModes: [
        { w: 320, h: 240 },
        { w: 640, h: 480 }, 
        "default"
    ]
};

CameraInput.prototype.update = function(){
    this.gfx.drawImage(this.videoElement, 0, 0);
    this.texture.needsUpdate = true;
};