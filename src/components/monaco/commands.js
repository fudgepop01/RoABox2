import monaco from "./monaco"

/**
 * @param {monaco.editor.IStandaloneCodeEditor} editor
 */
export const addSaveFunction = (editor, dispatch) => {
  editor.addAction({
    id: 'save-file',
    label: 'save file',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
    keybindingContext: null,
    run() { dispatch('saveFile') }
  })
}

/**
 * @param {monaco.editor.IStandaloneCodeEditor} editor
 */
export const addComputeGML = (editor, dispatch) => {
  editor.addAction({
    id: 'get-gml-ast',
    label: 'get gml AST (console)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    keybindingContext: null,
    run() { dispatch('genAST'); }
  })
}

/**
 * @param {monaco.editor.IStandaloneCodeEditor} editor
 */
export const addUpdateParams = (editor, dispatch) => {
  editor.addAction({
    id: 'update-params',
    label: 'update parameters',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    keybindingContext: null,
    run() { dispatch('updateParams'); }
  })
}

export const setupMain = (editor, dispatch) =>{
  addSaveFunction(editor, dispatch);
  addComputeGML(editor, dispatch);
}

export const setupParams = (editor, dispatch) =>{
  addUpdateParams(editor, dispatch);
}