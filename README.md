# Rapid Prototyping of VR Experiences

Everyone is excited about Virtual Reality. But do we know how to make good VR software? Looking past the low-hanging fruit of FPS games, there is currently no consensus on best-practices for VR design. We still need to develop a lot of UI metaphors for handling the mundane aspects of managing applications: window managers,  application launchers, file browsers, menu systems, input textboxes and buttons and scroll lists. Hell, we're even still having trouble making it easy to select things! VR essentially throws away the last 50 years of well-worn human-computer interaction knowledge.

This project provides an application abstraction for 3D world-oriented VR experiences that
 - Degrades gracefully to a variety of user experiences, for both stereo displays with Oculus Rift and Google Cardboard, and flat displays for smartphones, tablets, and PCs,
 - Provides a variety of user input systems at your fingertips--literally, in the case of devices like the Leap Motion,
 - Simplifies the many issues of cross-browser compatibility,
 - Focus the workflow on content creation with free (as in freedom *and* beer), open source software,
 - And provides built-in support for multi-user, collaborative experiences.

With the goal that having as much of the piping of VR software hidden away can enable designers and developers to rapidly prototype VR experiences and start to come to a concensus on UI metaphors that work for real people in real scenarios.

# A Demo

https://www.seanmcbeth.com:8081/holodeck.html

## A Few Things to Note

1. If you open a browsing session on your PC as well as your smartphone, you can choose your own username and password and enter them in both browsers, at which point any keyboard, mouse, or gamepad input you use on your PC will be proxied to your smartphone.
2. You can choose stereo rendering with barrel distortion for use with Google Cardboard,
3. Or choose red/cyan anaglyph rendering for use with glasses on any type of display,
4. Or just skip it all and run around the tiny room, viewing it with obsolete 2D display technology.
5. Use your Leap Motion or mouse to move the pointer and slap it down on the buttons. Use the mouse wheel to move the pointer further away from you.
6. Hold shift while moving the mouse to turn your view on the PC. On smartphones, just move the device.

The input proxying is necessary for using a gamepad with the demo on a smartphone because the various browser vendors haven't yet implemented HTML5 Gamepad API. But whatevs. It also makes it much more convenient to use a keyboard and mouse with the game on the smartphone.

I've so far only tested this with Firefox and Google Chrome on Windows, Linux, and Android, but there is no particular reason it should not work with OS X, iOS, and Safari. It's *mostly* compatible with Internet Explorer, though there are some UI issues that need to be worked out, the basic premise is there.

Also note that you don't necessarily have to match browsers on the PC with browsers on the smartphone. Mix and match to your heart's content.

# Technology

The software in this repository, the APIs it utilizes, the standards they implement, and the tools that the project uses are all open standards and Free, Open Source Software. The project is released under the GPLv3 license while I'm still developing it, and when it's closer to ready, I'll offer a paid license option that doesn't not require you to also release your software under the GPLv3.

 - Blender: All models used in the demo were created by me in Blender 2.7.
 - Collada: an open standard, developed by the Khronos Group, for representing 3D model and scene data.
 - WebGL: Another open standard from the Kronos Group. The client-side graphics are rendered with WebGL, a version of OpenGL for use in Web browsers.
 - Three.js: The Three.js library provides a massive helping with its pre-built Collada importer.
 - Node.js: the server is built with Node.js. I've found Node to be very easy to setup on the three major operating systems (Windows, Linux, OS X).
