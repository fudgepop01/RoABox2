import { fileSystem } from '../../store/fileSystem';
import gameStateBase from './gameStateBase';
import editors from '../../store/editors.js';
import getData from './instructions';

const initialize = (compiled) => {
  const scripts = compiled.scriptMap;
  const initOrder = [
    'init',
    'load',
    'bair',
    'dair',
    'dattack',
    'dspecial',
    'dstrong',
    'dtilt',
    'fair',
    'fspecial',
    'fstrong',
    'ftilt',
    'jab',
    'nair',
    'nspecial',
    'taunt',
    'uair',
    'uspecial',
    'ustrong',
    'utilt'
  ];

  const out = gameStateBase;
  for (const scriptName of initOrder) {
    if (scripts['_' + scriptName]) getData(scripts['_' + scriptName].node, out, scriptName);
  }

  return out;
}

const nextState = (compiled, gameState) => {
  const scriptOrder = [
    'update',
    'animation',
    'pre_draw',
    'post_draw'
  ];


}

export default async () => {
  const gmlive = window['gmlive'];
  const scripts = await fileSystem.getAllScripts();

  let sources = [];
  for (let script of scripts) {
    sources.push(new gmlive.source(`_${script.name}`, script.data));
  }
  const compiled = gmlive.compile(sources);
  const gameState = initialize(compiled);

  console.log(compiled);
  console.log(gameState);

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