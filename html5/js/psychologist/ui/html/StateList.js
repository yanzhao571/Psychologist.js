/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// so named because it keeps me from going crazy

/*
 * The StateList is a set of objects that can be mapped to DOM elements
 * in such a way to alter their state. The UI presents a drop down list
 * and the select action changes the various controls as the state set
 * dictates. It's a way of streamlining the altering of UI state by select
 * list.
 * 
 * States take the form of:
 * { name: "A string for display", values: [
 *      {
 *          ctrlName1: {attributeName1: value1, attributeName2: value2 },
 *          ctrlName2: {attributeName3: value3, attributeName4: value4 }
 *      |]}
 *      
 *  The states paramareter should be an array of such objects
 */
function StateList(id, ctrls, states, parent){
    var select = cascadeElement(id, "select", HTMLSelectElement);
    for(var i = 0; i < states.length; ++i){
        var opt = document.createElement("option");
        opt.appendChild(document.createTextNode(states[i].name));
        select.appendChild(opt);
    }
    select.addEventListener("change", function(){
        var values = states[select.selectedIndex].values;
        if(values !== undefined){
            for(var id in values){
                if(values.hasOwnProperty(id)){
                    var attrs = values[id];
                    for(var attr in attrs){
                        if(attrs.hasOwnProperty(attr)){
                            ctrls[id][attr] = attrs[attr];
                        }
                    }
                }
            }
            for(var key in ctrls){
                if(key !== select.id){
                    var evt = new Event("change");
                    ctrls[key].dispatchEvent(evt);
                }
            }
        }
    }.bind(this), false);
    if(parent && !select.parentElement){
        parent.appendChild(select);
    }
    
    this.DOMElement = select;
}