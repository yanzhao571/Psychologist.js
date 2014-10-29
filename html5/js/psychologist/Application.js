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

function Application(ctrls){
    new TabSet(ctrls.options).DOMElement.style.width = pct(100);
    
    var NO_HMD_SMARTPHONE = "Smartphone - no HMD";
    new StateList(ctrls.deviceTypes, ctrls, [
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
}