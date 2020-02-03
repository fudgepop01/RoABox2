import { fileSystem } from '../../store/fileSystem';
import { currentFrame } from '../../store/windows';
import getNewBase from './gameStateBase';
import GS, { timeline as TL, setCompiled, setDebugFile } from '../../store/gameState.js';
import getData from './instructions';
import { animationNames } from './constantLookup';
import { openFiles } from '../FileIO';

const linkSprites = (sprites, gameState) => {
  for (const sprite of sprites) {
    const matchData = sprite.name.match(/(?<name>.+)_strip(?<frameCount>\d+)/);

    if (!matchData) {
      gameState.resources[sprite.name] = {
        frameCount: 1,
        data: sprite.data
      }
    } else {
      gameState.resources[matchData.groups.name] = {
        frameCount: parseInt(matchData.groups.frameCount),
        data: sprite.data
      }

      if (animationNames.includes(matchData.groups.name)) {
        gameState.instances.self.animLinks[matchData.groups.name] = gameState.resources[matchData.groups.name];
      }
    }
  }
}

const initialize = (compiled, gameState) => {
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

  for (const scriptName of initOrder) {
    if (scripts['_' + scriptName]) getData(scripts['_' + scriptName].node, gameState, scriptName);
  }
}

export default async () => {
  const gmlive = window['gmlive'];
  const scripts = await fileSystem.getAllScripts();
  const sprites = await fileSystem.getAllSprites();

  let sources = [];
  for (let script of scripts) {
    if (script.path.includes('debug/')) {
      if (script.name !== openFiles.__currentInput__.name) continue;
      else setDebugFile(script.name);
    }
    sources.push(new gmlive.source(`_${script.name}`, script.data));
  }
  const compiled = gmlive.compile(sources);
  setCompiled(compiled);

  const gameState = getNewBase();
  linkSprites(sprites, gameState);
  initialize(compiled, gameState);
  GS.set(gameState);

  currentFrame.set(0);
  TL.nextFrame(0);

  console.log(compiled);
  console.log(gameState);
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