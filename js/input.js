class Input {
  #name;
  #value;
  #size;

  constructor(name, size){

    //Check for empty string
    if(name == "") {popAlert("Cannot create input without a name", "alert-danger"); return;}
    if(size == "") {popAlert("Cannot create input without a size", "alert-danger"); return;}
    if(name.includes("_")) {popAlert("Cannot use underscores in input names", "alert-danger"); return;}

    //Check for repeat name
    for(const i of [].concat(globals.inputs, globals.outputs)){if(name == i.getName()){popAlert("Cannot create 2 inputs or outputs with the same name", "alert-danger"); return;}}

    //Check provided size in int
    if(!+size) {popAlert("Please use an integer for size", "alert-danger"); return;}

    this.#name = name;
    this.#size = size;
    this.#value = null;

    globals.inputs.push(this);
  }

  delete(){
    globals.inputs = globals.inputs.filter(i => i != this);
    delete this;
  }

  setValue(value){
    if(+value != 0 & !+value) popAlert("Value provided isn't an integer", "alert-warning");
    else if(value > 2 ** this.#size - 1) popAlert("Value provided is outside the range of this input", "alert-warning"); //negative numbers??
    else this.#value = value;
  }

  getName(){
    return this.#name;
  }
  getValue(){
    return this.#value;
  }
  getSize(){
    return this.#size;
  }
  getDisplay(){
    if(this.#size == 1) return this.#name;
    else return "[" + (this.#size-1) + ":0] " + this.#name;
  }

  //used for verification
  increment(){
    this.#value ++;
  }

  //used for verification
  atMaxVal(){
    if (this.#value == 2 ** this.#size - 1) return true;
    else return false;
  }

  //used for verification
  overMaxVal(){
    if (this.#value > 2 ** this.#size - 1) return true;
    else return false;
  }

  toJSON(){
    return {"name": this.#name, "value": this.#value, "size": this.#size};
  }
  load(json){
    this.setValue(json.value);
  }

}
