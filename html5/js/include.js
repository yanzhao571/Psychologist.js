function getText(url, success, fail){
   var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function (){
        success(xhr.responseText);
    };
    xhr.onerror = function (err){
        fail(err);
    };
    xhr.send();
}

function getObject(url, success, fail){
    getText(url, function(txt){
        success(JSON.parse(txt));
    }, fail);
}

function getScript(src, success, fail) {
    // make sure the script hasn't already been loaded into the page
    var s = document.querySelector("script[src='"+src+"']");
    if(s){
        success();
    }
    else{
        s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.addEventListener("error", fail);
        s.addEventListener("abort", fail);
        s.addEventListener("load", success);
        document.head.appendChild(s);
        s.src = src;
    }
}

var include = (function () {
    function loadLibs(version, progress, done, libs, libIndex) {
        libIndex = libIndex || 0;
        if (libIndex < libs.length) {
            var thunk = function (type) {
                progress(type, libs[libIndex], libIndex + 1, libs.length);
                loadLibs(version, progress, done, libs, libIndex + 1);
            };
            progress("loading", libs[libIndex], libIndex, libs.length);
            var file = libs[libIndex];
            if(!(/http(s):/.test(file)) && version > 0){
                file += "?v" + version; 
            }
            getScript(file, thunk.bind(this, "success"), thunk.bind(this, "error"));
        }
        else{
            done();
        }
    }

    function ofType(arr, t){
        return arr.filter(function(elem){ return typeof(elem) == t; });
    }

    function include() {
        var args = Array.prototype.slice.call(arguments),
            version = ofType(args, "number").reduce(function(a, b){ return b; }, 0),
            libs = ofType(args, "string"),
            callbacks = ofType(args, "function"),            
            progress = callbacks.length == 2 ? callbacks[0] : console.log.bind(console, "file loaded"),            
            done = callbacks.length >= 1 ? callbacks[callbacks.length - 1] : console.log.bind(console, "done loading");

        setTimeout(loadLibs.bind(this, version, progress, done, libs));
    }

    return include;
})();

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