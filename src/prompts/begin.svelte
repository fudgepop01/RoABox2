
<div class="container" in:fly="{{ y: 150, duration: 500 }}" out:fly="{{ y: -150, duration: 500 }}">
  <h1>How do you want to begin?</h1>
  <FormField>
    <BtnGroup class="buttons">
      <Button on:click={() => dispatch('continue', Upload)} variant="outlined">
        <Label>Start from Scratch</Label>
      </Button>
    </BtnGroup>

  </FormField>
  <Editor></Editor>
</div>

<!-- SCRIPT STARTS HERE -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  import Button, { Label, Group as BtnGroup } from '@smui/button';
  import FormField from '@smui/form-field';

  import Upload from './upload.svelte';
  import Editor from '../components/monaco/monaco-editor.svelte';

  const dispatch = createEventDispatcher();
</script>

<!-- STYLE STARTS HERE -->
<style>
  .container {
    text-align: center;
    position: absolute;
    justify-self: center;
    align-self: center;
  }
</style>