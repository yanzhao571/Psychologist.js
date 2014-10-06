var Angle = LandscapeMotion.Angle;
var Corrector = LandscapeMotion.Corrector;
Angle.tests = {
    zero: function(){
        var a = new Angle(0);
        Assert.areEqual(0, a.degrees);
        Assert.areEqual(0, a.radians);
    },

    noInitialValue: function(){
        Assert.throwsError(function(){
            new Angle();
        });
    },

    setDegreesLessThan180: function(){
        var a = new Angle(0);
        a.degrees = 90;
        Assert.areEqual(90, a.degrees);
        Assert.areEqual(Math.PI /2, a.radians);
    },

    setDegreesMoreThan180: function(){
        var a = new Angle(0);
        a.degrees = 185;
        Assert.areEqual(-175, a.degrees);
    },

    setNegativeDegrees: function(){
        var a = new Angle(0);
        a.degrees = -27;
        Assert.areEqual(-27, a.degrees);
    },

    set450Degrees: function(){
        var a = new Angle(0);
        a.degrees = 450;
        Assert.areEqual(90, a.degrees);
    },

    setNegative450Degrees: function(){
        var a = new Angle(0);
        a.degrees = -450;
        Assert.areEqual(-90, a.degrees);
    },

    setLoopingDegreesPast360: function(){
        var a = new Angle(359);
        a.degrees = 1;
        Assert.areEqual(361, a.degrees);
    },

    setLoopingDegreesPast360And180: function(){
        var a = new Angle(0);
        a.degrees = 360 + 180 + 1;
        Assert.areEqual(-179, a.degrees);
    },

    setLoopingDegreesPast360Twice: function(){
        var a = new Angle(0);
        a.degrees = 721;
        Assert.areEqual(1, a.degrees);
    },

    setLoopingDegreesBehindNegative1: function(){
        var a = new Angle(1);
        a.degrees = 359;
        Assert.areEqual(-1, a.degrees);
    },

    setRadians: function(){
        var a = new Angle(0);
        a.radians = Math.PI;
        Assert.areEqual(180, a.degrees);
        Assert.areEqual(Math.PI, a.radians);
    }
};

// test data from https://docs.google.com/spreadsheets/d/1TrOV-6cNVoJgTJ_BUxv0IQeqCuIzJ9kJ14WjIBUNK4E

