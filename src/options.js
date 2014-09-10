module.exports.parse = function(arr){
    for(var i = 0; i < arr.length; ++i) {
        var val = arr[i];
        var matches = val.match(/^-(\w+):("?)([^"]+)\2$/);
        if(matches){
            module.exports[matches[1]] = matches[3];
        }
    }
}