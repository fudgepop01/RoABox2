import { fileSystem } from '../../store/fileSystem';
import editors from '../../store/editors.js';
import getData from './instructions';

const extractData = (compiled) => {
  const scripts = compiled.scripts;

  const out = {
    attacks: {},
    variables: {}
  };
  for (const script of scripts) {
    getData(script.node, out);
  }
  return out;
}

export default async () => {
  const gmlive = window['gmlive'];
  const scripts = await fileSystem.getAllScripts();

  let sources = [];
  for (let script of scripts) {
    sources.push(new gmlive.source(`_${script.name}`, script.data));
  }
  const compiled = gmlive.compile(sources);
  const data = extractData(compiled);

  console.log(compiled);
  console.log(data);

  // editors.paramEditor.setValue
}

/*
 init
 load
 bair
 dair
 dattack
 dspecial
 dstrong
 dtilt
 fair
 fspecial
 fstrong
 ftilt
 jab
 nair
 nspecial
 taunt
 uair
 uspecial
 ustrong
 utilt
 update
 animation
 pre_draw
 post_draw
*/