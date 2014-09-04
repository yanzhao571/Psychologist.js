function GamepadInput(commands, gpid, socket){
    NetworkedInput.call(this, "gamepad", commands, socket, 1);
    var connectedGamepads = [],
        listeners = {
            gamepadconnected: [],
            gamepaddisconnected: []
        };

    function add(arr, val){
        if(arr.indexOf(val) == -1){
            arr.push(val);
        }
    }

    function remove(arr, val){        
        var index = arr.indexOf(val);
        if(index > -1){
            arr.splice(index, 1);
        }
    }

    function sendAll(arr, id){
        arr.forEach(function(f){ f(id); });
    }

    function onConnected(id){
        sendAll(listeners.gamepadconnected, id);
    }

    function onDisconnected(id){
        sendAll(listeners.gamepaddisconnected, id);
    }

    this.isAvailable = function(){ 
        return available;
    };

    this.getErrorMessage = function(){
        return errorMessage;
    };

    this.setGamepad = function(id){
        gpid = id;
        this.inPhysicalUse = true;
    };

    this.clearGamepad = function(){
        gpid = null;
        this.inPhysicalUse = false;
    };

    this.isGamepadSet = function(){
        return !!gpid;
    };

    this.getConnectedGamepads = function(){
        return connectedGamepads.slice();
    };
    
    this.addEventListener = function(event, handler, bubbles){
        if(listeners.hasOwnProperty(event)){
            add(listeners[event], handler);
        }
        if(event == "gamepadconnected"){
            connectedGamepads.forEach(onConnected);
        }
    };

    this.removeEventListener = function(event, handler, bubbles){
        if(listeners.hasOwnProperty(event)){
            remove(listeners[event], handler);
        }
    };

    this.update = function(){
        var pads = null,
            currentPads = null;

        if(navigator.getGamepads){
            pads = navigator.getGamepads();
        }
        else if(navigator.webkitGetGamepads){
            pads = navigator.webkitGetGamepads();
        }

        if(pads){
            pads = Array.prototype.filter.call(pads, function(pad){ return !!pad; });
        }
        else{
            pads = [];
        }

        currentPads = []
        
        for(var i = 0; i < pads.length; ++i){
            var pad = pads[i];
            if(connectedGamepads.indexOf(pad.id) == -1){
                connectedGamepads.push(pad.id);
                onConnected(pad.id);
            }
            if(pad.id == gpid){
                this.checkDevice(pad);
            }
            currentPads.push(pad.id);
        }

        for(var i = connectedGamepads.length - 1; i >= 0; --i){
            if(currentPads.indexOf(connectedGamepads[i]) == -1){
                onDisconnected(connectedGamepads[i]);
                connectedGamepads.splice(i, 1);
            }
        }
    };

    try{
        this.update();
        available = true;
    }
    catch(err){
        avaliable = false;
        errorMessage = err;
    }
}

inherit(GamepadInput, NetworkedInput);