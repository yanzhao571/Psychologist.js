var pairs = {};

module.exports = function (socket) {
    socket.on("key", function (key) {
        var here, there;
        
        if(!pairs[key]){
            pairs[key] = {};
        }

        if(!pairs[key].left){
            here = "left";
            there = "right";
        }
        else if(!pairs[key].right){
            here = "right";
            there = "left";
        }
        else{
            socket.emit("bad");
        }

        if(here && there){
            pairs[key][here] = socket;
            socket.on("gamepad", function(commandState){
                if(pairs[key][there]){
                    pairs[key][there].emit("gamepad", commandState);
                }
            });

            socket.on("disconnect", function(){
                delete pairs[key][here];
            });
            socket.emit("good", here);
        }
    });
}