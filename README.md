# Rapid Prototyping of VR Experiences

Everyone and their brother has a Kickstarter project to build "the first" 3D printed, or injection molded, or ivory-carved headset for mounting a cellphone and wearing it as a virtual reality head-mounted display. Google even got in on the deal at their most recent IO conference (2014), announcing a cardboard template and a set of APIs for making VR Android Apps.

Yet the design of good VR experiences escapes us. Take 15 minutes to an hour some day and peruse the offerings in the Google Play store for VR applications. They are universally bad. We tolerate them only insomuch as they are novel. As of this writing, I'm aware of only one actual game that is more than just a tech demo, and without VR it makes for an extremely dry experience. There is nothing in the running that stands on its own without the novelty of VR.

Looking past the low-hanging fruit of FPS games, there are currently no UI metaphors for handling the mundane aspects of managing applications: no window managers, no application launchers, no file browsers, no menu systems, no input textboxes and buttons and scroll lists. In short, VR throws away the last 50 years of well-worn human-computer interaction knowledge.

This project is about creating a template of a project and a workflow for rapidly prototyping VR experiences, accessible to both programmers with little 3D experience and 3D modellers with little programming experience. The goal is to be able to provide the tools necessary to experiment with and determine what those UI metaphors should be.

# A Demo

Here is a small scene, made in Blender, exported via Collada, running on WebGL in the browser thanks to Three.js.

https://www.seanmcbeth.com:8081/demo.html

Though it's best to set this up locally and use it over WiFi. Over the internet, it's quite laggy. So please don't complain to me about it making you sick. I know already. I have a bucket sitting next to my desk. But it's sufficient for making demos and trying things out before you decide to spend more money on an HMD.

## A Few Things to Note

1. If you open a browsing session on your PC as well as your smartphone, you can choose your own username and password and enter them in both browsers, at which point any keyboard, mouse, or gamepad input you use on your PC will be proxied to your smartphone.
2. You can choose stereo rendering with barrel distortion for use with Google Cardboard,
3. Or choose red/cyan anaglyph rendering for use with glasses on any type of display,
4. Or just skip it all and run around the really crappy landscape, viewing it with obsolete 2D display technology.
5. The only speech command is "jump".

The input proxying is necessary for using a gamepad with the demo on a smartphone because the various browser vendors haven't yet implemented HTML5 Gamepad API. But whatevs. It also makes it much more convenient to use a keyboard and mouse with the game on the smartphone.

I've so far only tested this with Google Chrome on Windows and Android, but there is no particular reason it should not work with Linux, OS X, iOS, Firefox, or Safari. There might be some browser-specific issues that need to be handled, but they should be easy to identify and overcome with testing. Also note that you don't necessarily have to match browsers on the PC with browsers on the smartphone. Mix and match to your heart's content.

# User Input

The input system is is kind of interesting. I've built an API that allows one to define groups of commands that can be activated in different ways for different input systems. In other words, it provides options for different types of UI in parallel.

This is still a work in progress. Eventually, I'll have enumerations for each of the button and axis values. But basically, buttons and axes are 1-indexed, and you can reverse their meaning by negating their index (hence why it's 1-indexed, because negative 0 doesn't mean anything in Javascript).

## Example

