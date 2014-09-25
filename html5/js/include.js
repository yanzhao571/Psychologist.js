function GET(url, type, progress, error, success){
    type = type || "text";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = type;
    xhr.onerror = error;
    xhr.onabort = error;
    xhr.onprogress = progress;
    xhr.onload = function (){
        if(xhr.status < 400){
            success(xhr.response);
        }
        else{
            error();
        }
    };
    xhr.send();
}

function getObject(url, progress, error, success){
    GET(url, "json", 
        success && error && progress, 
        (success && error) || (error && progress), 
        success || error || progress);
}

function getScript(src, success, error){
    // make sure the script hasn't already been loaded into the page
    var s = document.querySelector("script[src='"+src+"']");
    if(s){
        success();
    }
    else{
        s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.addEventListener("error", error);
        s.addEventListener("abort", error);
        s.addEventListener("load", success);
        document.head.appendChild(s);
        s.src = src;
    }
}

function getSetting(name, defValue){
    var val = window.localStorage.getItem(name);
    if(val){
        try{
            return (window.localStorage && JSON.parse(val)) || defValue;
        }
        catch(exp){
            console.error(name, val, typeof(val), exp);
        }
    }
    return defValue;
}

function FileState(obj){
    this.name = obj.name;
    this.size = obj.size;
    this.progress = 0;
    this.state = FileState.NONE;
    this.errored = false;
    this.complete = false;
}

FileState.prototype.toString = function(){
    return fmt("$1 ($2.00KB of $3.00KB): $4", this.name, this.progress/1000, this.size/1000, FileState.STATE_NAMES[this.state]);
};

// Applying Array's slice method to array-like objects. Called with
// no parameters, this function converts array-like objects into
// JavaScript Arrays.
function arr(arg, a, b){
    return Array.prototype.slice.call(arg, a, b);
}

function map(arr, fun){
    return Array.prototype.map.call(arr, fun);
}

FileState.STATE_NAMES = ["none", "started", "error", null, "success"]
FileState.NONE = 0;
FileState.STARTED = 1;
FileState.ERRORED = 2;
FileState.COMPLETE = 4;

function LoadingProgress(){
    var args = arr(arguments),
        version = ofType(args, "number").reduce(function(a, b){ return b; }, 0),
        paths = ofType(args, "string"),
        callbacks = ofType(args, "function"),
        manifest = paths.shift(),
        displayProgress = callbacks.shift(),
        postScriptLoad = callbacks.shift();

    getObject(manifest, function(files){
        this.files = files.map(function(f){ return new FileState(f);});
        this.totalFileSize = this.sum(FileState.NONE, "size");
        this.fileMap = this.files.reduce(function(a, b){ a[b.name] = b; return a;}, {});
            
        function progress(op, file, inter){
            if(op == "loading"){
                if(this.fileMap[file]){
                    this.fileMap[file].state = FileState.STARTED;
                }
                displayProgress();
            }
            else {
                if(this.fileMap[file]){
                    if(op == "intermediate" && inter){
                        this.fileMap[file].progress = inter;
                    }
                    else if(op == "success"){
                        this.fileMap[file].progress = this.fileMap[file].size;
                        this.fileMap[file].state = FileState.COMPLETE;
                    }
                    else if(op == "error"){
                        this.fileMap[file].state = FileState.ERRORED;
                    }
                }
            
                displayProgress();
            }
        }

        include(version, paths, progress.bind(this), postScriptLoad);
    }.bind(this));
}

LoadingProgress.prototype.isDone = function(){
    var done = this.sum(FileState.COMPLETE, "size");
    var error = this.sum(FileState.ERRORED, "size")
    return (done + error) == this.totalFileSize
};

LoadingProgress.prototype.sum = function(state, prop){
    return this.files.filter(function(f){
        return (f.state & state) != 0 || (state == 0);
    }).reduce(function(a, b){
        return a + b[prop];
    }, 0);
};

LoadingProgress.prototype.makeSize = function(state, prop){
    return pct(sigfig(100 * this.sum(state, prop) / this.totalFileSize, 1));
};

/*
    Replace template place holders in a string with a positional value.
    Template place holders start with a dollar sign ($) and are followed
    by a digit that references the parameter position of the value to 
    use in the text replacement. Note that the first position, position 0,
    is the template itself. However, you cannot reference the first position,
    as zero digit characters are used to indicate the width of number to
    pad values out to.

    Numerical precision padding is indicated with a period and trailing
    zeros.

    examples:
        fmt("a: $1, b: $2", 123, "Sean") => "a: 123, b: Sean"
        fmt("$001, $002, $003", 1, 23, 456) => "001, 023, 456"
        fmt("$1.00 + $2.00 = $3.00", Math.sqrt(2), Math.PI, 9001) 
           => "1.41 + 3.14 = 9001.00"
        fmt("$001.000", Math.PI) => 003.142
*/
function fmt(template){
    // - match a dollar sign ($) literally, 
    // - (optional) then zero or more zero digit (0) characters, greedily
    // - then one or more digits (the previous rule would necessitate that
    //      the first of these digits be at least one).
    // - (optional) then a period (.) literally
    // -            then one or more zero digit (0) characters
    var paramRegex = /\$(0*)(\d+)(?:\.(0+))?/g;
    var args = arguments;
    return template.replace(paramRegex, function (m, pad, index, precision){
        index = parseInt(index, 10);
        if (0 <= index && index < args.length){
            var val = args[index];
            if (val != null){
                if(val instanceof Date && precision){
                    switch (precision.length){
                        case 1: val = val.getYear(); break;
                        case 2: val = val.getMonth() + "/" + val.getYear(); break;
                        case 3: val = val.toLocaleDateString(); break;
                        case 4: val = fmt.addMillis(val, val.toLocaleTimeString()); break;
                        case 5: case 6: val = val.toLocaleString(); break;
                        default: val = fmt.addMillis(val, val.toLocaleString()); break;
                    }
                    return val;
                }
                else{
                    if (precision && precision.length > 0){
                        val = sigfig(val, precision.length);
                    }
                    else{
                        val = val.toString();
                    }
                    if (pad && pad.length > 0){
                        var paddingRegex = new RegExp("^\\d{" + (pad.length + 1) + "}(\\.\\d+)?");
                        while (!paddingRegex.test(val)){
                            val = "0" + val;
                        }
                    }
                    return val;
                }
            }
        }
        return undefined;
    });
}

