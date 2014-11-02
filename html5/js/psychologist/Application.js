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

function Application(appName){
    this.hideControlsTimeout = null;
    this.ctrls = findEverything();
    
    //
    // The various options, and packs of them when selecting from a dropdown
    // list. This makes it easy to preconfigure the program to certain specs
    // and let the user override the others.
    //
    var NO_HMD_SMARTPHONE = "Smartphone - no HMD";
    this.stateList = new StateList(this.ctrls.deviceTypes, this.ctrls, [
        { name: "-- select device type --" },
        { name: "PC", values:{
            speechEnable: {checked: false},
            speechTransmit: {checked: false},
            speechReceive: {checked: false},
            keyboardEnable: {checked: true},
            keyboardTransmit: {checked: true},
            keyboardReceive: {checked: false},
            mouseEnable: {checked: true},
            mouseTransmit: {checked: true},
            mouseReceive: {checked: false},
            gamepadEnable: {checked: true},
            gamepadTransmit: {checked: true},
            gamepadReceive: {checked: false},
            leapEnable: {checked: true},
            leapTransmit: {checked: true},
            leapReceive: {checked: false},
            touchEnable: {checked: false},
            touchTransmit: {checked: false},
            touchReceive: {checked: true},
            headEnable: {checked: false},
            headTransmit: {checked: false},
            headReceive: {checked: true},
            renderingStyle: {value: "regular" },
            defaultDisplay: {checked: true}
        }},
        { name: "Smartphone HMD", values:{
            speechEnable: {checked: false},
            speechTransmit: {checked: false},
            speechReceive: {checked: true},
            keyboardEnable: {checked: false},
            keyboardTransmit: {checked: false},
            keyboardReceive: {checked: true},
            mouseEnable: {checked: false},
            mouseTransmit: {checked: false},
            mouseReceive: {checked: true},
            gamepadEnable: {checked: false},
            gamepadTransmit: {checked: false},
            gamepadReceive: {checked: true},
            leapEnable: {checked: false},
            leapTransmit: {checked: false},
            leapReceive: {checked: true},
            touchEnable: {checked: false},
            touchTransmit: {checked: false},
            touchReceive: {checked: true},
            headEnable: {checked: true},
            headTransmit: {checked: true},
            headReceive: {checked: false},
            renderingStyle: {value: "rift" },
            defaultDisplay: {checked: false}
        }},
        { name: NO_HMD_SMARTPHONE, values:{
            speechEnable: {checked: false},
            speechTransmit: {checked: false},
            speechReceive: {checked: true},
            keyboardEnable: {checked: false},
            keyboardTransmit: {checked: false},
            keyboardReceive: {checked: true},
            mouseEnable: {checked: false},
            mouseTransmit: {checked: false},
            mouseReceive: {checked: true},
            gamepadEnable: {checked: false},
            gamepadTransmit: {checked: false},
            gamepadReceive: {checked: true},
            leapEnable: {checked: false},
            leapTransmit: {checked: false},
            leapReceive: {checked: true},
            touchEnable: {checked: true},
            touchTransmit: {checked: true},
            touchReceive: {checked: false},
            headEnable: {checked: true},
            headTransmit: {checked: true},
            headReceive: {checked: false},
            renderingStyle: {value: "regular" },
            defaultDisplay: {checked: true}
        }}
    ]);
    
    //
    // restoring the options the user selected
    //
    var formStateKey = appName + " - formState";
    var formState = getSetting(formStateKey);
    window.addEventListener("beforeunload", function(){
        var state = readForm(this.ctrls);
        setSetting(formStateKey, state);
    }, false);
    writeForm(this.ctrls, formState);
    
    window.addEventListener("touchend", this.showOnscreenControls.bind(this), false);
    
    window.addEventListener("mousemove", function(){
        if(!MouseInput.isPointerLocked()){
            this.showOnscreenControls();
        }
    }.bind(this), false);
}
    
//
// the touch-screen and mouse-controls for accessing the options screen
//
Application.prototype.hideOnscreenControls = function(){
    this.ctrls.onScreenControls.style.display = "none";
    this.hideControlsTimeout = null;
};
    
Application.prototype.showOnscreenControls = function(){
    this.ctrls.onScreenControls.style.display = "";
    if(this.hideControlsTimeout !== null){
        clearTimeout(this.hideControlsTimeout);
    }
    this.hideControlsTimeout = setTimeout(this.hideOnscreenControls.bind(this), 3000);
};

Application.prototype.setupModuleEvents = function(module, name){
    var e = this.ctrls[name + "Enable"],
        t = this.ctrls[name + "Transmit"],
        r = this.ctrls[name + "Receive"];
        z = this.ctrls[name + "Zero"];
    e.addEventListener("change", function(){
        module.enable(e.checked);
        t.disabled = !e.checked;
        if(t.checked && t.disabled){
            t.checked = false;
        }
    });
    t.addEventListener("change", function(){
        module.transmit(t.checked);
    });
    r.addEventListener("change", function(){
        module.receive(r.checked);
    });

    if(z && module.zeroAxes){
        z.addEventListener("click", module.zeroAxes.bind(module), false);
    }

    module.enable(e.checked);
    module.transmit(t.checked);
    module.receive(r.checked);
    t.disabled = !e.checked;
    if(t.checked && t.disabled){
        t.checked = false;
    }
};