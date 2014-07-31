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

Corrector.testData = [
    [true, 270, 67.7, 17.4, -8.6, 2.8, 3.5, 0],
    [true, 225, 67.1, 0, -8.9, 0, 3.8, 45],
    [true, 180, 62.9, -15.4, -8.3, -2.6, 4.3, 90],
    [true, 135, 67.7, 17.4, -8.6, 2.8, 3.5, 135],
    [true, 90, 67.1, 0, -8.9, 0, 3.8, 180],
    [true, 45, 67.7, 17.4, -8.6, 2.8, 3.5, 225],
    [true, 0, 67.1, 0, -8.9, 0, 3.8, 270],
    [true, 315, 62.9, -15.4, -8.3, -2.6, 4.3, 315],
    [true, 90, -61.4, 161.5, -8.1, 3.1, -4.4, 0],
    [true, 45, -56.3, 180, -8.2, 0, -5.5, 45],
    [true, 0, -54.2, -169.6, -7.9, -1.8, -5.7, 90],
    [true, 315, -61.4, 161.5, -8.1, 3.1, -4.4, 135],
    [true, 270, -56.3, 180, -8.2, 0, -5.5, 180],
    [true, 225, -61.4, 161.5, -8.1, 3.1, -4.4, 225],
    [true, 180, -56.3, 180, -8.2, 0, -5.5, 270],
    [true, 135, -54.2, -169.6, -7.9, -1.8, -5.7, 315],
    [true, 90, -58.5, -14.7, 8.1, -2.5, 5, 0],
    [true, 45, -59, 0, 8.4, 0, 5.1, 45],
    [true, 0, -55.5, 14.2, 7.8, 2.4, 5.4, 90],
    [true, 315, -58.5, -14.7, 8.1, -2.5, 5, 135],
    [true, 270, -59, 0, 8.4, 0, 5.1, 180],
    [true, 225, -58.5, -14.7, 8.1, -2.5, 5, 225],
    [true, 180, -59, 0, 8.4, 0, 5.1, 270],
    [true, 135, -55.5, 14.2, 7.8, 2.4, 5.4, 315],
    [true, 270, 56.7, -169, 8.2, -1.9, -5.4, 0],
    [true, 225, 57.9, 180, 8.5, 0, -5.3, 45],
    [true, 180, 57.7, 159.5, 7.9, 3.5, -5, 90],
    [true, 135, 56.7, -169, 8.2, -1.9, -5.4, 135],
    [true, 90, 57.9, 180, 8.5, 0, -5.3, 180],
    [true, 45, 57.7, 159.5, 7.9, 3.5, -5, 225],
    [true, 0, 56.7, -169, 8.2, -1.9, -5.4, 270],
    [true, 315, 57.9, 180, 8.5, 0, -5.3, 315],
    [false, 270, 60.5, 19.2, -8, 3.2, 4.5, 0],
    [false, 225, 58.6, 0, -8.3, 0, 5.1, 45],
    [false, 180, 55.2, -12.9, -7.8, -2.1, 5.4, 90],
    [false, 135, 60.5, 19.2, -8, 3.2, 4.5, 135],
    [false, 90, 58.6, 0, -8.3, 0, 5.1, 180],
    [false, 45, 55.2, -12.9, -7.8, -2.1, 5.4, 225],
    [false, 0, 58.6, 0, -8.3, 0, 5.1, 270],
    [false, 315, 55.2, -12.9, -7.8, -2.1, 5.4, 315],
    [false, 270, 63.5, 162.8, -8.4, 2.9, -4.2, 0],
    [false, 225, 67, 180, -9, 0, -3.8, 45],
    [false, 180, 62.8, -169.8, -8.6, -1.7, -4.4, 90],
    [false, 135, 63.5, 162.8, -8.4, 2.9, -4.2, 135],
    [false, 90, 67, 180, -9, 0, -3.8, 180],
    [false, 45, 62.8, -169.8, -8.6, -1.7, -4.4, 225],
    [false, 0, 63.5, 162.8, -8.4, 2.9, -4.2, 270],
    [false, 315, 67, 180, -9, 0, -3.8, 315],
    [false, 90, -63.5, -17.8, 8.4, -3, 4.2, 0],
    [false, 45, -59.8, 0, 8.5, 0, 4.9, 45],
    [false, 0, -58.9, 16.3, 8.1, 2.7, 4.9, 90],
    [false, 315, -63.5, -17.8, 8.4, -3, 4.2, 135],
    [false, 270, -59.8, 0, 8.5, 0, 4.9, 180],
    [false, 225, -58.9, 16.3, 8.1, 2.7, 4.9, 225],
    [false, 180, -63.5, -17.8, 8.4, -3, 4.2, 270],
    [false, 135, -59.8, 0, 8.5, 0, 4.9, 315],
    [false, 90, -58.7, -153.9, 7.7, -4.4, -4.7, 0],
    [false, 45, -58.8, 180, 8.5, 0, -5.2, 45],
    [false, 0, -58.7, -153.9, 7.7, -4.4, -4.7, 90],
    [false, 315, -58.8, 180, 8.5, 0, -5.2, 135],
    [false, 270, -58.7, -153.9, 7.7, -4.4, -4.7, 180],
    [false, 225, -58.8, 180, 8.5, 0, -5.2, 225],
    [false, 180, -58.7, -153.9, 7.7, -4.4, -4.7, 270],
    [false, 135, -58.8, 180, 8.5, 0, -5.2, 315]];

Corrector.primaryTest = function(isChrome, alpha, gamma, beta, x, y, z, expectedHeading){
    var c = new Corrector(isChrome);
    c.orientation = {alpha: alpha, gamma: gamma, beta: beta};
    c.acceleration = {x: x, y: y, z: z};
    var h = c.heading;
    while(h < 0) h += 360;
    while(h >= 360) h -= 360;
    Assert.areEqual(expectedHeading, h);
};

Corrector.tests = {
    instantiate: function(){
        Assert.isNotNull(new Corrector(true));
    },
};

Corrector.testData.forEach(function(dat, i){
    Corrector.tests[fmt("heading$1$2$3_$4", 
        (dat[0] ? "C" : "F"),
        (dat[4] < 0 ? "P" : "S"),
        (dat[6] < 0 ? "U" : "D"),
        dat[7])] = Corrector.primaryTest.bind(Corrector, dat[0],dat[1],dat[2],dat[3],dat[4],dat[5],dat[6],dat[7]);
});

getScript("testing.js", function(){
    consoleTest(Angle);
    consoleTest(Corrector);
});