fmt.addMillis = function(val, txt){
    return txt.replace(/( AM| PM|$)/, function (match, g1){
        return (val.getMilliseconds() / 1000).toString().substring(1) + g1;
    });
};

function sigfig(x, y){
    var p = Math.pow(10, y);
    var v = (Math.round(x * p) / p).toString();
    if (y > 0){
        var i = v.indexOf(".");
        if (i == -1){
            v += ".";
            i = v.length - 1;
        }
        while (v.length - i - 1 < y)
            v += "0";
    }
    return v;
}

var px = fmt.bind(this, "$1px");
var pct = fmt.bind(this, "$1%");
var ems = fmt.bind(this, "$1em");

function findEverything(elem, obj){
    elem = elem || document;
    obj = obj || {};
    var arr = elem.querySelectorAll("*");
    for(var i = 0; i < arr.length; ++i){
        var elem = arr[i];
        if(elem.id && elem.id.length > 0){
            obj[elem.id] = elem;
        }
    }
    return obj;
}

function ofType(arr, t){
    if(typeof(t) === "function"){
        return arr.filter(function(elem){ return elem instanceof t; });
    }
    else{
        return arr.filter(function(elem){ return typeof(elem) === t; });
    }
}

var include = (function (){
    function loadLibs(version, libs, progress, postScriptLoad, libIndex){
        libIndex = libIndex || 0;
        if(!postScriptLoad && progress){
            postScriptLoad = progress;
            progress = null;
        }
        if (libIndex < libs.length){
            var thunk = function (type){
                if(progress){
                    progress(type, libs[libIndex], libIndex + 1, libs.length);
                }
                setTimeout(loadLibs, 0, version, libs, progress, postScriptLoad, libIndex + 1);
            };
            if(progress){
                progress("loading", libs[libIndex], libIndex, libs.length);
            }
            var file = libs[libIndex];
            if(!(/http(s):/.test(file)) && version > 0){
                file += "?v" + version; 
            }
            getScript(file, thunk.bind(this, "success"), thunk.bind(this, "error"));
        }
        else if(postScriptLoad){
            postScriptLoad(progress);
        }
    }

    function include(version, libs, progress, postScriptLoad){
        setTimeout(loadLibs, 0, version, libs, progress, postScriptLoad);
    }

    return include;
})();


function makeTabSet(elem){
	if(!/\btabSet\b/.test(elem.className)){
		elem = elem.querySelector(".tabSet");
	}
	var table = document.createElement("table"),
		header = document.createElement("thead"),
		body = document.createElement("tbody"),
		headerRow = document.createElement("tr"),
		bodyRow = document.createElement("tr"),
		bodyCell = document.createElement("td"),
		maxWidth = 0;
	
	elem.parentElement.insertBefore(table, elem);
	elem.parentElement.removeChild(elem);
	table.appendChild(header);
	table.appendChild(body);
	header.appendChild(headerRow);
	body.appendChild(bodyRow);
	bodyRow.appendChild(bodyCell);
	var children = arr(elem.children);
	for(var i = 0; i < children.length; i += 2){
		var title = children[i],
			content = children[i+1];
		if(/(H\d|LABEL)/.test(title.tagName)){
			var headerCell = document.createElement("th");
			headerRow.appendChild(headerCell);
			title.parentElement.removeChild(title);
			headerCell.appendChild(title);
			content.style.width = "100%";
			content.parentElement.removeChild(content);
			bodyCell.appendChild(content);
			if(i > 0){
				content.style.display = "none";
			}
			else{
				headerCell.className = "selectedTab";
			}
			title.addEventListener("click", function(index){
				for(var n = 0; n < bodyCell.children.length; ++n){
					bodyCell.children[n].style.display = (n == index) ? "" : "none";
					headerRow.children[n].className = (n == index) ? "selectedTab" : "";
				}
			}.bind(title, i / 2));
            title.style.cursor = "pointer";
		}
	}
	bodyCell.colSpan = headerRow.children.length;
	return table;
}

function makeTabSets(){
	var sets = document.querySelectorAll(".tabSet");
	for(var i = 0; i < sets.length; ++i){
		makeTabSet(sets[i]);
	}
}

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