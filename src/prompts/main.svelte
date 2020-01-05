
<div class="container" in:fly="{{ y: 150, duration: 500 }}" out:fly="{{ y: -150, duration: 500 }}">
  <h1>___</h1>
  <FormField>

    <BtnGroup class="buttons">
      <Button variant="outlined">
        <Label>placeholder</Label>
      </Button>
    </BtnGroup>

  </FormField>

  <Monaco style="width: 500px; height: 500px; text-align: left" />
</div>

<!-- SCRIPT STARTS HERE -->
<script>
  // svelte
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  // smui
  import Button, { Label, Group as BtnGroup } from '@smui/button';
  import FormField from '@smui/form-field';

  // components
  import Monaco from '../components/monaco/monaco-editor.svelte';

  // pages
  // stores

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