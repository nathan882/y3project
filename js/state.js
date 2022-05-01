class State {
  #circle;
  #stroke_width;
  #stroke_colour;
  #name;
  #id;

  transitions; //transitions in and out of this state
  outTransitions; //only transitions out of this state

  #reset_st;
  #reset_mark;
  #reset_mark_mid;

  #output_rules; //rules that set an output's value when this state is moved into

  constructor() {

    //Create and initialise circle object
    this.#circle = new createjs.Shape();
    this.#circle = Object.assign(this.#circle, {
      x: 100,
      y: 100,
      radius: 50,
      cursor: "pointer",
      parentObj: this //pass reference to 'State' object so it can be accessed in event functions further down
    });
    this.#circle.graphics.beginStroke("black").setStrokeStyle(2).beginFill("white").drawCircle(0, 0, this.#circle.radius);

    //Create and initialise text object that shows state name
    this.#name = new createjs.Text("", "20px Arial", "#000000");
    this.#name = Object.assign(this.#name, {
      x: this.#circle.x,
      y: this.#circle.y,
      maxWidth: this.#circle.radius * 2,
      textAlign: "center",
      textBaseline: "middle"
    });

    this.#id = globals.getNewId();

    //Create objects for marking as reset state
    this.#reset_mark = new createjs.Shape();
    this.#reset_mark_mid = new createjs.Shape();
    this.#reset_mark_mid.graphics.beginFill("black").drawPolyStar(0, 0, 10, 3, 0, 0);
    this.#reset_mark_mid.visible = false;

    //Array to store references to transitions objects that this object is connected to
    this.transitions = [];
    this.outTransitions = [];

    //Array to store how outputs should change when in this state
    this.#output_rules = [];

    //Handles moving the circle in the canvas
    this.#circle.on("mousedown", function (evt) {
      //this.parent.addChild(this, this.parentObj.getName()); //this was in example??
      this.offset = {x: this.x - evt.stageX, y: this.y - evt.stageY};
    });
    this.#circle.on("pressmove", function (evt) {
      this.x = this.parentObj.getName().x = evt.stageX + this.offset.x;
      this.y = this.parentObj.getName().y = evt.stageY + this.offset.y;

      //Redraw transitions
      for(const i of this.parentObj.transitions) i.drawToStates();
      if(this.parentObj.#reset_st) this.parentObj.#drawResetMark();

      globals.update = true;
    });

    //Handles clicking to 'focus' object
    this.#circle.on("click", function (evt) {
      document.getElementById("stateName").value = document.getElementById("stName").innerHTML = this.parentObj.getName().text;
      document.getElementById("stId").innerHTML = this.parentObj.getDisplayId();
      this.parentObj.displayOutputRules();
      globals.elementUnderFocus = this.parentObj;

      document.getElementById("trOps").className="collapse list-unstyled disabled";
      document.getElementById("stOps").className="list-unstyled";
    });

    //Handles creating/connecting transition to/from state
    this.#circle.on("dblclick", function(evt){

      if(globals.programState == "waiting"){
        let newTransition = new Transition(this);
        globals.transitionUnderFocus = globals.elementUnderFocus = newTransition;
        globals.programState = "cursor";

        this.parentObj.transitions.push(newTransition);
        this.parentObj.outTransitions.push(newTransition);

        globals.canvas.addEventListener("mousemove", globals.mouseMoveHandler = function(e) {
          newTransition.drawToCursor(e);
        });
      } else {
        // check if transition already exists
        let duplicate = false;
        const ids = [globals.transitionUnderFocus.getStartStateId(), this.id];
        for (const t of this.parentObj.transitions) {
          if (ids.toString() == t.getStatesIds().toString()) {
            popAlert("Can't create two identical transitions", "alert-danger"); //can't just return here, causes errors
            duplicate = true; break;
          }
        }

        if(!duplicate) {
          globals.transitionUnderFocus.setEndState(this);
          globals.programState = "waiting";
          globals.canvas.removeEventListener("mousemove", globals.mouseMoveHandler);
          this.parentObj.transitions.push(globals.transitionUnderFocus);
          globals.transitionUnderFocus.drawToStates();
        }
      }

    });

    globals.states.push(this);
    globals.stage.addChild(this.#circle, this.#reset_mark, this.#reset_mark_mid, this.#name); //add name last so displays over other elements
  }

  #drawResetMark(){

    if(this.#reset_st){

      //draw line
      this.#reset_mark.graphics.clear();
      this.#reset_mark.graphics.setStrokeStyle(2).beginStroke("black");
      this.#reset_mark.graphics.moveTo(this.#circle.x-this.#circle.radius-50, this.#circle.y);
      this.#reset_mark.graphics.lineTo(this.#circle.x-this.#circle.radius, this.#circle.y);
      this.#reset_mark.graphics.endStroke();

      //draw triangle
      this.#reset_mark_mid.visible = true;
      this.#reset_mark_mid.x = this.#circle.x-this.#circle.radius-25;
      this.#reset_mark_mid.y = this.#circle.y;

    } else {

      //hide objects
      this.#reset_mark_mid.visible = false;
      this.#reset_mark.graphics.clear();

    }

    globals.update = true;
  }

  delete() {
    //avoids bug when pressing delete while drawing to cursor
    if(globals.programState == "cursor") globals.programState = "waiting";

    for(const i of this.transitions) i.delete();

    if(this.#reset_st) globals.resetState = null;

    globals.stage.removeChild(this.#circle, this.#name, this.#reset_mark, this.#reset_mark_mid);
    globals.update = true;

    globals.states = globals.states.filter(i => i != this);
    delete this;
  }

  deleteTransition(trans){
    this.transitions = this.transitions.filter(item => item !== trans);
    this.outTransitions = this.outTransitions.filter(item => item !== trans);
  }

  toggleResetSt(){
    this.#reset_st = !this.#reset_st;
    this.#drawResetMark();
  }

  setName(name) {
    this.#name.text = name;
  }

  setFillColor(color){
    this.#circle.graphics.beginStroke("black").setStrokeStyle(2).beginFill(color).drawCircle(0, 0, this.#circle.radius);
    globals.update = true;
  }

  getName() {
    return this.#name;
  }

  getId(){
    return this.#id;
  }

  getDisplayId(){
    return "st_" + this.#id;
  }

  getNameOrId(){
    if (this.#name.text) return "st_" + this.#name.text
    return "STATE" + this.#id
  }

  getCircle(){
    return this.#circle;
  }

  getOutputRules() {
    return this.#output_rules;
  }

  addOutputRule() {
    this.#output_rules.push(["", ""]); //name, value
    this.displayOutputRules();
  }

  deleteOutputRule(rule) {
    this.#output_rules = this.#output_rules.filter(i => i != rule);
  }

  displayOutputRules() {
    const table = document.getElementById("ruleTable");
    const state = this;

    if(this.#output_rules.length > 0){ table.innerHTML = '<thead><tr><th scope="col">Name</th><th scope="col">Value</th></tr></thead>'; }
    else { table.innerHTML = ""; }

    for(const i of this.#output_rules){
      let row = table.insertRow();

      //add output name
      let name = row.insertCell(0);
      let nameIn = document.createElement("input");
      nameIn.style = "width: 100%";
      nameIn.value = i[0];
      nameIn.addEventListener("change", function(){
        let found = false;
        for(const out of globals.outputs){ if(out.getName() == this.value){ found=true;break; } }
        if(!found) { popAlert("Output not found", "alert-danger"); this.value = i[0]; }
        else { i[0] = this.value; }
      });
      name.appendChild(nameIn);

      //add output value
      let val = row.insertCell(1);
      let valIn = document.createElement("input");
      valIn.style = "width: 100%";
      valIn.value = i[1];
      valIn.addEventListener("change", function(){
        i[1] = this.value;
      });
      val.appendChild(valIn);

      //add button to delete input
      let del = row.insertCell(2);
      let delBtn = document.createElement("button");
      delBtn.className = "btn-close";
      delBtn.addEventListener("click", function(){
        state.deleteOutputRule(i);
        state.displayOutputRules();
      });
      del.appendChild(delBtn);
    }
  }

  setOutputs() {
    for (const i of this.#output_rules) {
      let found = false;
      let temp = "";
      for(const out of globals.outputs){
        if(out.getName() == i[0]){
          found = true;
          temp = out;
          break;
        }
      }
      if(!found) popAlert("Output '" + i[0] + "' not found", "alert-danger");
      else temp.setValue(i[1]);
    }
    displayOutputs();
  }

  toJSON(){
    return {"id": this.#id, "x": this.#circle.x, "y": this.#circle.y, "name": this.#name.text, "reset_st": this.#reset_st, "output_rules": this.#output_rules}
  }
  load(json){
    this.#id = json.id;
    this.#circle.x = json.x; this.#circle.y = json.y;
    this.#name.x = json.x; this.#name.y = json.y;
    this.#name.text = json.name;
    this.#reset_st = json.reset_st; this.#drawResetMark();
    this.#output_rules = json.output_rules;

    if(this.#reset_st) globals.resetState = this;
  }
}
