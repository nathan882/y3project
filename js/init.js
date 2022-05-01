var globals;

function init() {

	//create object to store global variables
	globals = new Globals();

	globals.canvas.width = window.innerWidth -380; //sidebar etc. width
	globals.canvas.height = window.innerHeight - 100;

	//enable touch interactions if supported on the current device:
	createjs.Touch.enable(globals.stage);

	//enable mouse over / out events
	globals.stage.enableMouseOver(10);
	globals.stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas

	//create listener that only updates canvas when 'update' set to true
	createjs.Ticker.addEventListener("tick", function(){
		if (globals.update) {
			globals.update = false; // only update once
			globals.stage.update();
		}
	});

	window.onload = window.onresize = function() {
		globals.canvas.width = window.innerWidth-380;
		globals.canvas.height = window.innerHeight-100;
		drawGrid();
		globals.stage.update();
	}

	drawGrid();
}
