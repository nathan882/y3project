class Transition {
  #start_st;
  #end_st;
  #stroke_width;
  #stroke_color;
  #line;
  #midpoint;
  #logic;
  #text; //create js object to display logic statement

  constructor(start_st) {
    this.#start_st = start_st;
    this.#stroke_color = "rgba(0,0,0,1)";
    this.#stroke_width = 2;

    this.#line = new createjs.Shape();
    this.#line.parentObj = this;

    this.#midpoint = new createjs.Shape();
    this.#midpoint.parentObj = this;
    this.#midpoint.graphics.beginFill("black").drawPolyStar(0, 0, 10, 3, 0, -90);

    this.#text = new createjs.Text("", "20px Arial", "#000000");
    this.#text = Object.assign(this.#text, {
      maxWidth: 100,
      textAlign: "center",
      textBaseline: "middle",
      parentObj: this
    });

    this.#line.cursor = this.#midpoint.cursor = this.#text.cursor = "pointer";
    globals.stage.addChild(this.#line, this.#midpoint, this.#text, this.#start_st, this.#start_st.parentObj.getName()); //re-add start state so it draws over transition

    let clickHandler = function() {
      document.getElementById("logicIn").value = this.parentObj.getText().text; //id was 'inputId'
      globals.elementUnderFocus = this.parentObj;

      document.getElementById("trOps").className="list-unstyled";
      document.getElementById("stOps").className="collapse list-unstyled disabled";
    }

    this.#line.on("click", clickHandler);
    this.#midpoint.on("click", clickHandler);
    this.#text.on("click", clickHandler);

    globals.transitions.push(this);
  }

  //Draw single line between states
  #drawLine(startX, startY, endX, endY) {
    this.#line.graphics.clear();
    this.#line.graphics.setStrokeStyle(this.#stroke_width).beginStroke(this.#stroke_color);
    this.#line.graphics.moveTo(startX, startY);
    this.#line.graphics.lineTo(endX, endY);
    this.#line.graphics.endStroke();

    this.#midpoint.x = startX + (endX - startX) / 2;
    this.#midpoint.y = startY + (endY - startY) / 2;

    let offset = 0;
    if(endY >= startY) offset = 180;
    this.#midpoint.rotation = offset + (-180 / Math.PI) * Math.atan((endX - this.#midpoint.x) / (endY - this.#midpoint.y));

    this.#text.x = this.#midpoint.x;
    this.#text.y = this.#midpoint.y - 20;
  }

  //Draw line to self
  #drawSelf() {
    const y13 = this.#start_st.y - (this.#start_st.radius/2);
    const x1 = this.#start_st.x - Math.sqrt((3/4) * this.#start_st.radius**2);
    const x3 = this.#start_st.x + Math.sqrt((3/4) * this.#start_st.radius**2);
    const x2 = x1+((x3-x1)/2);
    const y2 = y13 - 150;

    this.#line.graphics.clear();
    this.#line.graphics.setStrokeStyle(this.#stroke_width).beginStroke(this.#stroke_color);
    this.#line.graphics.bezierCurveTo(x1, y13, x2, y2, x3, y13);

    this.#midpoint.x = x2
    this.#midpoint.y = y2 + 85;
    this.#midpoint.rotation = 90;

    this.#text.x = this.#midpoint.x;
    this.#text.y = this.#midpoint.y - 20;
  }

  //Draw lines for double transition
  #drawDouble() {
    const x1 = this.#start_st.x;
    const y1 = this.#start_st.y;
    const x2 = this.#end_st.x;
    const y2 = this.#end_st.y;
    const line_mul = 100; //'width' of curved lines

    //midpoint coords
    const midx = x1 + (x2 - x1) / 2;
    const midy = y1 + (y2 - y1) / 2;

    //x/y dif / 2
    const x = (x2 - x1) / 2;
    const y = (y2 - y1) / 2;

    //stops sides flipping when y pos/neg changes
    let sign;
    if(y > 0) sign = -1;
    else sign = 1;

    //calculate angle
    const a = Math.atan(x/y);
    let b = sign * (Math.PI/2) - a;

    //stops sides flipping if ydif = 0
    if (b == 0) b = Math.PI;
    else if (b == Math.PI) b = 0;

    //calculate control point coords from x/y offsets from midpoint
    const cpx = midx - Math.sin(b) * line_mul;
    const cpy = midy + Math.cos(b) * line_mul;

    //draw line
    this.#line.graphics.clear();
    this.#line.graphics.setStrokeStyle(this.#stroke_width).beginStroke(this.#stroke_color);
    this.#line.graphics.bezierCurveTo(x1, y1, cpx, cpy, x2, y2);

    //draw midpoint
    let offset = 0;
    if(y2 >= y1) offset = 180;
    this.#midpoint.rotation = offset + (-180 / Math.PI) * Math.atan((x2 - midx) / (y2 - midy));
    this.#midpoint.y = midy - (midy - cpy) * 0.45; //0.45 offsets from control points to align with line
    this.#midpoint.x = midx - (midx - cpx) * 0.45; //not exact match (obvious when increase line_mul)
    this.#text.x = this.#midpoint.x;
    this.#text.y = this.#midpoint.y - 20;
  }

  //Draws between 2 states once they're connected
  drawToStates() {
    if(this.#end_st){ //stops error if try to move origin state when drawing to cursor
      //self transition
      if(this.#start_st == this.#end_st){
        this.#drawSelf();
      }
      else {
        //check for double transition
        let double = false, t;
        for(t of this.#end_st.parentObj.transitions)
          if(t.getStatesIds().toString() == this.getStatesIds().reverse().toString()){ double = true; break; }

        //draw line
        if(double) { this.#drawDouble(); t.drawDouble(); }
        else this.#drawLine(this.#start_st.x, this.#start_st.y, this.#end_st.x, this.#end_st.y);
      }
      globals.update = true;
    }
  }

  //Need this to redraw existing transition when making double transition
  drawDouble(){
    this.#drawDouble();
    globals.update = true;
  }

  //Draws to cursor when end state hasn't been connected yet
  drawToCursor(event) {
    const canvasCoords = globals.canvas.getBoundingClientRect(); //need in case canvas not at (0,0) of page

    let endX = event.x-canvasCoords.left;
    let endY = event.y-canvasCoords.top;

    //need to offset end coords so line isn't drawn exactly at pointer coords (otherwise can't click anything but line)
    if (endX > this.#start_st.x) {endX--;} else {endX++;}
    if (endY > this.#start_st.y) {endY--;} else {endY++;}

    this.#drawLine(this.#start_st.x, this.#start_st.y, endX, endY);
    globals.update = true;
  }

  delete() {
    //avoids bug when pressing delete while drawing to cursor
    if(globals.programState == "cursor") globals.programState = "waiting";

    //need to redraw remaining line if double transition, so check
    let t;
    if(this.#end_st){
      for(t of this.#end_st.parentObj.transitions)
        if(t.getStatesIds().toString() == this.getStatesIds().reverse().toString()) break;
    }

    //remove from canvas
    globals.stage.removeChild(this.#line, this.#midpoint, this.#text);
    globals.update = true;

    //remove 'this' from start and end states
    this.#start_st.parentObj.deleteTransition(this);
    if(this.#end_st) this.#end_st.parentObj.deleteTransition(this);

    //redraw remaining line
    if(this.#end_st & t) t.drawToStates();

    globals.transitions = globals.transitions.filter(t => t != this);
    delete this;
  }

  getText() {
    return this.#text;
  }

  //Used in verification and step function
  getOtherStateIfTrue(st){
    if(st == this.#start_st.parentObj){
      if(!this.#logic || evaluate(this.#logic, false)){
        return this.#end_st.parentObj;
      } else { return null; }
    } else if(st == this.#end_st.parentObj){
      return null;
    } else {
      console.log("Error in Transition.getOtherState. State supplied not in transition")
    }
  }

  //Used in verification and step function
  getOtherState(st){
    if(st == this.#start_st.parentObj){
      return this.#end_st.parentObj;
    } else if(st == this.#end_st.parentObj){
      return this.#start_st.parentObj;
    } else {
      console.log("Error in Transition.getOtherState. State supplied not in transition")
    }
  }

  getLogic(){
    return this.#logic;
  }

  //function used in state to check for duplicate transitions
  getStatesIds() {
    if (this.#end_st) { return [this.#start_st.id, this.#end_st.id]; }
    else { return [this.#start_st.id]; }
  }

  //function used in state to check for duplicate transitions
  getStartStateId() {
    return this.#start_st.id;
  }

  //Used to set end state once it has been connected in the UI
  setEndState(end_st) {
    this.#end_st = end_st;
    end_st.line = this;
    globals.stage.addChild(end_st, end_st.parentObj.getName()); //re-add end state so it draws over transition
  }

  setName(name) {
    this.#text.text = name;
  }

  setLogic(logic) {
    this.#logic = logic;
    this.#text.text = logic;
    globals.update = true;
  }

  //Used in import/export
  toJSON(){
    return {"startStId": this.#start_st.parentObj.getId(), "endStId": this.#end_st.parentObj.getId(), "logic": this.#logic};
  }
  load(json){
    this.setEndState(globals.getState(json.endStId).getCircle());
    if(json.logic) this.setLogic(json.logic);

    this.#end_st.parentObj.transitions.push(this);
    this.#start_st.parentObj.transitions.push(this);
    this.#start_st.parentObj.outTransitions.push(this);

    this.drawToStates();
  }
}
