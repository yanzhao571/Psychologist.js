function KeyboardInput(name, commands, socket, DOMElement){

    for(var i = 0; i < commands.length; ++i){
        var cmd = commands[i];
        if(cmd.preamble){
            cmd.commandUp = function(thunk){
                textEntry = true;
                text = "";
                insertionPoint = 0;
                onTextEntryComplete = thunk;
                this.enable(false);
            }.bind(this, cmd.commandUp);
        }
    }

    NetworkedInput.call(this, name, null, commands, socket, 0, 0);

    var textEntry = false,
        onTextEntryComplete = null,
        text = null,
        insertionPoint = null;
    
    function execute(stateChange, event){
        if(textEntry && stateChange){
            if(event.keyCode == KeyboardInput.ENTER){
                textEntry = false;
                onTextEntryComplete(text, true);
                this.enable(true);
            }
            else{
                var key = event.keyCode;
                if(KeyboardInput.NUMPAD0 <= key && key <= KeyboardInput.NUMPAD9){
                    key += KeyboardInput.NUMBER0 - KeyboardInput.NUMPAD0;
                }

                if(key == KeyboardInput.BACKSPACE){
                    text = text.substring(0, insertionPoint - 1) + text.substring(insertionPoint);
                    --insertionPoint;
                }
                else if(key == KeyboardInput.DELETE){
                    text = text.substring(0, insertionPoint) + text.substring(insertionPoint + 1);
                }
                else if(key == KeyboardInput.LEFTARROW){
                    --insertionPoint;
                }
                else if(key == KeyboardInput.RIGHTARROW){
                    ++insertionPoint;
                }
                else if(key == KeyboardInput.HOME){
                    insertionPoint = 0;
                }
                else if(key == KeyboardInput.END){
                    insertionPoint = text.length;
                }
                else if(event.shiftKey && KeyboardInput.UPPERCASE[key]){
                    text = text.substring(0, insertionPoint) + KeyboardInput.UPPERCASE[key] + text.substring(insertionPoint);
                    ++insertionPoint;
                }
                else if(!event.shiftKey && KeyboardInput.LOWERCASE[key]){
                    text = text.substring(0, insertionPoint) + KeyboardInput.LOWERCASE[key] + text.substring(insertionPoint);
                    ++insertionPoint;
                }

                insertionPoint = Math.max(0, Math.min(text.length, insertionPoint));
                onTextEntryComplete(text, false);
                event.preventDefault();
            }
        }
        else{
            this.setButton(event.keyCode, stateChange);
        }
    }

    DOMElement = DOMElement || document;
    DOMElement.addEventListener("keydown", execute.bind(this, true), false);
    DOMElement.addEventListener("keyup", execute.bind(this, false), false);
}

inherit(KeyboardInput, NetworkedInput);

