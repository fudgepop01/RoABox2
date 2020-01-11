import functions from "./functionHandler";

export const nodeTypes = (out) => {
  return {
    Undefined(){},
    Number(value, src){
      return value;
    },
    CString(value){
      return value;
    },
    EnumCtr(e, ctr){},
    ArrayDecl(values){},
    ObjectDecl(keys, values){},
    EnsureArray(expr){},
    Ident(id){},
    Self(){},
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
    UnOp(x, o){},
    BinOp(o, a, b){},
    SetOp(o, a, b){},
    ToBool(v){},
    FromBool(v){},
    In(fd, val, not){},
    Local(id){},
    LocalSet(id, val){},
    LocalAop(id, op, val){},
    Global(id){},
    GlobalSet(id, val){},
    GlobalAop(id, op, val){},
    Field(instance, fd){
      return fd;
    },
    FieldSet(instance, fd, val){
      if (instance[0] === 'Self') out.variables[fd] = getData(val);
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
      // out.push([name, value]);
    },
    Block(nodes){
      for (const node of nodes) {
        getData(node, out);
      }
    },
    IfThen(cond, then, not){},
    Ternary(cond, then, not){},
    Switch(expr, list, def){},
    Wait(time){},
    Fork(){},
    While(cond, node){
      getData(node, out);
    },
    DoUntil(node, cond){
      getData(node, out);
    },
    DoWhile(node, cond){
      getData(node, out);
    },
    Repeat(times, node){
      getData(node, out);
    },
    For(pre, cond, post, loop){},
    With(ctx, node){
      getData(node, out);
    },
    Once(node){
      getData(node, out);
    },
    Return(v){},
    Exit(){},
    Break(){},
    Continue(){},
    Debugger(){},
    TryCatch(node, cap, cat){
      getData(node, out);
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

const getData = ([kind, kindID, pos, ...args], out) => {
  if (!out) out = {
    attacks: {},
    variables: {}
  };

  let dataOut = (nodeTypes(out))[kind](...args);
  if (dataOut !== undefined) return dataOut;

  return out;
}

export default getData;