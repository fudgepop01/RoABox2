import functions from "./functionHandler";

export const nodeTypes = (gameState) => {
  return {
    Undefined(){},
    Number(value, src){
      return value;
    },
    CString(value){
      return value;
    },
    EnumCtr(e, ctr){
      // TODO: ADD NEW CASE FOR ENUMS
    },
    ArrayDecl(values){
      const out = [];
      for (const value of values) {
        out.push(getData(value, gameState))
      }
      return out;
    },
    ObjectDecl(keys, values){
      const out = {};
      for (const [i, key] of keys.entries()) {
        out[key] = getData(values[i], gameState)
      }
      return out;
    },
    EnsureArray(expr){
      // TODO: FIGURE OUT WHAT THE HECK THIS IS
    },
    Ident(id){},
    Self(){
      return 'Self';
    },
    Other(){},
    GlobalRef(){},
    Script(ref){},
    Const(id){},
    ArgConst(id){},
    ArgIndex(id){},
    ArgCount(){},
    Call(x, args){},
    CallScript(name, args){},
    CallScriptAt(instance, script, args){},
    CallScriptId(index, args){},
    CallField(instance, prop, args){},
    CallFunc(name, args){
      const handlers = {
        default(){},
        ...functions(out)
      }

      return (handlers[name] || handlers['default'])(...args);
    },
    CallFuncAt(x, s, args){},
    Prefix(x, inc){},
    Postfix(x, inc){},
    UnOp(x, operation){
      return ({
        2(){}
      })[operation]();
    },
    BinOp(operation, a, b){
      return ({
        64(){return getData(a) === getData(b);},
        65(){return getData(a) !== getData(b)},
        66(){return getData(a) < getData(b)},
        67(){return getData(a) <= getData(b)},
        68(){return getData(a) > getData(b)},
        69(){return getData(a) >= getData(b)}, // nice

        80(){return getData(a) & getData(b)},
        96(){return getData(a) | getData(b)},
        16(){return getData(a) + getData(b)},
        17(){return getData(a) - getData(b)},
        0(){return getData(a) * getData(b)},
        1(){return getData(a) / getData(b)},
        2(){return getData(a) % getData(b)}
      })[operation]();
    },
    SetOp(o, a, b){

    },
    ToBool(v){},
    FromBool(v){},
    In(fd, val, not){},
    Local(varName){
      const currentScopeVal = gameState.scopes[gameState.scope.length - 1][varName];
      if (currentScopeVal) {
        return currentScopeVal;
      } else {
        for (let i = gameState.scope.length - 2; i >= 0; i--) {
          let prevScopeVal = gameState.scopes[i][varName];
          if (!prevScopeVal) continue;
          else return prevScopeVal;
        }
      }
      return 'WTF_LOCAL_NOT_FOUND';
    },
    LocalSet(varName, val){
      const currentScopeVal = gameState.scopes[gameState.scope.length - 1][varName];
      if (currentScopeVal) {
        currentScopeVal = getData(val);
      } else {
        for (let i = gameState.scope.length - 2; i >= 0; i--) {
          let prevScopeVal = gameState.scopes[i][varName];
          if (!prevScopeVal) continue;
          else prevScopeVal = getData(val); break;
        }
      }
    },
    LocalAop(varName, op, val){},
    Global(varName){
      return gameState.globals[varName];
    },
    GlobalSet(varName, val){
      gameState.globals[varName] = getData(val);
    },
    GlobalAop(varName, op, val){},
    Field(instance, fieldName){
      const instVal = getData(instance);
      if (instVal === 'self') {
        return gameState.instances.self.fields[fieldName]
      } else {
        return instVal[fieldName];
      }
    },
    FieldSet(instance, fieldName, val){
      const instVal = getData(instance);
      if (instVal === 'self') {
        gameState.instances.self.fields[fieldName] = val;
      } else {
        instVal[fieldName] = getData(val);
      }
    },
    FieldAop(x, fd, op, val){},
    Env(id){},
    EnvSet(id, val){},
    EnvAop(id, op, val){},
    EnvFd(x, fd){},
    EnvFdSet(x, fd, v){},
    EnvFdAop(x, fd, op, v){},
    Env1d(id, k){},
    Env1dSet(id, k, val){},
    Env1dAop(id, k, op, val){},
    Index(x, id){},
    IndexSet(x, id, v){},
    IndexAop(x, id, o, v){},
    IndexPrefix(x, i, inc){},
    IndexPostfix(x, i, inc){},
    Index2d(x, i1, i2){},
    Index2dSet(x, i1, i2, v){},
    Index2dAop(x, i1, i2, o, v){},
    Index2dPrefix(x, i, k, inc){},
    Index2dPostfix(x, i, k, inc){},
    RawId(x, id){},
    RawIdSet(x, id, v){},
    RawIdAop(x, id, o, v){},
    RawIdPrefix(x, i, inc){},
    RawIdPostfix(x, i, inc){},
    RawId2d(x, i1, i2){},
    RawId2dSet(x, i1, i2, v){},
    RawId2dAop(x, i1, i2, o, v){},
    RawId2dPrefix(x, i, k, inc){},
    RawId2dPostfix(x, i, k, inc){},
    DsList(lx, id){},
    DsListSet(lx, id, v){},
    DsListAop(lx, id, o, v){},
    DsListPrefix(x, i, inc){},
    DsListPostfix(x, i, inc){},
    DsMap(lx, id){},
    DsMapSet(lx, id, v){},
    DsMapAop(lx, id, o, v){},
    DsMapPrefix(x, i, inc){},
    DsMapPostfix(x, i, inc){},
    DsGrid(lx, i1, i2){},
    DsGridSet(lx, i1, i2, v){},
    DsGridAop(lx, i1, i2, o, v){},
    DsGridPrefix(x, i, k, inc){},
    DsGridPostfix(x, i, k, inc){},
    VarDecl(name, value){
      gameState.scopes[gameState.scopes.length - 1][name] = getData(value);
    },
    Block(nodes){
      for (const node of nodes) {
        gameState.scopes.push({});
        getData(node, gameState);
        gameState.scopes.pop();
      }
    },
    IfThen(cond, then, not){

    },
    Ternary(cond, then, not){},
    Switch(expr, list, def){},
    Wait(time){},
    Fork(){},
    While(cond, node){
      getData(node, gameState);
    },
    DoUntil(node, cond){
      getData(node, gameState);
    },
    DoWhile(node, cond){
      getData(node, gameState);
    },
    Repeat(times, node){
      getData(node, gameState);
    },
    For(pre, cond, post, loop){},
    With(ctx, node){
      getData(node, gameState);
    },
    Once(node){
      getData(node, gameState);
    },
    Return(v){},
    Exit(){},
    Break(){},
    Continue(){},
    Debugger(){},
    TryCatch(node, cap, cat){
      getData(node, gameState);
    },
    Throw(x){},
    CommentLine(s){},
    CommentLinePre(s, x){},
    CommentLinePost(x, s){},
    CommentLineSep(s, x){},
    CommentBlock(s){},
    CommentBlockPre(s, x, pl){},
    CommentBlockPost(x, s, pl){}
  }
}

const getData = ([kind, kindID, pos, ...args], gameState) => {
  if (!gameState) gameState = {
    attacks: {},
    variables: {}
  };

  let dataOut = (nodeTypes(gameState))[kind](...args);
  if (dataOut !== undefined) return dataOut;

  return gameState;
}

export default getData;