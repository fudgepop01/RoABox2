<div id="container">
  <canvas width="960" height="540" bind:this={canvas}></canvas>
</div>

<script>
  import { currentFrame } from '../../store/windows.js';
  import { timeline } from '../../store/gameState.js';
  import { onMount } from 'svelte';

  let canvas;

  $: if (canvas && $timeline.length > 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 960, 540);

    // draw background
    ctx.drawImage($timeline[$currentFrame].resources.bgImage.data, 0, 0);
    for (const [name, instance] of Object.entries($timeline[$currentFrame].instances)) {
      if (!['par_block', 'par_jumpthrough'].includes(instance.fields.object_index)) continue;

      const img = instance.animLinks[instance.fields.sprite_index].data
      ctx.drawImage(img, instance.fields.x, instance.fields.y);
    }

    // draw characters
    for (const [name, instance] of Object.entries($timeline[$currentFrame].instances)) {
      if (!['oPlayer'].includes(instance.fields.object_index)) continue;

      const imgData = (instance.animLinks[instance.fields.sprite_index] || $timeline[$currentFrame].resources.nullImg);
      if (imgData.data.src === './images/null_sprite.png') ctx.drawImage(imgData.data, instance.fields.x, instance.fields.y);
      else {
        const idx = instance.fields.image_index;
        const frameCount = imgData.frameCount;
        const height = imgData.data.height;
        const width = imgData.data.width / frameCount;

        ctx.drawImage(
          imgData.data,
          width * idx,
          0,
          width,
          height,
          instance.fields.x - imgData.xoff,
          instance.fields.y - imgData.yoff,
          width,
          height
        )

        // ctx.fillStyle = 'red';
        // ctx.fillRect(instance.fields.x, instance.fields.y, 2, 2)
        // ctx.fillStyle = 'yellow';
        // ctx.fillRect(instance.fields.x - (imgData.xoff || 0), instance.fields.y - (imgData.yoff || 0), 2, 2)
        ctx.fillStyle = '#0f08';
        if (imgData.hitbox) {
          switch (imgData.hitbox.type) {
            case 'box':
              ctx.fillRect(
                instance.fields.x - imgData.hitbox.xoff,
                instance.fields.y - imgData.hitbox.yoff,
                imgData.hitbox.width,
                imgData.hitbox.height
              )
              break;
            default: break;
          }
        } else {
          ctx.fillRect(
            instance.fields.x - 16,
            instance.fields.y - 62,
            32,
            64
          )
        }
      }
    }
  }

  // onMount(() => {
  //   let loadCount = 0;
  //   const incLoad = () => {loadCount++; if (loadCount === 4) loadComplete = true;}
  //   platformImage.onload = incLoad;
  //   nullImg.onload = incLoad;
  //   bgImage.onload = incLoad;
  //   stageImage.onload = incLoad;
  // })

</script>

<style>
  #container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  canvas {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>