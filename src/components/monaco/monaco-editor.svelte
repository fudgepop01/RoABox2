<script context="module">
  let monaco_promise;
  let _monaco;

  monaco_promise = import('./monaco.js');
  monaco_promise.then(mod => {
    _monaco = mod.default;
    return mod.default;
  })
</script>

<script>
  import { onMount, createEventDispatcher } from 'svelte';

  import { setupMain, setupInput } from './commands.js';
  import editors from '../../store/editors.js';

  export let style;
  export let kind;

  let monaco;
  let container;
  let editor;

  let dispatch = createEventDispatcher();

  const setup = async (kind) => {
    if (_monaco) monaco = _monaco;
    else monaco = (await monaco_promise).default;

    if (kind === 'input') {
      editor = monaco.editor.create(
        container,
        {
          value: [
            '// files in scripts/debug will be opened in here.',
            '// use them to setup and test things.',
            '// only the currently-opened file will be run',
            '// this file will be run before everything else on every frame'
          ].join('\n'),
          language: 'gamemaker',
          theme: 'vs-dark'
        }
      );
      setupInput(editor, dispatch);
      editors.inputEditor = editor;

    } else if (kind === 'main') {
      editor = monaco.editor.create(
        container,
        {
          value: '',
          language: 'gamemaker',
          theme: 'vs-dark'
        }
      );
      setupMain(editor, dispatch);
      editors.mainEditor = editor;
    }
    editors.monaco = monaco;
  }

  onMount(() => {
    setup(kind);
  });
</script>

<div class="monaco-container" bind:this={container} {style} >
</div>

<style>
  .monaco-container {
    height: 100%;
    width: 100%;
  }
</style>