
// TODO: come back to this maybe...

let _monaco = null;
let _mainEditor = null;
let _paramEditor = null;
export default {
  get monaco() {return _monaco},
  set monaco(m) {_monaco = m;},
  get mainEditor() {return _mainEditor},
  set mainEditor(e) {_mainEditor = e},
  get paramEditor() {return _paramEditor},
  set paramEditor(e) {_paramEditor = e}
}