var types = ["gamepad", "keyboard", "mouse", "touch", "motion", "speech"],
    socketGroups = {};

function proxyCommand(key, command, commandState){
    for(var i = 0; i < socketGroups[key].length; ++i){
        if(i != this.index){
            socketGroups[key][i].emit(command, commandState);
        }
    }
}


module.exports = function (socket) {
    var group, lastKey;

    function disconnect(){
        if(group){
            group.splice(socket.index, 1);
            for(var i = 0; i < group.length; ++i){
                group[i].index = i;
                group[i].emit("close", socket.index);
            }
            if(group.length == 0){
                delete socketGroups[lastKey];
                group = null;
            }
        }
    }
    
    socket.on("disconnect", disconnect);

    socket.on("user", function(userName){
        group.name = userName;
        
        for(var g in socketGroups){
            var grp  = socketGroups[g];
            for(var i = 0; i < grp.length; ++i){
                grp[i].emit("user", userName, userName == grp.name);
            }
        }
    });

    socket.on("state", function(state){
        for(var g in socketGroups){
            var grp  = socketGroups[g];
            if(grp.name != group.name){
                for(var i = 0; i < grp.length; ++i){
                    grp[i].emit("state", state);
                }
            }
        }
    });

    socket.on("key", function (key) {
        if(lastKey){
            disconnect();
            lastKey = null;
        }

        lastKey = key;
        if(!socketGroups[key]){
            socketGroups[key] = [];
        }

        group = socketGroups[key];

        socket.index = group.length;
        group.push(socket);

        for(var i = 0; i < types.length; ++i) {
            socket.on(types[i], proxyCommand.bind(socket, key, types[i]));
        }

        socket.emit("good", {index: socket.index, total: group.length});
        for(var i = 0; i < group.length && i < socket.index; ++i){
            group[i].emit("open", {index: socket.index, total: group.length});
        }
    });
}