## p5.js latency explorer - Breakdown the latencies for your 'draw' function

This repository contains the source code of a tampermonkey userscript which is designed to help artists/programmers who work with p5.js to understand about the performance of their p5.js based web pages.

### What it is all about?

On a high-level, the plugin is trying to do 2 things:

1. Break down the 'draw' function of the current page to its function calls.
2. Create a timer for each of the function called by 'draw' and continuously monitor their running time.

The goal here is to help you(the programmer) identify chunks of code that is causing negative impact on your page's performance. 

### Performance Budgeting

p5.js is popular among artist/programmers partly due to its "simplicity". Although people apprently enjoy themselves for creating awsome visual effects with little amount of code, there's always something we need to have in our mind - performance.

Why performance is important? It is because we want our code(web page) be appreciated by everybody, but we can't assume everybody will view it using a powerful computer. Nobody like sluggish website and most people won't be as patient as you - the programmer, toward slow website.

Thus, we need to pay attention to performance. We need to be awared of how much latency each visual effect brings to the page. For example, to maintain a 20 FPS experience, we have only 50ms latency budget in the bank. We need to be careful not to spend budget on those visual that is barely visible but really expensive in terms of latency. I would like to called these visuals "bad investment" for our budget. The whole purpose of this tool is to help you find "bad investment" on your p5 web page.

### How to use it?

1. Install Tampermonkey on your browser of choice.
2. Install userscript from https://github.com/yxiao1996/p5JsLatencyExplorer/blob/main/p5LatencyExplorer.user.js

You can verify your installation with the sample p5.js page comes with this repo. To run the sample:

1. run `source start_server.sh`
2. open your browser with the plugin installed and go to: http://127.0.0.1:8000/sample.html

You should be able to see something like the following:

![SamplePageSnapshot](/pics/sample_snapshot.png)

### Background Story

My friends and I were working on a project with p5.js. After sometime, while we add bunch of visuals onto the page, the performance of the page becomes inacceptable. It was very bad, on my laptop it's under 5fps and its clearly suffering. 