````javascript
    // given:
    //    socket - a WebSocket to the server
    //    canvas - a DOM element refering to the canvas to which you're rendering
    //    jump, fire - functions that execute game commands.

    // MouseInput can do buttons and three axes, 1 = mouse pointer x, 2 = mouse pointer
    // y, 3 = mouse wheel
    var mouse = new MouseInput([
        // the name parameter allows us to look up the command state by name with isDown, 
        // isUp, and getValue
        { name: "yaw", axes: [-4] },
        { name: "pitch", axes: [5] },
        // callback functions can have a cool-down time set
        { name: "jump", buttons: [2], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [1], commandDown: fire, dt: 125 },
    ], socket, canvas);

    // TouchInput can track multiple points (you specify how many with the first parameter),
    // and x/y axes for each of them. First-finger's X is axis 1, first-finger's Y is axis 2,
    // second finger's X is axis 3, etc.
    //
    // Areas of the screen can be defined as "buttons". Tap them or slide in out of them.
    var touch = new TouchInput(1, [
        { name: "jumpButton", x: 0, y: 0, w: 50, h: 50},
        { name: "fireButton", x: 60, y: 0, w: 50, h: 50},
    ], [
        { name: "yaw", axes: [-3] },
        { name: "drive", axes: [4] },
        { name: "jump", buttons: [1], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [2], commandDown: fire, dt: 125 },
    ], socket, canvas);

    // MotionInput can keep track of absolute heading, pitch, and roll (axes 1, 2, and 3,
    // and for a smartphone oriented in a head's-up, landscape position, as otherwise the 
    // phone's gyroscope returns confusing values), device acceleration, including gravity
    // (with x, y, and z compenents at axes 4, 5, and 6), and deltas of each value in the
    // next 6 axes thereafter. 
    var motion = new MotionInput([
        { name: "yaw", axes: [-7] },
        { name: "pitch", axes: [8] },
        { name: "roll", axes: [-9] }
    ], socket);


    // This one should be obvious. But note that these button values are keyCodes directly
    // and are not 1-based indices.
    var keyboard = new KeyboardInput([
        { name: "strafeLeft", buttons: [-65] },
        { name: "strafeRight", buttons: [68] },
        { name: "driveForward", buttons: [-87] },
        { name: "driveBack", buttons: [83] },
        { name: "rollLeft", buttons: [81] },
        { name: "rollRight", buttons: [-69] },
        { name: "jump", buttons: [32], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [17], commandDown: fire, dt: 125 },
        { name: "reload", buttons: [70], commandDown: reload, dt: 125 },
    ], socket);

    // GamepadInput wraps the HTML5 Gampead API and is fairly strait-forward, and if you
    // are familiar with it, you should understand what the axes and buttons mean. Also,
    // the axes can have deadzone ranges set, where values at +- the deadzone value are
    // registered as 0.
    var gamepad = new GamepadInput([
        { name: "strafe", axes: [1], deadzone: 0.1 },
        { name: "drive", axes: [2], deadzone: 0.1 },
        { name: "yaw", axes: [-3], deadzone: 0.1 },
        { name: "pitch", axes: [4], deadzone: 0.1 },
        { name: "rollRight", buttons: [5] },
        { name: "rollLeft", buttons: [-6] },
        { name: "jump", buttons: [1], commandDown: jump, dt: 250 },
        { name: "fire", buttons: [2], commandDown: fire, dt: 125 },
    ], socket);

    // SpeechInput is much simpler. The keywords array can be a series of words or
    // sentences that activate the command. Use multiple entries in the array to be able
    // to have multiple phrases execute the command. Useful when the phrase can be
    // misheard by the speech recognition engine.
    var speech = new SpeechInput([
        { keywords: ["jump"], command: jump }
    ], socket);

    function loop(dt){
        requestAnimationFrame(loop);
        // call update once a frame to make it read each device state and execute any
        // event-based commands.
        motion.update();
        keyboard.update();
        mouse.update();
        gamepad.update();
        touch.update();
        
        // motion is an absolute change, whereas the others have to be scaled to
        // the frame time. Adding them in this way works because a user would rarely
        // use them together, and in the cases when they would (such as motion tracking
        // and gamepad), they will naturally fight in a way that the user can easily
        // adjust to and use effectively.
        var heading += (gamepad.getValue("yaw") 
            + mouse.getValue("yaw")
            + touch.getValue("yaw")) * dt / 1000
            + motion.getValue("yaw");
    }
    
    requestAnimationFrame(loop);
````
