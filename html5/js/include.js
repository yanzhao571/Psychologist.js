function getScript(src, success, fail) {
    // make sure the script hasn't already been loaded into the page
    var s = document.querySelector("script[src='"+src+"']");
    if(!s){
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
    function loadLibs(progress, done, libs, libIndex) {
        libIndex = libIndex || 0;
        if (libIndex < libs.length) {
            var thunk = function (type) {
                progress(type, libs[libIndex], libIndex + 1, libs.length);
                loadLibs(progress, done, libs, libIndex + 1);
            };
            progress("loading", libs[libIndex], libIndex, libs.length);
            getScript(libs[libIndex], thunk.bind(this, "success"), thunk.bind(this, "error"));
        }
        else{
            done();
        }
    }

    function include() {
        var args = Array.prototype.slice.call(arguments),

            version = args.filter(function(arg){
                return typeof(arg) == "number";
            }).reduce(function(a, b){
                return b;
            }, 0),

            libs = args.filter(function(arg){
                return typeof(arg) == "string";
            }).map(function(src){
                return (/http(s):/.test(src) || version == 0) ? src : src + "?v" + version;
            }),

            callbacks = args.filter(function(arg){
                return typeof(arg) == "function";
            }),
            
            progress = callbacks.length == 2 ? callbacks[0] : console.log.bind(console, "file loaded"),
            
            done = callbacks.length >= 1 ? callbacks[callbacks.length - 1] : console.log.bind(console, "done loading");

        setTimeout(loadLibs.bind(this, progress, done, libs));
    }

    return include;
})();