KeyboardInput.BACKSPACE = 8;
KeyboardInput.TAB = 9;
KeyboardInput.ENTER = 13;
KeyboardInput.SHIFT = 16;
KeyboardInput.CTRL = 17;
KeyboardInput.ALT = 18;
KeyboardInput.PAUSEBREAK = 19;
KeyboardInput.CAPSLOCK = 20;
KeyboardInput.ESCAPE = 27;
KeyboardInput.SPACEBAR = 32;
KeyboardInput.PAGEUP = 33;
KeyboardInput.PAGEDOWN = 34;
KeyboardInput.END = 35;
KeyboardInput.HOME = 36;
KeyboardInput.LEFTARROW = 37;
KeyboardInput.UPARROW = 38;
KeyboardInput.RIGHTARROW = 39;
KeyboardInput.DOWNARROW = 40;
KeyboardInput.INSERT = 45;
KeyboardInput.DELETE = 46;
KeyboardInput.NUMBER0 = 48;
KeyboardInput.NUMBER1 = 49;
KeyboardInput.NUMBER2 = 50;
KeyboardInput.NUMBER3 = 51;
KeyboardInput.NUMBER4 = 52;
KeyboardInput.NUMBER5 = 53;
KeyboardInput.NUMBER6 = 54;
KeyboardInput.NUMBER7 = 55;
KeyboardInput.NUMBER8 = 56;
KeyboardInput.NUMBER9 = 57;
KeyboardInput.A = 65;
KeyboardInput.B = 66;
KeyboardInput.C = 67;
KeyboardInput.D = 68;
KeyboardInput.E = 69;
KeyboardInput.F = 70;
KeyboardInput.G = 71;
KeyboardInput.H = 72;
KeyboardInput.I = 73;
KeyboardInput.J = 74;
KeyboardInput.K = 75;
KeyboardInput.L = 76;
KeyboardInput.M = 77;
KeyboardInput.N = 78;
KeyboardInput.O = 79;
KeyboardInput.P = 80;
KeyboardInput.Q = 81;
KeyboardInput.R = 82;
KeyboardInput.S = 83;
KeyboardInput.T = 84;
KeyboardInput.U = 85;
KeyboardInput.V = 86;
KeyboardInput.W = 87;
KeyboardInput.X = 88;
KeyboardInput.Y = 89;
KeyboardInput.Z = 90;
KeyboardInput.LEFTWINDOWKEY = 91;
KeyboardInput.RIGHTWINDOWKEY = 92;
KeyboardInput.SELECTKEY = 93;
KeyboardInput.NUMPAD0 = 96;
KeyboardInput.NUMPAD1 = 97;
KeyboardInput.NUMPAD2 = 98;
KeyboardInput.NUMPAD3 = 99;
KeyboardInput.NUMPAD4 = 100;
KeyboardInput.NUMPAD5 = 101;
KeyboardInput.NUMPAD6 = 102;
KeyboardInput.NUMPAD7 = 103;
KeyboardInput.NUMPAD8 = 104;
KeyboardInput.NUMPAD9 = 105;
KeyboardInput.MULTIPLY = 106;
KeyboardInput.ADD = 107;
KeyboardInput.SUBTRACT = 109;
KeyboardInput.DECIMALPOINT = 110;
KeyboardInput.DIVIDE = 111;
KeyboardInput.F1 = 112;
KeyboardInput.F2 = 113;
KeyboardInput.F3 = 114;
KeyboardInput.F4 = 115;
KeyboardInput.F5 = 116;
KeyboardInput.F6 = 117;
KeyboardInput.F7 = 118;
KeyboardInput.F8 = 119;
KeyboardInput.F9 = 120;
KeyboardInput.F10 = 121;
KeyboardInput.F11 = 122;
KeyboardInput.F12 = 123;
KeyboardInput.NUMLOCK = 144;
KeyboardInput.SCROLLLOCK = 145;
KeyboardInput.SEMICOLON = 186;
KeyboardInput.EQUALSIGN = 187;
KeyboardInput.COMMA = 188;
KeyboardInput.DASH = 189;
KeyboardInput.PERIOD = 190;
KeyboardInput.FORWARDSLASH = 191;
KeyboardInput.GRAVEACCENT = 192;
KeyboardInput.OPENBRACKET = 219;
KeyboardInput.BACKSLASH = 220;
KeyboardInput.CLOSEBRACKET = 221;
KeyboardInput.SINGLEQUOTE = 222;

