<script context="module">
  let monaco_promise;
  let _monaco;

  monaco_promise = import('./monaco.js');
  monaco_promise.then(mod => {
    _monaco = mod.default;
  })
</script>

<script>
  import { onMount, createEventDispatcher } from 'svelte';

  import { setupAll } from './commands.js';

  export let style;

  let monaco;
  let container;
  let editor;

  let dispatch = createEventDispatcher();
  onMount(() => {
		if (_monaco) {
      monaco = _monaco;
      editor = monaco.editor.create(
        container,
        {
          value: [
            ''
          ].join('\n'),
          language: 'gamemaker',
          theme: 'vs-dark'
        }
      )
      setupAll(editor, dispatch);
      dispatch('loaded', {editor, monaco})
			// createEditor(mode || 'svelte').then(() => {
			// 	if (editor) editor.setValue(code || '');
      // });
		} else {
			monaco_promise.then(async mod => {
        console.log(container);
        monaco = mod.default;
        editor = monaco.editor.create(
          container,
          {
            value: [
              ''
            ].join('\n'),
            language: 'gamemaker',
            theme: 'vs-dark'
          }
        )
        setupAll(editor, dispatch);
        dispatch('loaded', {editor, monaco})
      });
		}
		return () => {
			destroyed = true;
		}
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