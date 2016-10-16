
// Dom object variables
var canvas;
var xSpeedInput;
var ySpeedInput;

// Ball object
var ball = {
	x:40,
	y:40,

	r:20,

	xspeed:6,
	yspeed:8,

	rcol:100,
	gcol:100,
	bcol:100,

}

// Action during the canvas initializations
function  setup (){
	canvas = createCanvas(windowWidth, windowHeight);
	canvas.position(0, 0);
	canvas.style('z-index', '-1');
	// background(0);

	// input DOM elements
	xSpeedInput = createSlider(-24, 24, 5, 0.5);
	xSpeedInput.style('width', '100px');
	xSpeedInput.parent('#left-side');

	ySpeedInput = createSlider(-30, 30, 8, 0.5);
	ySpeedInput.style('width', '100px');
	ySpeedInput.parent('#right-side');

	bw = createSlider(0, 255, 100);
	bw.style('width', '100px');
	bw.parent('#center');


	// Event listener to update the ball speed when the input values
	// have been upadates
	xSpeedInput.changed(function(){
		console.log("this XX has been changed");
		ball.xspeed = xSpeedInput.value();

	});
	ySpeedInput.changed(function(){
		console.log("the YYYYY has been changed");
		ball.yspeed = ySpeedInput.value();

	});	
}

// Actions that repeat over and over again
function draw() {
	background(bw.value());

	fill(ball.rcol, ball.gcol, ball.bcol);

	// ball.yspeed = ySpeedInput.value();

	ball.x += ball.xspeed
	ball.y += ball.yspeed

	ellipse(ball.x, ball.y, ball.r, ball.r);

	if (ball.x > width || ball.x < 0){
		ball.xspeed = -ball.xspeed;
		ball.rcol = random(255);
		ball.bcol = random(100);
		ball.gcol = random(80);
	}
	if (ball.y > height || ball.y < 0){
		ball.yspeed = -ball.yspeed;
		ball.rcol += random(100);
		ball.bcol = random(255);
		ball.gcol += random(75);
	}

}

function windowResized(){
	// console.log("I am a happy man.");
	resizeCanvas(windowWidth, windowHeight);
}