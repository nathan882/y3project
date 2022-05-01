function addState() {
  new_state = new State();
  globals.update = true;
}

function setStateName(){
  const val = document.getElementById("stateName").value;
  globals.elementUnderFocus.setName(val);
  document.getElementById("stName").innerHTML = val;
  globals.update = true;
}

function setResetState(){
	if (globals.resetState == globals.elementUnderFocus) {
    globals.resetState.toggleResetSt();
    globals.resetState = null;
  } else {
    if (globals.resetState) globals.resetState.toggleResetSt();
    globals.elementUnderFocus.toggleResetSt();
    globals.resetState = globals.elementUnderFocus;
  }
}

function deleteElement(){
	globals.elementUnderFocus.delete();
}

function addInput(){
  const name = document.getElementById("inName").value;
  const size = document.getElementById("inSize").value;
  new Input(name, size);

  displayInputs();
}

function displayInputs(){
  const table = document.getElementById("inTable");
  if(globals.inputs.length < 1) { table.innerHTML = ""; return; }
  table.innerHTML = "<tr><th><span class=\"unbold\">Name</span></th><th><span class=\"unbold\">Value</span></th></tr>"; //'scope = "col"' on th doesn't matter?
  for(const i of globals.inputs){
    let row = table.insertRow();

    //add input name
    let name = row.insertCell(0);
    name.innerHTML = i.getDisplay();

    //add input value
    let val = row.insertCell(1);
    let valIn = document.createElement("input");
    valIn.style = "width: 100%";
    valIn.addEventListener("change", function(){
      i.setValue(this.value);
      this.value = i.getValue();
    });
    valIn.value = i.getValue();
    val.appendChild(valIn);

    //add button to delete input
    let del = row.insertCell(2);
    let delBtn = document.createElement("button");
    delBtn.className = "btn-close";
    delBtn.addEventListener("click", function(){
      i.delete();
      displayInputs();
    });
    del.appendChild(delBtn);
  }
}

//function to 'step' through states
function steps(){
  let nextSt;

  //if not started, set up, exit
  if(!globals.currentSt){
    if(!globals.resetState){ popAlert("Reset state not set", "alert-warning"); return }
    globals.currentSt = globals.resetState;
    globals.currentSt.setFillColor("#FFFF2375");
    globals.currentSt.setOutputs();
    return
  }

  //else determine next state from current state
  else {
    //check if a transition can be taken given the current inputs
    for (t of globals.currentSt.transitions){
      nextSt = t.getOtherStateIfTrue(globals.currentSt);
      if(nextSt){break;}
    }
  }

  //if exist, current state <- next state
  if(nextSt){
    globals.currentSt.setFillColor("white");
    globals.currentSt = nextSt;
    globals.currentSt.setFillColor("#FFFF2375");
    globals.currentSt.setOutputs();
  }

  //if not exist, declare end
  else {
    popAlert("No more valid transitions", "alert-warning");
  }
}

//returns to reset state in 'step' functionality
function reset(){
  if(globals.currentSt){ globals.currentSt.setFillColor("white"); }
  globals.currentSt = null;
  steps(); //start 'stepping' through states
}

//evalues logic statement
function checkLogic(){
  const input = document.getElementById("logicIn").value;
  if (evaluate(input, true) != null) {
    globals.elementUnderFocus.setLogic(input);
  }
}

function addOutput(){
  const name = document.getElementById("outName").value;
  new Output(name);

  displayOutputs();
}

function displayOutputs(){
  const table = document.getElementById("outTable");
  if(globals.outputs.length < 1) { table.innerHTML = ""; return; }
  table.innerHTML = "<tr><th><span class=\"unbold\">Name</span></th><th><span class=\"unbold\">Value</span></th></tr>";
  for(const i of globals.outputs){
    let row = table.insertRow();

    //add input name
    let name = row.insertCell(0);
    name.innerHTML = i.getName();

    //add input value
    let val = row.insertCell(1);
    val.innerHTML = i.getValue();

    //add button to delete output
    let del = row.insertCell(2);
    let delBtn = document.createElement("button");
    delBtn.className = "btn-close";
    delBtn.addEventListener("click", function(){
      i.delete();
      displayOutputs();
    });
    del.appendChild(delBtn);
  }
}

function addOutputRule(){
  globals.elementUnderFocus.addOutputRule();
}

//draws background grid on canvas
function drawGrid(){
  const gw = globals.canvas.width;
  const gh = globals.canvas.height;
  let line = new createjs.Shape();
  line.graphics.setStrokeStyle(1).setStrokeDash([5,1]).beginStroke("grey");
  line.compositeOperation = "destination-over"; //so that grid draws behind other elements

  for (let x=50; x<=gw; x+=50){
    line.graphics.moveTo(0.5 + x , 0);
    line.graphics.lineTo(0.5 + x , gh);
  }
  for (let x=50; x<=gh; x+=50){
    line.graphics.moveTo(0, 0.5 + x);
    line.graphics.lineTo(gw, 0.5 + x);
  }

  line.graphics.endStroke();
  globals.stage.addChild(line);
}

//bootstrap alerts
function popAlert(message, type){
  let alert = document.createElement("div");
  alert.className = "alert alert-dismissible " + type;
  alert.setAttribute("role", "alert");
  alert.innerHTML = message;

  let close = document.createElement("button");
  close.className = "btn-close";
  close.type = "button";
  close.setAttribute("data-bs-dismiss", "alert");
  alert.appendChild(close);

  const div = document.getElementById("alerts");
  div.appendChild(alert);
}

//used in verilog conversion
function outputMaxVals() {
  //set-up map
  const outs = new Map();
  for(o of globals.outputs){ outs.set(o.getName(), 0); }

  //get max values
  for(s of globals.states){
    for(r of s.getOutputRules()){
      outs.set(r[0], Math.max(outs.get(r[0]), r[1]));
    }
  }

  return outs;
}

function exportGraph() {
  //create json representation
  const out = globals.stringify();

  //create file
  let output = new Blob([out], { type: "text/plain;charset=utf-8" });
  saveAs(output, "export.txt");
}

function importGraph(){
  let input = document.createElement('input');
  input.type = 'file';

  input.onchange = function(){

     let file = input.files[0];

     let fr = new FileReader();
     fr.readAsText(file);

     fr.onload = function(event) {
        let content = event.target.result;
        try { globals.load(content); }
        catch (error) { popAlert("Import error. Errors may exist in the current graph", "alert-danger"); }
        displayInputs();
        displayOutputs();
     }

  }

  input.click();
}

function tutorialmodal(){
  let modal = new bootstrap.Modal(document.getElementById("tutorialModal"));
  modal.show();
}

function tutorialStep(dir, i){
  let id = "tutorialModal"; let next;
  if(dir == "+") next = i+1;
  else next = i-1;

  document.getElementById(id + i).style.display = "none";
  document.getElementById(id + next).style.display = "block";

}

//imports example at end of tutorial
function tutorialExample(){
  let content = document.getElementById("exampleJSON").textContent;
  globals.load(content);
  displayInputs();
  displayOutputs();
  let el = document.getElementById("tutorialModal");
  let modal = bootstrap.Modal.getInstance(el)
  modal.hide();
}
