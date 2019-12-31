<script>
  import { onMount, createEventDispatcher, tick } from 'svelte';

  import {
    currentFrame,
    playSpeed,
    windows,
    selectedWindow,
    windowPositions,
    frameCount
  } from '../../store/windows.js';

  export let playing = false;
  export let timelineScale;
  export let timelineWidth;

  // loaded on mount
  let timelineContainer;

  let fpsMonitor = 0;
  const loop = () => {
    if (playing) {
      requestAnimationFrame(loop);
      fpsMonitor++;
      if (fpsMonitor >= (1 / $playSpeed)) {
        fpsMonitor = 0;
        if ($currentFrame + 1 >= $frameCount) {
          currentFrame.set(0);
          //if (!anim.loop) { playing = false; }
        }
        else { currentFrame.update(n => n + 1) }
      }
      timelineContainer.scrollLeft = ($currentFrame - Math.floor(timelineWidth / timelineScale / 2)) * timelineScale
    }
  }
  const togglePlay = () => {
    playing = !playing;
    if (playing) loop();
  }

  const addWindowLeft = (evt) => {
    windows.createNew($selectedWindow);
    selectedWindow.update(n => n + 1);
  }
  const removeWindow = async (evt) => {
    currentFrame.update(n => {
      if (n > $windowPositions[$selectedWindow]) {
        return n - $windows[$selectedWindow].frameCount
      } else { return n }
    });
    windows.remove($selectedWindow);
    await tick();
    if ($currentFrame < 0) currentFrame.set(0);
    selectedWindow.set(-1);
  }
  const addWindowRight = (evt) => {
    windows.createNew($selectedWindow + 1);
  }

  const handleZoom = (evt) => {
    timelineScale += evt.deltaY / 100
    if (timelineScale < 8) timelineScale = 8;
    else if (timelineScale > 100) timelineScale = 100;
  }

  const dispatch = createEventDispatcher();
  onMount(() => {
    dispatch('mounted', {
      togglePlay,
      addWindowLeft,
      addWindowRight,
      removeWindow,
      handleZoom,
      callback(tlc) {
        timelineContainer = tlc;
      }
    })
  })
</script>