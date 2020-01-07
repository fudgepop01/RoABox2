
export default (monaco) => {
  return [
    {
      label: 'asset_get',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the unique index (real) for any built-in game asset – including sounds, objects, and sprites. Can be used, for example, to assign a specific sound effect to a character attack',
      insertText: 'asset_get( "${1:asset/string}" )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'draw_debug_text',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Draws text to the screen',
      insertText: 'draw_debug_text( ${1:x/real}, ${2:y/real}, "${3:text/string}" )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'trigger_b_reverse',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'When used in attack_update.gml, it will check for b-reverse inputs on specified attacks.',
      insertText: 'trigger_b_reverse()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'random_func',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Generates a random value between 0 and high_value, not including high_value. If called by the same player on the same frame with the same index, this function will always return the same value (making it replay-safe)',
      insertText: 'random_func( ${1:index/real}, ${2:high_value/real}, ${3:floored?/boolean} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'random_func2',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Generates a random value between 0 and high_value, not including high_value. If called by the same player on the same frame with the same index, this function will always return the same value (making it replay-safe)',
      insertText: 'random_func2( ${1:index/real}, ${2:high_value/real}, ${3:floored?/boolean} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'attack_end',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Resets can_hit properties for all hitbox groups for the current attack. Can be used for looping attack windows, so that the hitboxes can hit again.',
      insertText: 'attack_end()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_state_name',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns a string of the player’s state.',
      insertText: 'get_state_name( ${1:state_index/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'set_state',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'changes the character\'s state',
      insertText: 'set_state( ${1:state/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'set_attack',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Changes the character’s state to the specified attack.',
      insertText: 'set_attack( ${1:attack/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'iasa_script',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Frees up the character to perform any action.',
      insertText: 'iasa_script()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'clear_button_buffer',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Clears the input buffer for the specified action.',
      insertText: 'clear_button_buffer( ${1:input_index/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'can_tap_jump',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Used in combination with tap_jump_pressed to check if tap jump is pressed',
      insertText: 'can_tap_jump()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'hit_fx_create',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Creates a visual effect to be used with your custom character. Returns the index of visual effect, to be stored for later use. Use either asset_get or sprite_get to retrieve the sprite ID',
      insertText: 'hit_fx_create( ${1:sprite_index/real}, ${2:animation_length/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'spawn_hit_fx',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Spawns a visual effect at the specified position.',
      insertText: 'spawn_hit_fx( ${1:x/real}, ${2:y/real}, ${3:hit_fx_index/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_gameplay_time',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the number of frames since the match started.',
      insertText: 'get_gameplay_time()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_game_timer',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the number of frames remaining in the match.',
      insertText: 'get_game_timer()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_stage_data',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the size of the specified part of the stage.',
      insertText: 'get_stage_data( ${1:index/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'set_victory_bg',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Overwrites character’s victory background. Can be assigned to a 480x270px custom sprite using sprite_get( sprite )',
      insertText: 'set_victory_bg( ${1:bg/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_instance_x',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the x value of the specified instance. Used for referencing objects that you normally don’t have access to.',
      insertText: 'get_instance_x( ${1:instance_id/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_instance_y',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the y value of the specified instance. Used for referencing objects that you normally don’t have access to.',
      insertText: 'get_instance_y( ${1:instance_id/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_instance_player',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the player number of the specified instance. Used for referencing objects that you normally don’t have access to.',
      insertText: 'get_instance_player( ${1:instance_id/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_instance_player_id',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the ID of the player associated with the object. Used for referencing objects that you normally don’t have access to.',
      insertText: 'get_instance_player_id( ${1:instance_id/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_training_cpu_action',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the current “CPU Action” setting in training mode. Can be used in ai_update.gml to separate attack code from other code (like recovery code).',
      insertText: 'get_training_cpu_action()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }
  ]
}
