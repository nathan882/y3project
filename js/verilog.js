/*Verify design and display modal if correct*/
function verilogCheck(){
  //verify
  if(!verify()){ popAlert("The FSM has errors so a verilog module cannot be produced", "alert-danger"); return; }

  //check if reset set
  if(!globals.resetState)
    document.getElementById("resetType").className = "modal-body disabled";
  else
    document.getElementById("resetType").className = "modal-body";

  //display modal
  let temp = new bootstrap.Modal(document.getElementById("verilogModal"));
  temp.show();
}

/*Convert design to verilog code, then create file*/
function verilog(){

  /*get reset type*/
  let rType;
  if(globals.resetState)
    for(const r of document.getElementsByName("resetRadio"))
      if(r.checked == true){ rType = r.id; break; }

  let tnum = 1; //number of tabs

  /*create object*/
  let outStr = "";
  const busWidth = Math.ceil(Math.log(globals.states.length) / Math.log(2))-1;

  //use diagram state ids as names for verilog state numbers
  //fixes issues when user deletes a state (so a state id would be 'missing' from verilog)
  for(i=0; i < globals.states.length; i++){
    outStr += "`define " + globals.states[i].getNameOrId() + " " + i + "\n"
  }
  outStr += "\n"

  /*module header*/
  outStr += "module FSM (\n";

  /*connections*/
  outStr += "\tinput wire clk,\n";
  if(rType) outStr += "\tinput wire reset,\n";
  for(i of globals.inputs){
    outStr += "\tinput wire " + i.getDisplay() + ",\n";
  }
  for(i of outputMaxVals().entries()){
    outStr += "\toutput reg [" + Math.ceil(Math.log(i[1]) / Math.log(2)) + ":0] " + i[0] + ",\n";
  }
  if(busWidth == 0 || busWidth == -1){ outStr += "\toutput reg state\n);\n\n"; }
  else { outStr += "\toutput reg [" + busWidth + ":0] state\n);\n\n"; }

  /*state always block*/
  if(rType == "async") outStr += "always@(posedge clk, posedge reset)\n";
  else outStr += "always@(posedge clk)\n"

  if(rType){
    outStr += "\tif(reset)\n\t\tstate <= " + globals.resetState.getNameOrId() + ";\n\telse\n";
    tnum ++;
  }

  outStr += "\t".repeat(tnum) + "case(state)\n";
  tnum++;
  for(s of globals.states){
    let ts = s.outTransitions;
    if(ts.length == 1){
      outStr += "\t".repeat(tnum) + s.getNameOrId() + ": state <= " + ts[0].getOtherState(s).getNameOrId() + ";\n";
    } else {
      let i = 1;
      outStr += "\t".repeat(tnum) + s.getNameOrId() + ":\n"; tnum++;
      outStr += "\t".repeat(tnum) + "if(" + ts[0].getLogic() + ") state <= " + ts[0].getOtherState(s).getNameOrId() + ";\n";
      for(i; i < ts.length-1; i++){
        outStr += "\t".repeat(tnum) + "else if(" + ts[i].getLogic() + ") state <= " + ts[i].getOtherState(s).getNameOrId() + ";\n";
      }
      outStr += "\t".repeat(tnum) + "else state <= " + ts[i].getOtherState(s).getNameOrId() + ";\n"; tnum --;
    }
  }
  outStr += "\t".repeat(tnum) + "default: state <= 'hx; //for testing\n"; tnum --;
  outStr += "\t".repeat(tnum) + "endcase\n\n";

  /*output always block*/
  if(globals.outputs.length > 0){
    outStr += "always@(state)\n\tcase(state)\n";
    for(s of globals.states){
      let rules = s.getOutputRules();
      if(rules.length > 0){
        if(rules.length == 1) {
          outStr += "\t\t" + s.getNameOrId() + ": " + rules[0][0] + " = " + rules[0][1] + ";\n";
        } else {
          outStr += "\t\t" + s.getNameOrId() + ":\n";
          for(r of rules){
            outStr += "\t\t\t" + r[0] + " = " + r[1] + ";\n";
          }
        }
      }
    }
    outStr += "\tendcase\n\n";
  }

  /*endmodule*/
  outStr += "endmodule";

  /*create file*/
  let output = new Blob([outStr], { type: "text/plain;charset=utf-8" });
  saveAs(output, "fsm.txt");

}
