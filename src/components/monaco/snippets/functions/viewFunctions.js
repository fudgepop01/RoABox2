
export default (monaco) => {
  return [
    {
      label: 'view_get_wview',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the width of the current viewport.',
      insertText: 'view_get_wview()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'view_get_hview',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the height of the current viewport.',
      insertText: 'view_get_hview()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'view_get_xview',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the x position (left side) of the current viewport.',
      insertText: 'view_get_xview()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'view_get_yview',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the y position (top side) of the current viewport.',
      insertText: 'view_get_yview()',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }
  ]
}
