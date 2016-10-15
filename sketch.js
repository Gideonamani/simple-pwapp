
var canvas;

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


function  setup (){
	canvas = createCanvas(windowWidth, windowHeight);
	background(0);

	canvas.position(0, 0);
	canvas.style('z-index', '-1');
}

function draw() {
	background(200);

	fill(ball.rcol, ball.gcol, ball.bcol);

	ball.x += ball.xspeed;
	ball.y += ball.yspeed;

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