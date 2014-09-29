// so named because it keeps me from going crazy

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
	table.className = "tabSet";
    elem.className = "";
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
				headerCell.className = "tab";
			}
			else{
				headerCell.className = "tab selectedTab";
			}
            var selectTab = function(index){
				for(var n = 0; n < bodyCell.children.length; ++n){
					bodyCell.children[n].style.display = (n == index) ? "" : "none";
					headerRow.children[n].className = (n == index) ? "tab selectedTab" : "tab";
				}
			}.bind(title, i / 2);
			title.addEventListener("click", selectTab);
            headerCell.addEventListener("click", selectTab);
		}
	}
    for(var i = 0; i < headerRow.children.length; ++i){
        headerRow.children[i].style.width = pct(100 / headerRow.children.length);
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


function inherit(classType, parentType){
    classType.prototype = Object.create(parentType.prototype);
    classType.prototype.constructor = classType;
}

function setSetting(name, value){
    if (window.localStorage){
        window.localStorage.setItem(name, JSON.stringify(value));
    }
}

function deleteSetting(name){
    if (window.localStorage){
        window.localStorage.removeItem(name);
    }
}

function readForm(ctrls){
    var state = {};
    if(ctrls){
        for(var name in ctrls){
            var c = ctrls[name];
            if(c.tagName == "INPUT" && (!c.dataset || !c.dataset.skipcache)){
                if(c.type == "text" || c.type == "password"){
                    state[name] = c.value;
                }
                else if(c.type == "checkbox" || c.type == "radio"){
                    state[name] = c.checked;
                }
            }
        }
    }
    return state;
}

function writeForm(ctrls, state){
    if(state){
        for(var name in ctrls){
            var c = ctrls[name];
            if(state[name] != null && c.tagName == "INPUT" && (!c.dataset || !c.dataset.skipcache)){
                if(c.type == "text" || c.type == "password"){
                    c.value = state[name];
                }
                else if(c.type == "checkbox" || c.type == "radio"){
                    c.checked = state[name];
                }
            }
        } 
    }
}

// snagged and adapted from http://detectmobilebrowsers.com/
var isMobile = (function (a){ return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substring(0, 4)); })(navigator.userAgent || navigator.vendor || window.opera),
    isiOS = /Apple-iP(hone|od|ad)/.test(navigator.userAgent || ""),
    isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,
    isFirefox = typeof InstallTrigger !== 'undefined',
    isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    isChrome = !!window.chrome && !isOpera,
    isIE = /*@cc_on!@*/false || !!document.documentMode;

function add(a, b){ return a + b; }

function group(arr, getKey, getValue){
    var groups = [];
    // we don't want to modify the original array.
    var clone = this.concat();

    // Sorting the array by the group key criteeria first 
    // simplifies the grouping step. With a sorted array
    // by the keys, grouping can be done in a single pass.
    clone.sort(function (a, b){
        var ka = getKey ? getKey(a) : a;
        var kb = getKey ? getKey(b) : b;
        if (ka < kb){
            return -1;
        }
        else if (ka > kb){
            return 1;
        }
        return 0;
    });

    for(var i = 0; i < clone.length; ++i){
        var obj = clone[i];
        var key = getKey ? getKey(obj) : obj;
        var val = getValue ? getValue(obj) : obj;
        if (groups.length == 0 || groups[groups.length - 1].key != key){
            groups.push({key: key, values: []});
        }
        groups[groups.length - 1].values.push(val);
    }
    return groups;
};

function agg(arr, get, red){
    if (typeof (get) != "function"){
        get = (function (key, obj){
            return obj[key];
        }).bind(window, get);
    }
    return arr.map(get).reduce(red);
};

function sum (arr, get){
    return agg(arr, get, add);
};

function makeURL(url, queryMap){
    var output = [];
    for (var key in queryMap){
        output.push(encodeURIComponent(key) + "=" + encodeURIComponent(queryMap[key]));
    }
    return url + "?" + output.join("&");
}

navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

MediaStreamTrack.getVideoTracks =
    (window["MediaStream"] && MediaStream.getVideoTracks && (function (getter, success){
        success(getter());
    }).bind(MediaStream, MediaStream.getVideoTracks))
    || (MediaStreamTrack.getSources && function (success){
        return MediaStreamTrack.getSources(function (sources){
        success(sources.filter(function (source){
            return source.kind == "video";
        }));
    });
    })
    || function(success){
        return success([]);
};

// full-screen-ism polyfill
if (!document.documentElement.requestFullscreen){
    if (document.documentElement.msRequestFullscreen){
        document.documentElement.requestFullscreen = document.documentElement.msRequestFullscreen;
        document.exitFullscreen = document.msExitFullscreen;
    }
    else if (document.documentElement.mozRequestFullScreen){
        document.documentElement.requestFullscreen = document.documentElement.mozRequestFullScreen;
        document.exitFullscreen = document.mozCancelFullScreen;
    }
    else if (document.documentElement.webkitRequestFullscreen){
        document.documentElement.requestFullscreen = function (){
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
        };
        document.exitFullscreen = document.webkitExitFullscreen;
    }
}

screen.lockOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation || function(){};

function isFullScreenMode(){
    return (document.fullscreenElement
            || document.mozFullScreenElement
            || document.webkitFullscreenElement
            || document.msFullscreenElement);
}

function requestFullScreen(){
    if(!isFullScreenMode()){
        document.documentElement.requestFullscreen();
        var interval = setInterval(function(){
            if(isFullScreenMode()){
                clearInterval(interval);
                screen.lockOrientation("landscape-primary");
            }
        }, 1000);
    }
}

function exitFullScreen(){
    if(isFullScreenMode()){
        document.exitFullscreen();
    }
}

function toggleFullScreen(){
    if (document.documentElement.requestFullscreen){
        if(isFullScreenMode()){
            exitFullScreen();
        }
        else{
            requestFullScreen();
        }
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
