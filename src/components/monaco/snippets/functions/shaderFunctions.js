
export default (monaco) => {
  return [
    {
      label: 'shader_start',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Used at the beginning of draw scripts to recolor the following draw calls according to the character’s color profile. Must be followed by shader_end.',
      insertText: 'shader_start()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'shader_end',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Used in combination with shader_start at the beginning of draw scripts to recolor the following draw calls according to the character’s color profile.',
      insertText: 'shader_end()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'init_shader',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Refreshes the character’s shader values. If you change any of their shader colors (including outline color), you must call this to tell the game the values have changed.',
      insertText: 'init_shader()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }
  ]
}
