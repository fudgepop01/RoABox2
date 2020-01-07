
export default (monaco) => {
  return [
    {
      label: 'sound_get',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the unique index (real) of the sound asset loaded from the /sounds folder (should be in .ogg format).',
      insertText: 'sound_get( "${1:sound/string}" )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'sound_play',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Plays the specified sound effect, supports both built-in and custom sounds. Returns the id of the sound played. Use either asset_get or sound_get to retrieve the ID.',
      insertText: 'sound_play( ${1:soundID/real}, ${2:?looping/boolean}, ${3:?panning/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'sound_stop',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Stops the specified sound if it’s playing. Use either asset_get or sound_get to retrieve the ID',
      insertText: 'sound_stop( ${1:soundID/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'set_victory_theme',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Overwrites character’s victory theme. Can be assigned to a custom sound using sound_get.',
      insertText: 'set_victory_theme( ${1:theme/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }
  ]
}
