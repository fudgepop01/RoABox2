<script context="module">
  let monaco_promise;
  let _monaco;

  monaco_promise = import('./monaco.js');
  monaco_promise.then(mod => {
    _monaco = mod.default;
  })
</script>

<script>
  import { onMount } from 'svelte';

  let monaco;
  let container;
  let editor;

  onMount(() => {
		if (_monaco) {
      monaco = _monaco;
      editor = monaco.editor.create(
        container
      )
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
              'var thing = 12345678.98765;'
            ].join('\n'),
            language: 'gamemaker'
          }
        )
        window['editor'] = editor;
      });
		}
		return () => {
			destroyed = true;
			// if (editor) editor.toTextArea();
		}
  });
  //butts2
</script>

<div class="monaco-container" bind:this={container} style="height: 500px; text-align: left">
</div>