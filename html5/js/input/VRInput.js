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

function VRInput(name, commands, elem, selectedID){
    ButtonAndAxisInput.call(this, name, commands, null, null, 1, VRInput.AXES);
    this.devices = {};
    this.sensor = null;
    if (navigator.getVRDevices) {
        navigator.getVRDevices().then(this.enumerateVRDevices.bind(this, elem, selectedID));
    } else if (navigator.mozGetVRDevices) {
        navigator.mozGetVRDevices(this.enumerateVRDevices.bind(this, elem, selectedID));
    }
};
VRInput.AXES = [
    "X", "Y", "Z",
    "VX", "VY", "VZ",
    "AX", "AY", "AZ",
    "RX", "RY", "RZ", "RW",
    "RVX", "RVY", "RVZ",
    "RAX", "RAY", "RAZ"
];
ButtonAndAxisInput.inherit(VRInput);

VRInput.prototype.update = function(dt){    
    if(this.sensor){
        var state = this.sensor.getState();
        this.setAxis("X", state.position.x);
        this.setAxis("Y", state.position.y);
        this.setAxis("Z", state.position.z);
        this.setAxis("VX", state.linearVelocity.x);
        this.setAxis("VY", state.linearVelocity.y);
        this.setAxis("VZ", state.linearVelocity.z);
        this.setAxis("AX", state.linearAcceleration.x);
        this.setAxis("AY", state.linearAcceleration.y);
        this.setAxis("AZ", state.linearAcceleration.z);
        this.setAxis("RX", state.orientation.x);
        this.setAxis("RY", state.orientation.y);
        this.setAxis("RZ", state.orientation.z);
        this.setAxis("RW", state.orientation.w);
        this.setAxis("RVX", state.angularVelocity.x);
        this.setAxis("RVY", state.angularVelocity.y);
        this.setAxis("RVZ", state.angularVelocity.z);
        this.setAxis("RAX", state.angularAcceleration.x);
        this.setAxis("RAY", state.angularAcceleration.y);
        this.setAxis("RAZ", state.angularAcceleration.z);
    }
    ButtonAndAxisInput.prototype.update.call(this, dt);
};

VRInput.prototype.enumerateVRDevices = function(elem, selectedID, devices){
    for(var i = 0; i < devices.length; ++i){
        var device = devices[i];
        var id = device.hardwareUnitId;
        if(!this.devices[id]){
            this.devices[id] = {
                display: null,
                sensor: null
            };
        }
        var vr = this.devices[id];
        if (device instanceof HMDVRDevice) {
            vr.display = device;
        }
        else if (devices[i] instanceof PositionSensorVRDevice) {
            vr.sensor = device;
        }        
    }
    
    for(var id in this.devices){
        var option = document.createElement("option");
        option.value = id;
        option.innerHTML = this.devices[id].sensor.deviceName;
        option.selected = (selectedID === id);
        elem.appendChild(option);
    }
    
    this.connect(selectedID);
};

VRInput.prototype.connect = function(selectedID){
    var device = this.devices[selectedID];
    if(device){
        this.sensor = device.sensor;
    }
};