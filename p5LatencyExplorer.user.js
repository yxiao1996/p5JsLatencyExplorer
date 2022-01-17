// ==UserScript==
// @name         p5LatencyExplorer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  This script is a plugin for p5.js developer to explorer latencies on their UI.
// @author       yxiao
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?domain=p5js.org
// @grant        none
// @require       http://ajax.googleapis.com/ajax/libs/jquery/3.5.0/jquery.min.js
// ==/UserScript==

(async function() {
    'use strict';

    console.log("Load UI onto the page.");

    // Create a div for the UI panel, more details on the style attribute see this link:
    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Properties_Reference
    // For API of the Element interface see: https://developer.mozilla.org/en-US/docs/Web/API/Element
    let uiPanel = document.createElement('div');
    uiPanel.id = "ui-panel";
    uiPanel.style.border = "2px dotted";
    uiPanel.style.marginBottom = "5px";
    uiPanel.innerHTML = "<h3>p5.js latency explorer - Breakdown the latencies for your 'draw' function</h3>";
    $('body').prepend(uiPanel);

    // Add a p tag to show message to user
    let messageBox = document.createElement('p');
    messageBox.id = "message-box";
    messageBox.style.color = "BLUE";
    messageBox.innerText = "";
    $('#ui-panel').append(messageBox);

    updateMessageBox("Wait for 1 second for the page to load.");
    await sleep(1000);
    let targetFunctionNames = [];
    if (typeof draw === "function") {
        updateMessageBox("draw function exists, analyzing its source code to find functions to add timers.");

        // TODO: improve lexical analysis here, I can definitely be smarter.
        let drawSource = draw.toString().split('\n');
        let functionNameMatching;
        const functionNameBlockList = ["draw", "if", "for", "switch"];
        drawSource.forEach((line) => {
            // Iterate through each line of the function source code, Look for a function name and half parentheses
            const regex = /[A-Za-z]+\(/;
            functionNameMatching = regex.exec(line);
            if (functionNameMatching) {
                functionNameMatching.forEach((functionName) => {
                    // Split out the final '(' at the end of the string
                    functionName = functionName.substring(0, functionName.length - 1);
                    if (!functionNameBlockList.includes(functionName)) {
                        console.log("Find function call to: " + functionName + " in 'draw' function.");
                        targetFunctionNames.push(functionName);
                    }
                });
            }
        });
    } else {
        updateMessageBox("draw function doesn't exist in global scope, exiting.");
        return;
    }
    let timerManager = new TimerManager(window);
    timerManager.createTimer("draw");
    // Create timers for functions found in 'draw'
    targetFunctionNames.forEach((functionName) => {
        timerManager.createTimer(functionName);
    });

    // Add an input box and button for user to add timer
    let timedFunctionInput = document.createElement("input");
    timedFunctionInput.type = "text";
    timedFunctionInput.style.margin = "3px";
    timedFunctionInput.id = "function-name-input";
    $("#ui-panel").append(timedFunctionInput);
    let newTimerButton = document.createElement("button");
    newTimerButton.innerHTML = "add function timer";
    newTimerButton.style.margin = "3px";
    $("#ui-panel").append(newTimerButton);
    newTimerButton.onclick = function () {
        timerManager.createTimer($("#function-name-input").val());
    };

    updateMessageBox("Function timers created, wait for couple of seconds for timers to start reporting running times.");

})();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateMessageBox(message) {
    $('#message-box').text(message);
}

class TimerManager {

    constructor(windowContext) {
        this.windowContext = windowContext;
        this.timers = new Map();  // Create a empty map to store all the timer objects.
        setInterval(this.updateTimers, 1000, this);
    }

    updateTimers(context) {
        // Iterate through all timers and update states on UI
        let uiElementId;
        let latency;
        context.timers.forEach((timer, functionName) => {
            uiElementId = context.getDisplayElementId(functionName);
            latency = timer.computeLatency().toFixed(2);

            // Update timer in UI
            $("#" + uiElementId).text(functionName + " time: " + str(latency) + " ms");
            console.log(functionName + " time: " + str(latency) + " ms");
        });
    }

    createTimer(functionName) {
        let targetFunction = this.windowContext[functionName];
        if (!(typeof targetFunction === "function")) {
            // Verify function exist
            console.log("Function '" + functionName + "' doesn't exist, please check your input!")
            return;
        }
        let elementId = this.getDisplayElementId(functionName);
        if ($("#" + elementId).length > 0) {
            console.log("The function '" + functionName + "' is already being monitored as we have a display for it.");
            return
        }
        let functionTimer = new RunningAverageTimer(functionName, 1000);
        const proxyHandler = {
            apply: (target, thisArg, argumentsList) => {
                let funcStartTime = new Date();
                Reflect.apply(target, thisArg, argumentsList);
                let funcEndTime = new Date();
                functionTimer.addSample(funcEndTime - funcStartTime);
            }
        };
        this.windowContext[functionName] = new Proxy(targetFunction, proxyHandler);

        // Create a display for the function timer and append to UI panel
        let timerDisplay = document.createElement('div');
        timerDisplay.id = elementId;
        $("#ui-panel").append(timerDisplay);

        // Add timer to manager
        this.timers.set(functionName, functionTimer);
    }

    getDisplayElementId(functionName) {
        return functionName + "-display";
    }
}

class RunningAverageTimer {

    constructor(timerName, maxSampleCount) {
        this.timerName = timerName;
        this.maxSampleCount = maxSampleCount;
        this.samples = [];
        this.average = (array) => array.reduce((a, b) => a + b) / array.length;
    }

    addSample(sample) {
        if (this.samples.length >= this.maxSampleCount) {
            this.samples.pop();
        }
        this.samples.push(sample);
    }

    computeLatency() {
        if (this.samples.length == 0) {
            console.log(this.timerName + ": no time measurement available, the function is not called yet!");
            return 0;
        }
        return this.average(this.samples);
    }
}