KeyboardInput.LOWERCASE = {};
KeyboardInput.LOWERCASE[KeyboardInput.A] = "a";
KeyboardInput.LOWERCASE[KeyboardInput.B] = "b";
KeyboardInput.LOWERCASE[KeyboardInput.C] = "c";
KeyboardInput.LOWERCASE[KeyboardInput.D] = "d";
KeyboardInput.LOWERCASE[KeyboardInput.E] = "e";
KeyboardInput.LOWERCASE[KeyboardInput.F] = "f";
KeyboardInput.LOWERCASE[KeyboardInput.G] = "g";
KeyboardInput.LOWERCASE[KeyboardInput.H] = "h";
KeyboardInput.LOWERCASE[KeyboardInput.I] = "i";
KeyboardInput.LOWERCASE[KeyboardInput.J] = "j";
KeyboardInput.LOWERCASE[KeyboardInput.K] = "k";
KeyboardInput.LOWERCASE[KeyboardInput.L] = "l";
KeyboardInput.LOWERCASE[KeyboardInput.M] = "m";
KeyboardInput.LOWERCASE[KeyboardInput.N] = "n";
KeyboardInput.LOWERCASE[KeyboardInput.O] = "o";
KeyboardInput.LOWERCASE[KeyboardInput.P] = "p";
KeyboardInput.LOWERCASE[KeyboardInput.Q] = "q";
KeyboardInput.LOWERCASE[KeyboardInput.R] = "r";
KeyboardInput.LOWERCASE[KeyboardInput.S] = "s";
KeyboardInput.LOWERCASE[KeyboardInput.T] = "t";
KeyboardInput.LOWERCASE[KeyboardInput.U] = "u";
KeyboardInput.LOWERCASE[KeyboardInput.V] = "v";
KeyboardInput.LOWERCASE[KeyboardInput.W] = "w";
KeyboardInput.LOWERCASE[KeyboardInput.X] = "x";
KeyboardInput.LOWERCASE[KeyboardInput.Y] = "y";
KeyboardInput.LOWERCASE[KeyboardInput.Z] = "z";
KeyboardInput.LOWERCASE[KeyboardInput.SPACEBAR] = " ";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER0] = "0";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER1] = "1";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER2] = "2";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER3] = "3";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER4] = "4";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER5] = "5";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER6] = "6";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER7] = "7";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER8] = "8";
KeyboardInput.LOWERCASE[KeyboardInput.NUMBER9] = "9";
KeyboardInput.LOWERCASE[KeyboardInput.MULTIPLY] = "*";
KeyboardInput.LOWERCASE[KeyboardInput.ADD] = "+";
KeyboardInput.LOWERCASE[KeyboardInput.SUBTRACT] = "-";
KeyboardInput.LOWERCASE[KeyboardInput.DECIMALPOINT] = ".";
KeyboardInput.LOWERCASE[KeyboardInput.DIVIDE] = "/";
KeyboardInput.LOWERCASE[KeyboardInput.SEMICOLON] = ";";
KeyboardInput.LOWERCASE[KeyboardInput.EQUALSIGN] = "=";
KeyboardInput.LOWERCASE[KeyboardInput.COMMA] = ",";
KeyboardInput.LOWERCASE[KeyboardInput.DASH] = "-";
KeyboardInput.LOWERCASE[KeyboardInput.PERIOD] = ".";
KeyboardInput.LOWERCASE[KeyboardInput.FORWARDSLASH] = "/";
KeyboardInput.LOWERCASE[KeyboardInput.GRAVEACCENT] = "`";
KeyboardInput.LOWERCASE[KeyboardInput.OPENBRACKET] = "[";
KeyboardInput.LOWERCASE[KeyboardInput.BACKSLASH] = "\\";
KeyboardInput.LOWERCASE[KeyboardInput.CLOSEBRACKET] = "]";
KeyboardInput.LOWERCASE[KeyboardInput.SINGLEQUOTE] = "'";

