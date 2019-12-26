{#each new Array($frameCount).fill(0) as _, i}
  <div 
    style="
      width: {$spritesheet.width / $frameCount}px;
      height: {$spritesheet.height}px;
      background-image: url({$spritesheet.dataUrl});
      background-position: {($spritesheet.width / $frameCount) * -i}px 0;
      display: inline-block;
      border-right: {(i !== $frameCount - 1) ? '1px solid black' : 'none'};
      position: relative;
    "
  >
    <div style="position: absolute; top: 100%; left: 0; right: 0; margin: auto;">
      {i + 1}
    </div>
  </div>
{/each}

<script>
  import { spritesheet, frameCount, currentFrame } from '../store/spritesheet.js';
</script> 