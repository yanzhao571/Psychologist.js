function KeyboardInput(name, commands, socket, DOMElement){
    NetworkedInput.call(this, name, null, commands, socket, 0, 0);
    
    function execute(stateChange, event){
        this.setButton(event.keyCode, stateChange);
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
KeyboardInput.PAGEUP = 33;
KeyboardInput.SPACEBAR = 32;
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