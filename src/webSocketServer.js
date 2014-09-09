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

        types.forEach(function(t){
            socket.on(t, proxyCommand.bind(socket, key, t));
        });

        socket.on("disconnect", disconnect);
        socket.emit("good", {index: socket.index, total: group.length});
        for(var i = 0; i < group.length && i < socket.index; ++i){
            group[i].emit("open", {index: socket.index, total: group.length});
        }
    });
}