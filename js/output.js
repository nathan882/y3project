class Output {
  #name;
  #value;

  constructor(name){

    //Check for empty string
    if(name == "") {popAlert("Cannot create output without a name", "alert-danger"); return;}

    //Check for repeat name
    for(const i of [].concat(globals.inputs, globals.outputs)){if(name == i.getName()){popAlert("Cannot create 2 inputs or outputs with the same name", "alert-danger"); return;}}

    this.#name = name;

    globals.outputs.push(this);
  }

  delete(){
    globals.outputs = globals.outputs.filter(i => i != this);
    delete this;
  }

  setValue(value){
    this.#value = value;
  }
  getName(){
    return this.#name;
  }
  getValue(){
    if(this.#value) return this.#value;
    else return null;
  }

  toJSON(){
    return {"name": this.#name, "value": this.#value};
  }
  load(json){
    this.setValue(json.value);
  }

}
