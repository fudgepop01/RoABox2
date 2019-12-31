
<div class="container" in:fly="{{ y: 150, duration: 500 }}" out:fly="{{ y: -150, duration: 500 }}">
  <FullFrameDisplay />
  <h1>How many frames are in this spritesheet?</h1>
  <FormField>
    <TextField 
      on:change={updateFrameCount} 
      value="1"
      class="frame-count"
      type="number" 
      label="# frames" 
      input$min="1" 
      input$max="99"
    />
  </FormField>
  <br/>
  <br/>
  <FormField>

    <BtnGroup class="buttons">
      <Button variant="outlined">
        <Label>continue...</Label>
      </Button>
    </BtnGroup>

  </FormField>
</div>

<!-- SCRIPT STARTS HERE -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  import Button, { Label, Group as BtnGroup } from '@smui/button';
  import TextField from '@smui/textfield';
  import HelperText from '@smui/textfield/helper-text';
  import FormField from '@smui/form-field';

  import FullFrameDisplay from '../components/FullFrameDisplay.svelte';

  import { spritesheet, frameCount } from '../store/spritesheet'; 
  const dispatch = createEventDispatcher();
 
  const updateFrameCount = (evt) => {
    if (evt.target.value > 0) frameCount.set(parseInt(evt.target.value));
  }
</script>

<!-- STYLE STARTS HERE -->
<style>
  .container {
    text-align: center;
    position: absolute;
    justify-self: center;
    align-self: center;
  }

  * :global(.frame-count) {
    width: 500px;
  }
</style>