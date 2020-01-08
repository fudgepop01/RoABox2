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

  import { setupMain, setupParams } from './commands.js';
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

    if (kind === 'param') {
      editor = monaco.editor.create(
        container,
        {
          value: '; variables parsed from the character\'s code will appear here',
          language: 'ini',
          theme: 'vs-dark'
        }
      );
      setupParams(editor, dispatch);
      editors.paramEditor = editor;

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