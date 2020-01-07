
export default (monaco) => {
  return [
    {
      label: 'sprite_get',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Returns the unique index (real) of the sprite asset loaded from the /sprites folder.',
      insertText: 'sprite_get( "${1:sprite/string}" )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'sprite_change_offset',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Changes the x and y offset (origin) of the sprite asset loaded from the /sprites folder. Coordinates are relative to the (0,0) position being the upper left corner of the sprite.',
      insertText: 'sprite_change_offset( "${1:sprite/string}", ${2:xoff/real}, ${3:yoff/real} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    },
    {
      label: 'sprite_change_collision_mask',
      kind: monaco.languages.CompletionItemKind.Function,
      documentation: 'Updates collision mask properties of the sprite asset loaded from the /sprites folder.',
      insertText: 'sprite_change_collision_mask( "${1:sprite/string}", ${2:sepmasks/boolean}, ${3:bboxmode/0_1_2}, ${4:bbleft/real}, ${5:bbtop/real}, ${6:bbright/real}, ${7:bbbottom/real}, ${8:kind/0_1_2_3} )',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    }
  ]
}
