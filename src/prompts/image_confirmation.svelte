
<div class="container" in:fly="{{ y: 150, duration: 500 }}" out:fly="{{ y: -150, duration: 500 }}">
  <h1>Does this look correct?</h1>
    {#await $spritesheet}
      <LinearProgress indeterminate/>
    {:then data}
      <img src={$spritesheet.dataUrl} alt="uploaded image"/><br/>
      <FormField>
        <BtnGroup class="buttons">

          <Button variant="outlined" on:click={() => dispatch('continue', Framecount)}>
            <Label>yes</Label>
          </Button>
          <Button variant="outlined" on:click={() => dispatch('continue', Upload)}>
            <Label>no, go back</Label>
          </Button>

        </BtnGroup>
      </FormField>
    {/await}
</div>

<!-- SCRIPT STARTS HERE -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  import Button, { Label, Group as BtnGroup } from '@smui/button';
  import FormField from '@smui/form-field';
  import LinearProgress from '@smui/linear-progress';

  import Upload from './upload.svelte';
  import Framecount from './framecount.svelte';

  import { spritesheet } from '../store/spritesheet';

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