//sound.js module for all sound code
"use strict";

var app = app || {};

//define sound module and invoke IIFE
app.sound = (function(){
	console.log("sound.js module loaded");
	var bgAudio = undefined;
	var currentEffect = 0;
	var currentDirection = 1;
	var effectSounds = ["1.mp3","2.mp3","3.mp3","4.mp3","5.mp3","6.mp3","7.mp3","8.mp3"];

	function init(){
		bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.25;
	}
		
	function stopBGAudio(){
		bgAudio.pause();
		bgAudio.currentTime = 0;
	}
	
	function playEffect(){
    var effectSound = document.createElement('audio');
    effectSound.volume = 0.3;
		effectSound.src = "media/" + effectSounds[currentEffect];
		effectSound.play();
		currentEffect += currentDirection;
		if (currentEffect == effectSounds.length || currentEffect == -1){
			currentDirection *= -1;
			currentEffect += currentDirection;
		}
	}
    
    function playBGAudio(){
        bgAudio.play();
    }
    
    // export a public interface to this module
	// TODO
    return{
        init: init,
        stopBGAudio: stopBGAudio,
        playBGAudio: playBGAudio,
        playEffect: playEffect
    };

}());
