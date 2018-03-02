//loader.js
//global scope

"use strict";

//if app exists use existing copy
//or create new empty object literal

var app = app || {};

window.onload = function(){
    console.log("window.onload called");
    app.sound.init();
    app.main.sound = app.sound;
    app.main.myKeys = app.myKeys;
    app.main.Emitter = app.Emitter;
    app.main.init();
}

window.onblur = function() {
    console.log("Blur: " + Date());
    app.main.pauseGame();
};

window.onfocus = function() {
    console.log("Focus: " + Date());
    app.main.resumeGame();
};