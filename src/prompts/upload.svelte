<div class="container" in:fly="{{ y: 150, duration: 500 }}" out:fly="{{ y: -150, duration: 500 }}">
  <h1>Upload Spritesheet</h1>
  <FormField>
    <div>
      <input bind:this={upload} on:change={(evt) => {
        spritesheet.update(n => processImage(upload.files[0]));
        dispatch('continue', Confirm)
      }} type="file" style="opacity: 0; position: fixed; pointer-events: none;"/>
      <BtnGroup class="buttons">
        <Button on:click={() => upload.click()} variant="outlined">
          <Label>Click to Upload</Label>
        </Button>
      </BtnGroup>
    </div>
  </FormField>  
</div>


<!-- SCRIPT STARTS HERE -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';

  import Button, { Label, Group as BtnGroup } from '@smui/button';
  import FormField from '@smui/form-field';
  import LinearProgress from '@smui/linear-progress';
  
  import Confirm from './image_confirmation.svelte';
  
  import { spritesheet } from '../store/spritesheet'; 

  const dispatch = createEventDispatcher();
  let upload;
  
  let uploadFile = false;
  let statusMsg = '';

  const processImage = (file) => {   
    let spritesheetSrc = {};
    return new Promise(async (resolve) => {
      spritesheetSrc.file = file;
      spritesheetSrc.buffer = await file.arrayBuffer();

      let fileReader = new FileReader();

      statusMsg = 'reading file...';
      
      fileReader.onloadend = () => {
        statusMsg = 'getting image data...'

        spritesheetSrc.dataUrl = fileReader.result;
        let img = new Image();
        img.onload = function() {
          spritesheetSrc.width = this.width;
          spritesheetSrc.height = this.height;
          spritesheet.update(n => spritesheetSrc);
          resolve(spritesheetSrc);
        }
        img.src = fileReader.result;
      };
      fileReader.readAsDataURL(file);
    })
		
	}
</script>

<!-- STYLE STARTS HERE -->
<style>
  .container {
    position: absolute;
    text-align: center;
    justify-self: center;
    align-self: center;
  }
  .progress-bar {
    text-align: left;
  }
</style>