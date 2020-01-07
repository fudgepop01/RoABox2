export default (monaco) => {
  return [
    {
      label: 'get_player_team',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the team of the specified player. If team mode is off, it will return the player number.',
      insertText: 'get_player_team( ${1:player/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'set_player_team',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Sets the team for the specified player.',
      insertText: 'set_player_team( ${1:player/real}, ${2:value/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_player_stocks',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the number of stocks the specified player has.',
      insertText: 'get_player_stocks( ${1:player/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'set_player_stocks',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Sets the number of stocks for the specified player.',
      insertText: 'set_player_stocks( ${1:player/real}, ${2:value/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_player_color',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the color slot being currently used by the specified player.',
      insertText: 'get_player_color( ${1:player/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'get_player_damage',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the amount of damage the specified player has.',
      insertText: 'get_player_damage( ${1:player/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'set_player_damage',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Sets the amount of damage for the specified player.',
      insertText: 'set_player_damage( ${1:player/real}, ${2:value/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'take_damage',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Deals damage to the specified player.',
      insertText: 'take_damage( ${1:damaged_player/real}, ${2:attacking_player/real}, ${3:damage/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }
  ]
}
