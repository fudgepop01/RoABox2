import GENERAL from './snippets/functions/general';
import PLAYER_RELATED from './snippets/functions/playerRelated';
import SPRITE_FUNCTIONS from './snippets/functions/spriteFunctions';
import SOUND_FUNCTIONS from './snippets/functions/soundFunctions';
import VIEW_FUNCTIONS from './snippets/functions/viewFunctions';
import COLOR_FUNCTIONS from './snippets/functions/colorFunctions';
import SHADER_FUNCTIONS from './snippets/functions/shaderFunctions';
import ATTACK_HG_FUNCTIONS from './snippets/functions/attackHGFunctions';
import EASING_FUNCTIONS from './snippets/functions/easingFunctions';

import PLAYER_STATES from './snippets/variables/playerStates';
import PLAYER_VARIABLES from './snippets/variables/playerVariables';
import ATTACK_INDEXES from './snippets/variables/attackIndexes';
import ATTACK_GRID_INDEXES from './snippets/variables/attackGridIndexes';
import HITBOX_VARIABLES from './snippets/variables/hitboxVariables';
import HITBOX_GRID_INDEXES from './snippets/variables/hitboxGridIndexes';

import BUILTINS from './snippets/Builtins';

export default (monaco) => {
  return [
    ...GENERAL(monaco),
    ...PLAYER_RELATED(monaco),
    ...SPRITE_FUNCTIONS(monaco),
    ...SOUND_FUNCTIONS(monaco),
    ...VIEW_FUNCTIONS(monaco),
    ...COLOR_FUNCTIONS(monaco),
    ...SHADER_FUNCTIONS(monaco),
    ...ATTACK_HG_FUNCTIONS(monaco),
    ...EASING_FUNCTIONS(monaco),

    ...PLAYER_STATES(monaco),
    ...PLAYER_VARIABLES(monaco),
    ...ATTACK_INDEXES(monaco),
    ...ATTACK_GRID_INDEXES(monaco),
    ...HITBOX_VARIABLES(monaco),
    ...HITBOX_GRID_INDEXES(monaco),

    ...BUILTINS(monaco)
  ]
}