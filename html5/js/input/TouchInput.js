function TouchInput(numFingers, buttonBounds, commands, socket, DOMElement){
    var axes = [], last = [];
    for(var i = 0; i < numFingers; ++i){
        axes.push("x" + i);
        axes.push("y" + i);
    }
    buttonBounds = buttonBounds || [];
    for(var i = buttonBounds.length - 1; i >= 0; --i){
        var b = buttonBounds[i];
        if(b["x"] == null
            || b["y"] == null
            || b["w"] == null
            || b["h"] == null){
            throw new Error("button bounds need to be defined as {x, y, w, h} objects. Object index " + i + " is not one.");
        }
        else{
            b.x2 = b.x + b.w;
            b.y2 = b.y + b.h;
        }
    }

    NetworkedInput.call(this, "touch", commands, socket, 1, axes);

    function setState (stateChange, setAxis, event){
        var touches = stateChange ? event.touches : event.changedTouches;
        for(var i = 0; i < touches.length && i < numFingers; ++i){
            var t = touches[i];
            if(setAxis){
                for(var j = 0; j < buttonBounds.length; ++j){
                    this.setButton(j, false);
                    var b = buttonBounds[j];
                    if(b.x <= t.pageX && t.pageX < b.x2
                        && b.y <= t.pageY && t.pageY < b.y2){
                        this.setButton(j, stateChange);
                    }
                }
                if(last[t.identifier]){
                    this.incAxis("x" + i, last[t.identifier].pageX - t.pageX);
                    this.incAxis("y" + i, last[t.identifier].pageY - t.pageY);
                }
            }
            last[t.identifier] = t;
        }
        event.preventDefault();
    }

    DOMElement.addEventListener("touchstart", setState.bind(this, true, false), false);
    DOMElement.addEventListener("touchend", setState.bind(this, false, true), false);
    DOMElement.addEventListener("touchmove", setState.bind(this, true, true), false);
}

inherit(TouchInput, NetworkedInput);

/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this 
  list of conditions and the following disclaimer in the documentation and/or 
  other materials provided with the distribution.

* Neither the name of Sean T. McBeth nor the names of its contributors
  may be used to endorse or promote products derived from this software without 
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.
*/