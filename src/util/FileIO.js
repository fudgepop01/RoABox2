import editors from '../store/editors';

export const openFiles = {};

export const saveFile = (evt) => {
  let { mainEditor } = editors;
  openFiles.__current__.data = mainEditor.getValue();
  openFiles.__current__.dirty = false;
  delete openFiles[openFiles.__current__.name];
}

export const handleFileOpen = (evt) => {
  const file = evt.detail;
  let { mainEditor, monaco } = editors;

  if (file.type === 'file' && ['gml', 'ini'].includes(file.extension)) {
    if (openFiles.__current__ === file) return;
    if (openFiles.__current__ && mainEditor.getValue() !== openFiles.__current__.data) {
      openFiles[openFiles.__current__.name] = mainEditor.getValue();
      openFiles.__current__.dirty = true;
    }

    openFiles.__current__ = file;
    if (openFiles[openFiles.__current__.name]) mainEditor.setValue(openFiles[openFiles.__current__.name]);
    else mainEditor.setValue(file.data);

    switch (file.extension) {
      case 'gml': monaco.editor.setModelLanguage(mainEditor.getModel(), 'gamemaker'); break;
      case 'ini': monaco.editor.setModelLanguage(mainEditor.getModel(), 'ini'); break;
    }
  }
}