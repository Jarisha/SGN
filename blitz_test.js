var Blitz = require('blitz');

var email = "slimstown@gmail.com",
    apiKey = "d8752bd9-b578e7b4-937e22a4-54253f20",
    myWebsite = "stress.quyay.com",
    blitz= new Blitz(email, apiKey);

// Run a sprint
blitz.sprint({
    steps: [{url: myWebsite}],
    region: 'california'
}).on('status', function (data) {
    // do something...
}).on('complete', function (data) {
    console.log('region: ' + data.region);
    console.log('duration: ' + data.duration);
    var steps = data.steps;
    for(var i in steps) {
        var step = steps[i];
        console.log("> Step " + i);
        console.log("\tstatus: " + step.response.status);
        console.log("\tduration: " + step.duration);
        console.log("\tconnect: " + step.connect);
    }
}).on('error', function (response) {
    console.log("error: " + response.error);    
    console.log("reason: " + response.reason);
});

// Run a rush
blitz.rush({
    steps: [{url: myWebsite}],
    region: 'california',
    pattern: { intervals: [{start: 1, end: 10, duration: 30}]}
}).on('status', function (data) {
    // do something...
}).on('complete', function (data) {
    console.log('region: ' + data.region);
    console.log('duration: ' + data.duration);
    var steps = data.steps;
    for(var i in steps) {
        var step = steps[i];
        console.log("> Step " + i);
        console.log("\tstatus: " + step.response.status);
        console.log("\tduration: " + step.duration);
        console.log("\tconnect: " + step.connect);
    }
}).on('error', function (response) {
    console.log("error: " + response.error);    
    console.log("reason: " + response.reason);
});

//Run a sprint or rush using the command parser
blitz.execute('-r ireland http://example.com').on('status', function (data) {
    // do something...
}).on('complete', function (data) {
    console.log('region: ' + data.region);
    console.log('duration: ' + data.duration);
    var steps = data.steps;
    for(var i in steps) {
        var step = steps[i];
        console.log("> Step " + i);
        console.log("\tstatus: " + step.response.status);
        console.log("\tduration: " + step.duration);
        console.log("\tconnect: " + step.connect);
    }
}).on('error', function (response) {
    console.log("error: " + response.error);	
    console.log("reason: " + response.reason);
});