KeyboardInput.UPPERCASE = {};
KeyboardInput.UPPERCASE[KeyboardInput.A] = "A";
KeyboardInput.UPPERCASE[KeyboardInput.B] = "B";
KeyboardInput.UPPERCASE[KeyboardInput.C] = "C";
KeyboardInput.UPPERCASE[KeyboardInput.D] = "D";
KeyboardInput.UPPERCASE[KeyboardInput.E] = "E";
KeyboardInput.UPPERCASE[KeyboardInput.F] = "F";
KeyboardInput.UPPERCASE[KeyboardInput.G] = "G";
KeyboardInput.UPPERCASE[KeyboardInput.H] = "H";
KeyboardInput.UPPERCASE[KeyboardInput.I] = "I";
KeyboardInput.UPPERCASE[KeyboardInput.J] = "J";
KeyboardInput.UPPERCASE[KeyboardInput.K] = "K";
KeyboardInput.UPPERCASE[KeyboardInput.L] = "L";
KeyboardInput.UPPERCASE[KeyboardInput.M] = "M";
KeyboardInput.UPPERCASE[KeyboardInput.N] = "N";
KeyboardInput.UPPERCASE[KeyboardInput.O] = "O";
KeyboardInput.UPPERCASE[KeyboardInput.P] = "P";
KeyboardInput.UPPERCASE[KeyboardInput.Q] = "Q";
KeyboardInput.UPPERCASE[KeyboardInput.R] = "R";
KeyboardInput.UPPERCASE[KeyboardInput.S] = "S";
KeyboardInput.UPPERCASE[KeyboardInput.T] = "T";
KeyboardInput.UPPERCASE[KeyboardInput.U] = "U";
KeyboardInput.UPPERCASE[KeyboardInput.V] = "V";
KeyboardInput.UPPERCASE[KeyboardInput.W] = "W";
KeyboardInput.UPPERCASE[KeyboardInput.X] = "X";
KeyboardInput.UPPERCASE[KeyboardInput.Y] = "Y";
KeyboardInput.UPPERCASE[KeyboardInput.Z] = "Z";
KeyboardInput.UPPERCASE[KeyboardInput.SPACEBAR] = " ";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER0] = ")";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER1] = "!";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER2] = "@";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER3] = "#";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER4] = "$";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER5] = "%";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER6] = "^";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER7] = "&";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER8] = "*";
KeyboardInput.UPPERCASE[KeyboardInput.NUMBER9] = "(";
KeyboardInput.UPPERCASE[KeyboardInput.MULTIPLY] = "*";
KeyboardInput.UPPERCASE[KeyboardInput.ADD] = "+";
KeyboardInput.UPPERCASE[KeyboardInput.SUBTRACT] = "-";
KeyboardInput.UPPERCASE[KeyboardInput.DECIMALPOINT] = ".";
KeyboardInput.UPPERCASE[KeyboardInput.DIVIDE] = "/";
KeyboardInput.UPPERCASE[KeyboardInput.SEMICOLON] = ":";
KeyboardInput.UPPERCASE[KeyboardInput.EQUALSIGN] = "+";
KeyboardInput.UPPERCASE[KeyboardInput.COMMA] = "<";
KeyboardInput.UPPERCASE[KeyboardInput.DASH] = "_";
KeyboardInput.UPPERCASE[KeyboardInput.PERIOD] = ">";
KeyboardInput.UPPERCASE[KeyboardInput.FORWARDSLASH] = "?";
KeyboardInput.UPPERCASE[KeyboardInput.GRAVEACCENT] = "~";
KeyboardInput.UPPERCASE[KeyboardInput.OPENBRACKET] = "{";
KeyboardInput.UPPERCASE[KeyboardInput.BACKSLASH] = "|";
KeyboardInput.UPPERCASE[KeyboardInput.CLOSEBRACKET] = "}";
KeyboardInput.UPPERCASE[KeyboardInput.SINGLEQUOTE] = "\"";
/*
https://www.github.com/capnmidnight/VR
Copyright (c) 2014 Sean T. McBeth
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this 
  list of conditions and the following disclaimer in the documentation and/or 
  other materials provided with the distribution.

* Neither the name of Sean T. McBeth nor the names of its contributors
  may be used to endorse or promote products derived from this software without 
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. 
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, 
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, 
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, 
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF 
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE 
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
OF THE POSSIBILITY OF SUCH DAMAGE.
*/