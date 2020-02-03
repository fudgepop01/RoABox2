
// TODO: come back to this maybe...

let _monaco = null;
let _mainEditor = null;
let _inputEditor = null;
export default {
  get monaco() {return _monaco},
  set monaco(m) {_monaco = m;},
  get mainEditor() {return _mainEditor},
  set mainEditor(e) {_mainEditor = e},
  get inputEditor() {return _inputEditor},
  set inputEditor(e) {_inputEditor = e}
}