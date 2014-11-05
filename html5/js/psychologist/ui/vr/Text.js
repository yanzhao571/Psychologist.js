/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

VUI = window.VUI || {};

VUI.Text = function(text, size, fgcolor, bgcolor, x, y, z, hAlign){
    text = text.replace(/\r\n/g, "\n");
    var lines = text.split("\n");
    hAlign = hAlign || "center";
    var lineHeight = (size * 1000);
    var boxHeight = lineHeight * lines.length;

    var textCanvas = document.createElement("canvas");
    var textContext = textCanvas.getContext("2d");
    textContext.font = lineHeight + "px Arial";
    var width = textContext.measureText(text).width;

    textCanvas.width = width;
    textCanvas.height = boxHeight;
    textContext.font = lineHeight * 0.8 + "px Arial";
    if(bgcolor !== "transparent"){
        textContext.fillStyle = bgcolor;
        textContext.fillRect(0, 0, textCanvas.width, textCanvas.height);
    }
    textContext.fillStyle = fgcolor;
    textContext.textBaseline = "top";
    
    for(var i = 0; i < lines.length; ++i){
        textContext.fillText(lines[i], 0, i * lineHeight);
    }

    var texture = new THREE.Texture(textCanvas);
    texture.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: bgcolor === "transparent",
        useScreenCoordinates: false,
        color: 0xffffff,
        shading: THREE.FlatShading
    });

    var textGeometry = new THREE.PlaneGeometry(size * width / lineHeight, size * lines.length);
    textGeometry.computeBoundingBox();
    textGeometry.computeVertexNormals();

    var textMesh = new THREE.Mesh(textGeometry, material);
    if(hAlign === "left"){
        x -= textGeometry.boundingBox.min.x;
    }
    else if(hAlign === "right"){
        x += textGeometry.boundingBox.min.x;
    }
    textMesh.position.set(x, y, z);
    return textMesh;
};