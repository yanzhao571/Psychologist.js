# Rapid Prototyping of VR Experiences

Everyone and their brother has a Kickstarter project to build "the first" 3D printed, or injection molded, or ivory-carved headset for mounting a cellphone and wearing it as a virtual reality head-mounted display. Google even got in on the deal at their most recent IO conference (2014), announcing a cardboard template and a set of APIs for making VR Android Apps.

Yet the design of good VR experiences escapes us. Take 15 minutes to an hour some day and peruse the offerings in the Google Play store for VR applications. They are universally bad. We tolerate them only insomuch as they are novel. As of this writing, I'm aware of only one actual game that is more than just a tech demo, and without VR it makes for an extremely dry experience. There is nothing in the running that stands on its own without the novelty of VR.

Looking past the low-hanging fruit of FPS games, there are currently no UI metaphors for handling the mundane aspects of managing applications: no window managers, no application launchers, no file browsers, no menu systems, no input textboxes and buttons and scroll lists. In short, VR throws away the last 50 years of well-worn human-computer interaction knowledge.

This project is about creating a template of a project and a workflow for rapidly prototyping VR experiences, accessible to both programmers with little 3D experience and 3D modellers with little programming experience. The goal is to be able to provide the tools necessary to experiment with and determine what those UI metaphors should be.

# Technology

The software in this repository, the APIs it utilizes, the standards they implement, and the tools that the project uses are all open standards and Free, Open Source Software. The project is released under the GPLv3 license while I'm still developing it, and when it's closer to ready, I'll offer a paid license that doesn't not require you to also release your software under the GPLv3.

 - Blender: All models used in the demo were created by me in Blender 2.7.
 - Collada: an open standard, developed by the Khronos Group, for representing 3D model and scene data.
 - WebGL: Another open standard from the Kronos Group. The client-side graphics are rendered with WebGL, a version of OpenGL for use in Web browsers.
 - Three.js: The Three.js library provides a massive helping with its pre-built Collada importer.
 - Node.js: the server is built with Node.js. I've found Node to be very easy to setup on the three major operating systems (Windows, Linux, OS X).

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
