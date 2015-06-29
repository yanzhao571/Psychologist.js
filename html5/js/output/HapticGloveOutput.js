/*
 * Copyright (C) 2015 Sean T. McBeth <sean@seanmcbeth.com>
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

function HapticGloveOutput(){

  var addr = HapticGloveOutput.DEFAULT_HOST;
  if(HapticGloveOutput.DEFAULT_PORT !== 80){
    addr += ":" + HapticGloveOutput.DEFAULT_PORT;
  }

  var socket = io.connect(addr, {
      "reconnect": true,
      "reconnection delay": 1000,
      "max reconnection attempts": 60
  });

  var fingerState = 0;

  this.setFingerState = function(i, value){
    var mask = 0x1 << i;
    if(value){
      fingerState = fingerState | mask;
    }
    else{
      fingerState = fingerState & ~mask & 0x1f;
    }
    socket.emit("data", fingerState);
  };

}

HapticGloveOutput.DEFAULT_PORT = 9080;
HapticGloveOutput.DEFAULT_HOST = document.location.hostname;
