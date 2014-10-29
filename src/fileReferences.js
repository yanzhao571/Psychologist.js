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

var findController = require("./webServer").findController,
    fs = require("fs");

function findFilesInFiles(paths, skipURL, success, error, accum, index){
    accum = accum || [];
    index = index || 0;
    if(index >= paths.length){
        success(accum);
    }
    else{
        var next = function(){
            setImmediate(findFilesInFiles, paths, skipURL, success, error, accum, index + 1);
        };
        
        // only read certain types of files
        if(/\.(html|css|js|dae)$/.test(paths[index])){
            findFilesInFile(paths[index], skipURL, function(files){
                files.filter(function(f){
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

function findFilesInFile(path, skipURL, success, error, accum){
    fs.exists("html5/" + path, function(yes){
        if(yes){
            fs.readFile("html5/" + path, {encoding: "utf8"}, function(err, file){
                if(err){
                    console.error(path, err);
                    error(500, err);
                }
                else{
                    extractFileReferences(path, file, skipURL, success, accum);
                }
            });
        }
        else{
            var ctrl = findController("/" + path, "GET");
            if(ctrl){
                ctrl.handler(ctrl.parameters, function(type, file, length){
                    extractFileReferences(path, file, skipURL, success, accum);
                }, null, error);
            }
        }
    });
}

function extractFileReferences(path, file, skipURL, success, accum){
    var isCSS = /\.css$/.test(path);
    var isJS = /\.js$/.test(path);
    var pattern = isCSS ? /url\(\.\.\/([^)]+)\)/g : /"([^"]*)"/g;
    var strings = [];
    if(isJS){
        file = file.replace(/\\"/g, "{ESCAPED_QUOTE}");
    }
    file.replace(pattern, function(match, capture){
        strings.push(capture);
        return match;
    });
    strings.sort();
    strings = strings.filter(function(a, i){
        return a.length > 0 
            && (i === 0 || a !== strings[i-1])
            && /^[^.].+\.\w+$/.test(a)
            && a !== skipURL;
    });
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
            else{
                var ctrl = findController("/" + strings[index], "GET");
                if(ctrl){
                    accum.push(strings[index]);                    
                }
            }
            setImmediate(filterFiles, strings, done, accum, index + 1);
        });
    }
}

function getFileDescriptions(paths, done, accum, index){
    accum = accum || [];
    index = index || 0;
    if(index >= paths.length){
        done(accum);
    }
    else{
        getFileDescription(paths[index], null, function(desc){
            if(desc){
                accum.push(desc);
            }
            setImmediate(getFileDescriptions, paths, done, accum, index + 1);
        });
    }    
}

function getFileDescription(path, data, done){
    fs.stat("html5/" + path, function(err, stats){
        if(!err){
            done({
                name: path, 
                size: stats.size,
                stamp: stats.atime.getTime() + stats.ctime.getTime() + stats.mtime.getTime()
            });
        }
        else{
            var ctrl = findController("/" + path, "GET");
            if(ctrl){
                ctrl.handler(
                    ctrl.parameters, 
                    function(type, file, length){
                        done({
                            name: path, 
                            size: length,
                            stamp: length
                        });
                    }
                );
            }
            else{
                done(null);
            }
        }
    });
}

module.exports = {
    findFilesInFiles: findFilesInFiles,
    findFilesInFile: findFilesInFile,
    getFileDescriptions: getFileDescriptions,
    getFileDescription: getFileDescription
};