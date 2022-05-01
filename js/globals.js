/*Object to store global variables*/
class Globals {
  canvas;
  stage;
  programState;
  elementUnderFocus;
  transitionUnderFocus;
  update;
  mouseMoveHandler; //can maybe use removeAllEventListeners instead of this
  resetState;
  inputs;
  outputs;
  currentSt;
  nextStId;
  states;
  transitions;

  constructor(){
    this.programState = "waiting";
    this.update = true;
    this.states = [];
    this.inputs = [];
    this.outputs = [];
    this.transitions = [];
    this.nextStId = 0;

    this.canvas = document.getElementById("fsmCanvas");
  	this.stage = new createjs.Stage(this.canvas);
  }

  //used in verification
  displayInputs(){
    let out = "[";
    for (let i of this.inputs){
      out += i.getName() + ":" + i.getValue() + ", ";
    }
    return out.substring(0, out.length-2) + "]";
  }

  getNewId(){
    return this.nextStId++;
  }

  getState(id){
    for(const s of this.states) if(s.getId() == id) return s;
  }

  // need to store on export: states (+ their transitions), inputs, outputs, nextStId
  stringify(){
    return JSON.stringify({'outputs': this.outputs, 'inputs': this.inputs, "states": this.states, "transitions": this.transitions, "nextStId": this.nextStId});
  }
  load(json){
    json = JSON.parse(json);

    //remove current objects
    for(const i of this.inputs) i.delete();
    for(const i of this.outputs) i.delete();
    for(const i of this.states) i.delete();
    for(const i of this.transitions) i.delete();

    //load outputs
    for(const o of json.outputs){
      let out = new Output(o.name);
      out.load(o);
    }

    //load inputs
    for(const i of json.inputs){
      let input = new Input(i.name, i.size);
      input.load(i);
    }

    //load states
    for(const s of json.states){
      let st = new State();
      st.load(s);
    }

    this.nextStId = json.nextStId; //load after states since nextStId increment when create state

    //load transitions (load after states so start state can be set in constructor)
    for(const t of json.transitions){
      let tr = new Transition(globals.getState(t.startStId).getCircle());
      tr.load(t);
    }
  }
}