Corrector.headingTestData = [
//IsChrome, alpha, gamma, beta, x, y, z, expected: heading, pitch, roll
[true,270,67.7,17.4,-8.6,2.8,3.5,0,-22.3,-17.4],
[true,225,67.1,0,-8.9,0,3.8,45,-22.9,0],
[true,180,62.9,-15.4,-8.3,-2.6,4.3,90,-27.1,15.4],
[true,135,67.7,17.4,-8.6,2.8,3.5,135,-22.3,-17.4],
[true,90,67.1,0,-8.9,0,3.8,180,-22.9,0],
[true,45,67.7,17.4,-8.6,2.8,3.5,225,-22.3,-17.4],
[true,0,67.1,0,-8.9,0,3.8,270,-22.9,0],
[true,315,62.9,-15.4,-8.3,-2.6,4.3,315,-27.1,15.4],
[true,90,-61.4,161.5,-8.1,3.1,-4.4,0,28.6,-18.5],
[true,45,-56.3,180,-8.2,0,-5.5,45,33.7,0],
[true,0,-54.2,-169.6,-7.9,-1.8,-5.7,90,35.8,10.4],
[true,315,-61.4,161.5,-8.1,3.1,-4.4,135,28.6,-18.5],
[true,270,-56.3,180,-8.2,0,-5.5,180,33.7,0],
[true,225,-61.4,161.5,-8.1,3.1,-4.4,225,28.6,-18.5],
[true,180,-56.3,180,-8.2,0,-5.5,270,33.7,0],
[true,135,-54.2,-169.6,-7.9,-1.8,-5.7,315,35.8,10.4],
[true,90,-58.5,-14.7,8.1,-2.5,5,0,-31.5,-14.7],
[true,45,-59,0,8.4,0,5.1,45,-31,0],
[true,0,-55.5,14.2,7.8,2.4,5.4,90,-34.5,14.2],
[true,315,-58.5,-14.7,8.1,-2.5,5,135,-31.5,-14.7],
[true,270,-59,0,8.4,0,5.1,180,-31,0],
[true,225,-58.5,-14.7,8.1,-2.5,5,225,-31.5,-14.7],
[true,180,-59,0,8.4,0,5.1,270,-31,0],
[true,135,-55.5,14.2,7.8,2.4,5.4,315,-34.5,14.2],
[true,270,56.7,-169,8.2,-1.9,-5.4,0,33.3,-11],
[true,225,57.9,180,8.5,0,-5.3,45,32.1,0],
[true,180,57.7,159.5,7.9,3.5,-5,90,32.3,20.5],
[true,135,56.7,-169,8.2,-1.9,-5.4,135,33.3,-11],
[true,90,57.9,180,8.5,0,-5.3,180,32.1,0],
[true,45,56.7,-169,8.2,-1.9,-5.4,225,33.3,-11],
[true,0,57.9,180,8.5,0,-5.3,270,32.1,0],
[true,315,57.7,159.5,7.9,3.5,-5,315,32.3,20.5],
[false,270,60.5,19.2,-8,3.2,4.5,0,-29.5,-19.2],
[false,225,58.6,0,-8.3,0,5.1,45,-31.4,0],
[false,180,55.2,-12.9,-7.8,-2.1,5.4,90,-34.8,12.9],
[false,135,60.5,19.2,-8,3.2,4.5,135,-29.5,-19.2],
[false,90,58.6,0,-8.3,0,5.1,180,-31.4,0],
[false,45,60.5,19.2,-8,3.2,4.5,225,-29.5,-19.2],
[false,0,58.6,0,-8.3,0,5.1,270,-31.4,0],
[false,315,55.2,-12.9,-7.8,-2.1,5.4,315,-34.8,12.9],
[false,270,63.5,162.8,-8.4,2.9,-4.2,0,26.5,-17.2],
[false,225,67,180,-9,0,-3.8,45,23,0],
[false,180,62.8,-169.8,-8.6,-1.7,-4.4,90,27.2,10.2],
[false,135,63.5,162.8,-8.4,2.9,-4.2,135,26.5,-17.2],
[false,90,67,180,-9,0,-3.8,180,23,0],
[false,45,63.5,162.8,-8.4,2.9,-4.2,225,26.5,-17.2],
[false,0,67,180,-9,0,-3.8,270,23,0],
[false,315,62.8,-169.8,-8.6,-1.7,-4.4,315,27.2,10.2],
[false,90,-63.5,-17.8,8.4,-3,4.2,0,-26.5,-17.8],
[false,45,-59.8,0,8.5,0,4.9,45,-30.2,0],
[false,0,-58.9,16.3,8.1,2.7,4.9,90,-31.1,16.3],
[false,315,-63.5,-17.8,8.4,-3,4.2,135,-26.5,-17.8],
[false,270,-59.8,0,8.5,0,4.9,180,-30.2,0],
[false,225,-58.9,16.3,8.1,2.7,4.9,225,-31.1,16.3],
[false,180,-63.5,-17.8,8.4,-3,4.2,270,-26.5,-17.8],
[false,135,-59.8,0,8.5,0,4.9,315,-30.2,0],
[false,90,-58.9,16.3,8.1,2.7,4.9,0,-31.1,16.3],
[false,45,-58.8,180,8.5,0,-5.2,45,31.2,0],
[false,0,-57,162.6,8,3,-5.2,90,33,17.4],
[false,315,-58.9,16.3,8.1,2.7,4.9,135,-31.1,16.3],
[false,270,-58.8,180,8.5,0,-5.2,180,31.2,0],
[false,225,-58.9,16.3,8.1,2.7,4.9,225,-31.1,16.3],
[false,180,-58.8,180,8.5,0,-5.2,270,31.2,0],
[false,135,-57,162.6,8,3,-5.2,315,33,17.4]];

Corrector.primaryTest = function(isChrome, alpha, gamma, beta, x, y, z, heading, pitch, roll){
    var c = new Corrector(isChrome);
    c.orientation = {alpha: alpha, gamma: gamma, beta: beta};
    c.acceleration = {x: x, y: y, z: z};
    var h = new Angle(heading);
    var p = new Angle(pitch);
    var r = new Angle(roll);
    h.degrees = c.heading;
    p.degrees = c.pitch;
    r.degrees = c.roll;
    Assert.areEqual(heading, h.degrees);
    Assert.areEqual(pitch, p.degrees);
    Assert.areEqual(roll, r.degrees);
};

Corrector.tests = {
    instantiate: function(){
        Assert.isNotNull(new Corrector(true));
    }
};

Corrector.headingTestData.forEach(function(dat){
    //0IsChrome, 1alpha, 2gamma, 3beta, 4x, 5y, 6z, 7heading, 8pitch, 9roll
    Corrector.tests[fmt("heading$1$2$3 a$4 g$5 b$6",
        (dat[0] ? "C" : "F"),
        (dat[4] < 0 ? "P" : "S"),
        (dat[6] < 0 ? "D" : "U"),
        dat[7],
        dat[2],
        dat[3])] = function(){
            Corrector.primaryTest.apply(Corrector, dat);
        };
});

include("test/testing.js", function(){
    consoleTest(Angle);
    consoleTest(Corrector);
});