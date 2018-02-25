//main.js
//controller class to contain references

"use strict"

var app = app || {};

//main is an object literal
//Object literal, property of app global

app.main = {
    //properties
    width: 640,
    height: 480,
    canvas: undefined,
    ctx: undefined,
    lastTime: 0, //used by calculateDeltaTime()
    debug: true,
    paused: false,
    animationID: 0,
    //fillStyle: 'red',
    //init circle properties
    circle: Object.freeze({
        num_circles_start: 5,
        num_circles_end: 20,
        start_radius: 8,
        max_radius: 45,
        min_radius: 2,
        max_lifetime: 2.5,
        max_speed: 80,
        explosion_speed: 60,
        implosion_speed: 84,
    }),
    //circle related
    circle_state: {
        normal: 0,
        exploding: 1,
        max_size: 2,
        imploding: 3,
        done: 4
    },
    gameState: undefined,
    roundScore: 0,
    totalScore: 0,
    game_state: { //fake enumeration
        begin: 0,
        default: 1,
        exploding: 2,
        round_over: 3,
        repeat_level: 4,
        end: 5
    },
    circles: [],
    numCircles: this.num_circles_start,
    // original 8 fluorescent crayons: https://en.wikipedia.org/wiki/List_of_Crayola_crayon_colors#Fluorescent_crayons
    //  "Ultra Red", "Ultra Orange", "Ultra Yellow","Chartreuse","Ultra Green","Ultra Blue","Ultra Pink","Hot Magenta"
    colors: ["#FD5B78","#FF6037","#FF9966","#FFFF66","#66FF66","#50BFE6","#FF6EFF","#EE34D2"],
    bgAudio: undefined,
    currentEffect: 0,
    currentDirection: 1,
    effectSounds: ["1.mp3","2.mp3","3.mp3","4.mp3","5.mp3","6.mp3","7.mp3","8.mp3"],
    
    //methods
    init : function() {
        console.log("app.main.init() called");
        //initialize properties
        this.canvas = document.querySelector("canvas");
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.ctx = this.canvas.getContext("2d");
        
        //circles
        //intentional break//this.circle.num_circles_start = 100;
        this.numCircles = this.circle.num_circles_start;
        this.circles = this.makeCircles(this.numCircles);
        
        this.gameState = this.game_state.begin;
        
        this.canvas.onmousedown = this.doMousedown.bind(this);
        this.bgAudio = document.querySelector("#bgAudio");
        this.bgAudio.volume = 0.25;
        
        this.reset();

        //start game loop
        this.update();
    },
    
    //create level of circles
    reset: function(){
        this.numCircles += 5;
        this.roundScore = 0;
        this.circles = this.makeCircles(this.numCircles);
    },
    
    update: function(){
        //1 Loop
        //schedule call to update
        this.animationID = requestAnimationFrame(this.update.bind(this));
        
        //2 Paused? Bail out
        if(this.paused){
            this.drawPauseScreen(this.ctx);
            return;
        }
        
        //3 How much time has passed
        var dt = this.calculateDeltaTime();
        
        //4 Update - move circles
        this.moveCircles(dt);
        
        //Check for collision
        this.checkForCollisions();
        
        //5 Draw
        //5a    draw background
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0,0,this.width,this.height);
        
        //5b    draw circles
        this.ctx.globalAlpha = 0.9;
        this.drawCircles(this.ctx);

        //5c    draw HUD
        this.ctx.globalAlpha = 1.0;
        this.drawHUD(this.ctx);
        
        //5d    draw debug
        if(this.debug){
            //draw dt in bottom right
            this.fillText(this.ctx,"dt: " + dt.toFixed(3),
            this.width - 150, this.height - 10, "18pt courier", "white");
        }
    },
    
    pauseGame: function(){
       this.paused = true;
        
       //stop animation loop
        cancelAnimationFrame(this.animationID);
        this.stopBGAudio();
        
        //call update()
        this.update();
    },
    
    stopBGAudio: function(){
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
    },
    
    resumeGame: function() {
        //stop animation loop in case its running
        cancelAnimationFrame(this.animationID);
        
        this.paused = false;
        this.bgAudio.play();
        
        //restart loop
        this.update();
    },
    
    drawHUD: function(ctx){
		ctx.save(); // NEW
		// draw score
      	// fillText(string, x, y, css, color)
		this.fillText(this.ctx,"This Round: " + this.roundScore + " of " + this.numCircles, 20, 20, "14pt courier", "#ddd");
		this.fillText(this.ctx,"Total Score: " + this.totalScore, this.width - 200, 20, "14pt courier", "#ddd");

		// NEW
		if(this.gameState == this.game_state.begin){
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx,"To begin, click a circle", this.width/2, this.height/2, "30pt courier", "white");
		} // end if
	
		// NEW
		if(this.gameState == this.game_state.round_over){
			ctx.save();
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(this.ctx,"Round Over", this.width/2, this.height/2 - 40, "30pt courier", "red");
			this.fillText(this.ctx,"Click to continue", this.width/2, this.height/2, "30pt courier", "red");
			this.fillText(this.ctx,"Next round there are " + (this.numCircles + 5) + " circles", this.width/2 , this.height/2 + 35, "20pt courier", "#ddd");
		} // end if
		
		ctx.restore(); // NEW
	},
    
    playEffect: function (){
        var effectSound = document.createElement('audio');
        effectSound.volume = 0.3;
        effectSound.src = "media/" + this.effectSounds[this.currentEffect];
        effectSound.play();
        this.currentEffect += this.currentDirection;
        if(this.currentEffect == this.effectSounds.length || this.currentEffect == -1){
            this.currentDirection *= -1;
            this.currentEffect += this.currentDirection;
        }
    },
    
    checkForCollisions: function(){
		if(this.gameState == this.game_state.exploding){
			// check for collisions between circles
			for(var i=0;i<this.circles.length; i++){
				var c1 = this.circles[i];
				// only check for collisions if c1 is exploding
				if (c1.state === this.circle_state.normal) continue;   
				if (c1.state === this.circle_state.done) continue;
				for(var j=0;j<this.circles.length; j++){
					var c2 = this.circles[j];
				// don't check for collisions if c2 is the same circle
					if (c1 === c2) continue; 
				// don't check for collisions if c2 is already exploding 
					if (c2.state != this.circle_state.normal ) continue;  
					if (c2.state === this.circle_state.done) continue;
				
					// Now you finally can check for a collision
					if(circlesIntersect(c1,c2) ){
                        this.playEffect();
						c2.state = this.circle_state.exploding;
						c2.xSpeed = c2.ySpeed = 0;
						this.roundScore ++;
					}
				}
			} // end for
			
			// round over?
			var isOver = true;
			for(var i=0;i<this.circles.length; i++){
				var c = this.circles[i];
				if(c.state != this.circle_state.normal && c.state != this.circle_state.done){
				 isOver = false;
				 break;
				}
			} // end for
		
			if(isOver){
				this.gameState = this.game_state.round_over;
				this.totalScore += this.roundScore;
                this.stopBGAudio();
			 }
				
		} // end if GAME_STATE_EXPLODING
	},
    
    checkCircleClicked: function(mouse){
        //loop through array backwards
        for(var i= this.circles.length-1;i>=0;i--){
            var c = this.circles[i];
            if(pointInsideCircle(mouse.x, mouse.y, c)){
                this.playEffect();
                c.xSpeed = c.ySpeed = 0;
                c.state = this.circle_state.exploding;
                this.gameState = this.game_state.exploding;
                this.roundScore ++;
                //console.log(this.roundScore);
                break; //only one circle
            }
        }
    },
    
    doMousedown: function(e) {
        this.bgAudio.play();        
        //unpause on a click
        //don't get stuck
        if(this.paused) {
            this.paused=false;
            this.update();
            return;
        };
        
        //only click one circle
        if(this.gameState == this.game_state.exploding) return;
        
        //if round if over, reset and add more circles
        if(this.gameState == this.game_state.round_over){
            this.gameState = this.game_state.default;
            this.reset();
            return;
        }
        
        var mouse = getMouse(e);
        //console.log("(mouse.x,mouse.y)=" + mouse.x + "," + mouse.y);
        this.checkCircleClicked(mouse);
    },
        
    drawPauseScreen: function(ctx){
        ctx.save();
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,this.width,this.height);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.fillText(this.ctx,'**PAUSED**',this.width/2,this.height/2, '40pt courier', 'white');
        ctx.restore();
    },
        
    drawCircles: function(ctx){
        if(this.gameState == this.game_state.round_over) this.ctx.globalAlpha = 0.25;
        for(var i=0;i<this.circles.length;i++){
            var c = this.circles[i];
            if(c.state === this.circle_state.done) continue;
            c.draw(ctx);
        }
    },
    moveCircles: function(dt){
        for(var i=0;i<this.circles.length;i++){
            var c = this.circles[i];
            
            if(c.state === this.circle_state.done) continue;
            if(c.state === this.circle_state.exploding){
                c.radius += this.circle.explosion_speed * dt;
                if(c.radius >= this.circle.max_radius){
                    c.state = this.circle_state.max_size;
                    console.log("circle #" + i + " hit circle.max_radius");
                }
                continue;
            }
            
            if(c.state === this.circle_state.max_size){
                c.lifetime += dt;
                if(c.lifetime >= this.circle.max_lifetime){
                    c.state = this.circle_state.imploding;
                    console.log("circle #" + i + " hit circle.max_lifetime");
                }
                continue;
            }
            
            if(c.state === this.circle_state.imploding){
                c.radius -= this.circle.implosion_speed * dt;
                if(c.radius <= this.circle.min_radius){
                    console.log("circle #" + i + " hit circle.min_radius and GONE");
                    c.state = this.circle_state.done;
                    continue;
                }
            }
        
            c.move(dt);
            
            if(this.circleHitLeftRight(c)) {
                c.xSpeed *= -1;
                c.move(dt);
            }
            if(this.circleHitTopBottom(c)) {
                c.ySpeed *= -1;
                c.move(dt);
            }
        }
    },
        
    makeCircles: function(num){
        var circleDraw = function(ctx){
            //draw circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
            ctx.closePath();
            ctx.fillStyle = this.fillStyle;
            ctx.fill();
            ctx.restore();
        };
        
        var circleMove = function(dt){
            this.x += this.xSpeed * this.speed * dt;
            this.y += this.ySpeed * this.speed * dt;
            //console.log("moving circles: " + this.x);
        };
        
        var array = [];
        //debugger;
        for(var i=0; i<num; i++){
            //make new object literal
            var c = {};
            
            //x&y properties
            c.x = getRandom(this.circle.start_radius*2,this.width-this.circle.start_radius*2);
            c.y = getRandom(this.circle.start_radius*2,this.height-this.circle.start_radius*2);
            
            //radius
            c.radius = this.circle.start_radius;
            
            var randomVector = getRandomUnitVector();
            c.xSpeed = randomVector.x;
            c.ySpeed = randomVector.y;
            c.speed = this.circle.max_speed;
            c.fillStyle = this.colors[i % this.colors.length];
            c.state = this.circle_state.normal;
            c.lifetime = 0;
            
            c.draw = circleDraw;
            c.move = circleMove;
            //console.dir(c);
            
            //no more properties
            Object.seal(c);
            array.push(c);
        }
        return array;
    },
    
    fillText: function(ctx,string,x,y,css,color){
        ctx.save();
        ctx.font = css;
        ctx.fillStyle = color;
        ctx.fillText(string,x,y);
        ctx.restore();
    },
    
    calculateDeltaTime: function(){
        var now,fps;
        
        now = performance.now();
        fps = 1000 / (now - this.lastTime);
        fps = clamp(fps, 12, 60);
        this.lastTime = now;
        return 1/fps;
        //console.log("time ran");
    },    
    
    //bouncing
    circleHitLeftRight: function(c){
        if(c.x<c.radius || c.x > this.width - c.radius){
            return true;
        }
    },
    circleHitTopBottom: function(c){
        if(c.y<c.radius || c.y > this.height - c.radius){
            return true;
        }
    }
    

}; //end app.main
    
    













