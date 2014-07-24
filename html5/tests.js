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

getScript("testing.js", function(){
    consoleTest(Angle);
});