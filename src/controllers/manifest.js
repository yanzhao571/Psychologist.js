var fmt = require("../core").fmt,
    fs = require("fs");
    
module.exports = {
    pattern: /^\/manifest\/([\w.]+(?:\/[\w.]+)*\.(appcache|js))(?:\?)?/,
    GET: function(params, sendData, sendStaticFile, serverError){
        var fileURL = params[0];
        var isAppCache = params[1] === "appcache";
        if(isAppCache){
            fileURL = fileURL.replace("appcache", "html");
        }
        fs.exists("html5/" + fileURL, function(yes){
            if(!yes){
                serverError(404);
            }
            else{
                if(isAppCache){
                    getFileDescription(fileURL, true, function(desc){
                        findFilesInFiles([fileURL], sendAppCache.bind(this, desc.stamp, sendData), serverError);
                    });
                }
                else{
                    findFilesInFile(fileURL, sendJSON.bind(this, sendData), serverError);
                }
            }
        });
    }
};

function findFilesInFiles(paths, success, error, accum, index){
    accum = accum || [];
    index = index || 0;
    if(index >= paths.length){
        success(accum);
    }
    else{
        var next = function(){
            setImmediate(findFilesInFiles(paths, success, error, accum, index + 1));
        };
        if(/\.(html|css|js|dae)$/.test(paths[index])){
            findFilesInFile(paths[index], function(files){
                files.filter(function(f){
                    //var isGood = /\.(html|css|js|dae|ogg|mp3|png|jpg|jpeg)$/.test(f);
                    return paths.indexOf(f) === -1;// && isGood;
                }).forEach(function(f){
                    paths.push(f);
                });
                next();
            }, error, accum);
        }
        else{
            next();
        }
    }
}

function findFilesInFile(path, success, error, accum){
    fs.readFile("html5/" + path, {encoding: "utf8"}, function(err, file){
        if(err && error){
            console.error(path, err);
            error(500, err);
        }
        else if(!err){
            if(/\.js$/.test(path)){
                file = file.replace(/\\"/g, "{ESCAPED_QUOTE}");
            }
            extractFileReferences(file, success, accum);
        }
        else{
            success([]);
        }
    });
}

function extractFileReferences(file, success, accum){
    var strings = file.match(/"[^"]*"/g);
    if(strings){
        strings = strings.map(function(a){
            return a.substring(1, a.length - 1);
        }).sort();

        strings = strings.filter(function(a, i){
            return a.length > 0 
                && (i === 0 || a !== strings[i-1])
                && /^[^.].+\.\w+$/.test(a);
        }).map(function(s){
            return s;
        });
    }
    filterFiles(strings || [], success, accum);   
}

function filterFiles(strings, done, accum, index){
    accum = accum || [];
    index = index || 0;
    if(index >= strings.length){
        done(accum);
    }
    else{
        fs.exists("html5/" + strings[index], function(yes){
            if(yes){
                accum.push(strings[index]);
            }
            setImmediate(filterFiles, strings, done, accum, index + 1);
        });
    }
}

function getFileDescriptions(paths, includeTime, done, accum, index){
    accum = accum || [];
    index = index || 0;
    if(index >= paths.length){
        done(accum);
    }
    else{
        getFileDescription(paths[index], includeTime, function(desc){
            if(desc){
                accum.push(desc);
            }
            setImmediate(getFileDescriptions, paths, includeTime, done, accum, index + 1);
        });
    }    
}

function getFileDescription(path, includeTime, done){
    fs.stat("html5/" + path, function(err, stats){
        var obj = null;
        if(!err){
            obj = {name: path, size: stats.size};
            if(includeTime){
                obj.stamp = stats.atime.getTime() + stats.ctime.getTime() + stats.mtime.getTime();
            }
        }
        done(obj);
    });
}

function sendJSON(sendData, files){
    getFileDescriptions(files, false, function(descriptions){
        var data = JSON.stringify(descriptions);
        sendData("application/json", data, data.length); 
    });
}

function sendAppCache(mainFileTime, sendData, files){
    getFileDescriptions(files, true, function(descriptions){
        var data = fmt("CACHE MANIFEST\n# $1\nCACHE:", mainFileTime);
        for(var i = 0; i < descriptions.length; ++i){
            data += fmt("\n# $1\n../$2", descriptions[i].stamp, descriptions[i].name);
        }
        data += "\nNETWORK:\n*";
        sendData("text/cache-manifest", data, data.length);
    });
}