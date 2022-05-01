function evaluate(st, alertErrors){
  const source = String.raw`
    Logic {
      Exp
        = LogicExp

      LogicExp
        = LogicExp "&&" LogicExp --and
        | LogicExp "||" LogicExp --or
        | "!" LogicExp --not
        | "(" Exp ")" --paren
        | CompExp
        | input

      CompExp
        =  Term "==" Term --equals
        | Term ">" Term --gt
        | Term "<" Term --lt
        | Term ">=" Term --gte
        | Term "<=" Term --lte

      Term
        = hex
        | bin
        | input
        | num

      hex = "0x" alnum+
      num = digit+
      input = letter alnum*
      bin = "0b" ("0" | "1")*

    }
  `;

  const g = ohm.grammar(source);

  if(g.match(st).failed()){
    if(alertErrors) popAlert("Match failed", "alert-danger");
    return;
  }

  const s = g.createSemantics();

  s.addOperation('eval', {
    Exp(e) {
      const temp = e.eval();
      if(nullCheck) { return; }
      else { return temp; }
    },

    LogicExp_and(a, _, b) {
      if(a.eval() == null || b.eval == null){ return; }
      else if(a.eval() > 0 & b.eval() > 0){ return true; } //don't know why '> 0'; need & not && otherwise {b not defined} is allowed
      else { return false; }
    },
    LogicExp_or(a, _, b) {
      if(a.eval() == null || b.eval == null){ return; }
      else if(a.eval() > 0 || b.eval() > 0){ return true; } //don't know why '> 0'
      else { return false; }
    },
    LogicExp_not(_, e) { return !e.eval(); },
    LogicExp_paren(_l, e, _r) { return e.eval(); },

    CompExp_equals(a, _, b) { return a.eval() == b.eval(); },
    CompExp_gt(a, _, b) { return a.eval() > b.eval(); },
    CompExp_lt(a, _, b) { return a.eval() < b.eval(); },
    CompExp_gte(a, _, b) { return a.eval() >= b.eval(); },
    CompExp_lte(a, _, b) { return a.eval() <= b.eval(); },

    num(_) { return parseInt(this.sourceString); }, //doesn't work for utf-8? (jp arabic numbers)
    hex(_l, _ns) { return parseInt(this.sourceString.substring(2), 16); },
    bin(_l, _ns) { return parseInt(this.sourceString.substring(2), 2); },

    input(_l, _ns) {
      for (i of globals.inputs) {
        if (i.getName() == this.sourceString){
          return parseInt(i.getValue());
        }
      }
      if(alertErrors) popAlert("Input '" + this.sourceString + "' not found", "alert-danger");
      nullCheck = true;
      return;
    }

  });

  let nullCheck = false; //used to check if inputs exist
  const result = s(g.match(st)).eval();

  return result;
}
