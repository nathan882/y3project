function verify(){

  let errors = [];

  //store current values of inputs (get destroyed in test 3)
  let ins = globals.inputs;
  let insStore = [];
  for (i of ins) insStore.push(i.getValue());

  //1: check for no states
  if (globals.states.length < 1) errors.push("No states");

  //2: check for inaccessible states
  for (s of globals.states) {
    if (s != globals.resetState && s.transitions.sort().toString() == s.outTransitions.sort().toString())
      errors.push(s.getDisplayId() + " is inaccessible");
  }

  //3: check that transitions are valid for each state
  for (s of globals.states){

    //get list of logic statements from transitions
    let logs = [];
    for (t of s.outTransitions){ logs.push(t.getLogic()); }
    if (logs.length == 0){ errors.push("No transition out of " + s.getDisplayId()); continue; }

    //get list of inputs used in a logic statements
    if (ins.length == 0 && logs.length != 1){ errors.push(logs.length + " transitions out of " + s.getDisplayId()); continue; }
    else if (ins.length == 0) {continue;}

    //set all input values to 0
    for (i of ins) i.setValue(0);

    //for every possible input combination, check which statements are true/false
    let pos = 0;

    let checkInputs = function() {
      //if not at end of inputs list...
      if (pos < ins.length-1) {
        // ... reset value ...
        ins[pos].setValue(0);
        // ... increment position ...
        pos++;
        // ... call function again
        checkInputs();
        while(!ins[pos].atMaxVal()){
          ins[pos].increment();
          pos++;
          checkInputs();
        }
        pos--;
      // if at end of inputs list
      } else {
        ins[pos].setValue(0);

        while (!ins[pos].overMaxVal()) {
          let count = 0;

          //check each statement for this set of inputs, increment counter if true
          for (l of logs) {
            if(l == null) count++;
            else if(evaluate(l, false)) count++;
          }

          //report results
          if(count == 0) errors.push("No transition taken at " + s.getDisplayId() + " for inputs: " + globals.displayInputs());
          else if(count > 1) errors.push(count + " transitions taken at " + s.getDisplayId() + " for inputs: " + globals.displayInputs());

          ins[pos].increment();
        }
        pos--;
      }
    }
    checkInputs();

  }

  //4: check that outputs exist for output rules of all states
  for (s of globals.states) {
    for (r of s.getOutputRules()){
      found = false;
      for(out of globals.outputs){
        if(out.getName() == r[0]){ found = true; break; }
      }
      if (!found) errors.push("Output '" + r[0] + "' not found");
    }
  }

  //5: check that inputs exist for all transition logic statements
  for (t of globals.transitions) {
    if (t.getLogic())
      if (evaluate(t.getLogic(), false) == null)
        errors.push("Input missing in: " + t.getLogic());
  }

  //report result
  if (errors.length > 0) {
    errorsOut = "Verification Failed:<br>";
    for(e of errors){ errorsOut += "- " + e + "<br>"; }
    popAlert(errorsOut, "alert-danger");
  }
  else popAlert("Design correct", "alert-success");

  //restore original input values
  for (i of ins.reverse()) i.setValue(insStore.pop());
  ins.reverse(); //reverse modifies in place, so redo to undo

  return errors.length < 1; //true if design correct (ie. no errors), false if not
}
