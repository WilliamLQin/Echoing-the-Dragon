'use strict';

/* ----------------------- IoT Configuration -------------------------------- */

var config = {};

config.IOT_BROKER_ENDPOINT = "a13a0acc0pv8gr.iot.us-east-1.amazonaws.com".toLowerCase();

config.IOT_BROKER_REGION = "us-east-1";

config.IOT_THING_NAME = "Dragonboard";

// Load AWS SDK libraries
var AWS = require('aws-sdk');

AWS.config.region = config.IOT_BROKER_REGION;

// Initialize client for IoT
var iotData = new AWS.IotData({endpoint: config.IOT_BROKER_ENDPOINT});

/* -------------------- end: IoT Configuration ------------------------------ */


/* ------------ Helpers that build all of the responses --------------------- */

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {

    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };

}

function buildSpeechletResponseSSML(title, output, repromptText, shouldEndSession) {

    return {
        outputSpeech: {
            type: 'SSML',
            ssml: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'SSML',
                ssml: repromptText,
            },
        },
        shouldEndSession,
    };

}

function buildResponse(sessionAttributes, speechletResponse) {

    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };

}

/* ---------- end: Helpers that build all of the responses ------------------ */


/* ----------- Functions that control the skill's behavior ------------------ */

function getWelcomeResponse(callback) {

    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to the Dragonboard control. ';
    // If the user either does not reply to the welcome message or says something that is not understood, they will be prompted again with this text.
    const repromptText = 'Control the Dragonboard by telling me which port you want to control.';
    const shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

function handleSessionEndRequest(callback) {

    const cardTitle = 'Session Ended';
    const speechOutput = 'Closing Dragonboard control. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));

}

function createFavoriteRelayStatusAttributes(desiredRelayStatus) {

    return {desiredRelayStatus,};

}

/**
 * Sets the relay state in the session and prepares the speech to reply to the user.
 */
function setRelayStatusInSession(intent, session, callback) {

    const cardTitle = intent.name;
    
    let sessionAttributes = {};
    const shouldEndSession = false;
    let repromptText = '';
    let speechOutput = '';

    const desiredRelayStatusSlot = intent.slots.Status;
    const desiredRelayStatus = desiredRelayStatusSlot.value;
    
    if (desiredRelayStatus === 'on' || desiredRelayStatus === 'off') {
    
        sessionAttributes = createFavoriteRelayStatusAttributes(desiredRelayStatus);
        speechOutput = "The light has been turned " + desiredRelayStatus;
        
        /*
         * Update AWS IoT
        */
        var outputPayload = desiredRelayStatus;
        
        var params = {
            topic: 'led',
            payload: outputPayload,
            qos: 0
        };
        
        iotData.publish(params, function(err, data) {
            if (err){
                console.log(err); // Handle any errors
            }
            else {
                console.log("success");
            }
        });
        
    }

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

}

function setGpioInSession(intent, session, callback) {

    const cardTitle = intent.name;
    
    let sessionAttributes = {};
    const shouldEndSession = false;
    let repromptText = '';
    let speechOutput = '';

    const desiredRelayStatusSlot = intent.slots.Status;
    const desiredRelayGpioSlot = intent.slots.Gpio;
    
    const desiredRelayStatus = desiredRelayStatusSlot.value;
    const desiredRelayGpio = desiredRelayGpioSlot.value;
    
    if ((parseInt(desiredRelayGpio) > 22 || parseInt(desiredRelayGpio) < 35) && (desiredRelayStatus === 'on' || desiredRelayStatus === 'off')) {
    
        sessionAttributes = createFavoriteRelayStatusAttributes(desiredRelayStatus);
        speechOutput = "Port " + desiredRelayGpio + " has been turned " + desiredRelayStatus;
    
        /*
         * Update AWS IoT
        */
        var outputPayload = desiredRelayGpio + " " + desiredRelayStatus;
        
        var params = {
            topic: 'led',
            payload: outputPayload,
            qos: 0
        };
        
        iotData.publish(params, function(err, data) {
            if (err){
                console.log(err); // Handle any errors
            }
            else {
                console.log("success");
            }
        });
    
    }

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

const leds = [31, 30, 29, 33, 27, 26, 25, 24, 23];
var ledOn = [1, 1, 1, 1, 1, 1, 1, 1, 1];

function setNimInSession(intent, session, callback) {
    
    const cardTitle = intent.name;
    
    let sessionAttributes = {};
    const shouldEndSession = false;
    let repromptText = '';
    let speechOutput = '<speak>what?</speak>';
    
    const desiredRelayCommandSlot = intent.slots.Command;
    const desiredRelayCommand = desiredRelayCommandSlot.value;
    
    if (desiredRelayCommand === 'play') {
        
        speechOutput = "<speak>Let's play NIM! The goal of the game is to be the one to turn off the last LED. You can only turn off one or two LEDs each turn. You can go first.</speak>";
        repromptText = "<speak>Say one or two to turn off one or two LEDs.</speak>"
        
        ledOn = [1, 1, 1, 1, 1, 1, 1, 1, 1];
        
        var outputPayload = "on";
        
        var params = {
            topic: 'led',
            payload: outputPayload,
            qos: 0
        };
        
        iotData.publish(params, function(err, data) {
            if (err){
                console.log(err); // Handle any errors
            }
            else {
                console.log("success");
            }
        });
        
    }
    if (desiredRelayCommand == 'one' || desiredRelayCommand == 'two' || desiredRelayCommand == 1 || desiredRelayCommand == 2) {
        
        speechOutput = "<speak>You turned " + desiredRelayCommand + " LEDs off.";
        
        var alexaTurn = 0;
        
        if (desiredRelayCommand == 'one' || desiredRelayCommand == 1) {
            searchAndShutoff(false);
            searchAndShutoff(true);
            searchAndShutoff(false);
            alexaTurn = 2;
        }
        else if (desiredRelayCommand == 'two' || desiredRelayCommand == 2) {
            searchAndShutoff(false);
            searchAndShutoff(false);
            searchAndShutoff(true);
            alexaTurn = 1;
        }
        
        speechOutput += '<break time="2s"/>' + "I'll turn off " + alexaTurn + " LEDs.</speak>";
        
    }
    
    callback(sessionAttributes, buildSpeechletResponseSSML(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function searchAndShutoff(delay) {
    var index = -1;
            
    for (var i = 0; i < ledOn.length; i++) {
        if(ledOn[i] == 1) {
            ledOn[i] = 0;
            index = i;
            break;
        }
    }
    
    if (index == -1) {
        
        return;
    }
    
    var outputPayload = leds[index] + " off";
    
    if (delay) {
        outputPayload += " 2";
    }

    var params = {
        topic: 'led',
        payload: outputPayload,
        qos: 0
    };
    
    iotData.publish(params, function(err, data) {
        if (err){
            console.log(err); // Handle any errors
        }
        else {
            console.log("success");
        }
    });
}

/* --------- end: Functions that control the skill's behavior --------------- */


/* ----------------------------- Events ------------------------------------- */

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {

    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);

}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'RelayStatusIsIntent') {setRelayStatusInSession(intent, session, callback);}
    else if (intentName === 'RelayGpioActivateIntent') {setGpioInSession(intent, session, callback);}
    else if (intentName === 'RelayNimIntent') {setNimInSession(intent, session, callback);}
    else if (intentName === 'AMAZON.HelpIntent') {getWelcomeResponse(callback);}
    else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {handleSessionEndRequest(callback);}
    else {throw new Error('Invalid intent');}

}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here

}

/* --------------------------- end: Events ---------------------------------- */


/* -------------------------- Main handler ---------------------------------- */

// Route the incoming request based on type (LaunchRequest, IntentRequest, etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {

    try {

        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');l
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        }
        else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        }
        else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }

    }
    catch (err) {callback(err);}

};

/* ----------------------- end: Main handler -------------------------------- */