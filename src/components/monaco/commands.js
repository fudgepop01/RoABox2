import monaco from "./monaco"

/**
 *
 * @param {monaco.editor.IStandaloneCodeEditor} editor
 */
export const addSaveFunction = (editor, dispatch) => {
  editor.addAction({
    id: 'save-file',
    label: 'save file',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
    keybindingContext: null,
    run() {
      dispatch('saveFile')
    }
  })
}

export const setupAll = (editor, dispatch) =>{
  addSaveFunction(editor, dispatch);
}