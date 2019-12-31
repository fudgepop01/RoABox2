<div class="container">
  <div class="toolbar">
    <div class="left-align">
      <span class="frame">{`${$currentFrame + 1}`.padStart(frameCount.toString().length, ' ')} / {frameCount}</span>
      <svg on:click={() => audio = !audio}><path d={audio ? mdiVolumeHigh : mdiVolumeMute}/></svg>
    </div>
    <div class="center-align">
      <svg><path d={mdiSkipPrevious}/></svg>
      <svg on:click={togglePlay}><path d={playing ? mdiPause : mdiPlay}/></svg>
      <svg><path d={mdiSkipNext}/></svg>
    </div>
    <div class="right-align">
      <svg on:click={playSpeedUp}><path d={mdiMenuUp}/></svg>
      <span class="play-speed">{`x${playSpeed}`.padStart(5, ' ')}</span>
      <svg on:click={playSpeedDown}><path d={mdiMenuDown}/></svg>
    </div>
  </div>
  <div class="timeline">
    {#each $windows as win}
      <div
        class="window"
        style="flex-grow: {win.frameCount};
          height: calc(100% - 8px);
          background-color: {win.color}"
      >
        <span
          class="window-name"
        >{win.name}</span>
      </div>
    {/each}
    {#if $windows.length === 0}
      <div
        class="window"
        style="flex-grow: 1;
          height: calc(100% - 8px);
          background-color: #000"
      >
        <span
          class="window-name"
          style="color: #fff"
        >no windows defined</span>
      </div>
    {/if}
  </div>

  <div class="frame-indicators">
    {#each new Array(frameCount).fill(0) as _, i}
      <div class="indicator">
        <div class="selector"
          style="{i === $currentFrame ? 'background-color: #D00;' : ''}"
          on:click={() => currentFrame.set(i) }
        ></div>
        {#if i !== frameCount}
          <div class="bar bar-l"></div>
          <div class="bar bar-r"></div>
        {/if}
        <div class="current"
          style="background-color: {i === $currentFrame ? '#AAA' : 'transparent'};"
        ></div>
      </div>
    {/each}
  </div>
</div>

<script>
  import {
    mdiVolumeHigh,
    mdiVolumeMute,
    mdiSkipPrevious,
    mdiSkipNext,
    mdiPlay,
    mdiPause,
    mdiMenuDown,
    mdiMenuUp,
  } from '@mdi/js'

  import {
    currentFrame,
    windows
  } from '../../store/windows.js';

  let frameCount;
  let windowBoundaries = [];
  let playSpeed = 1;
  let playing = false;
  let audio = true;
  let fpsMonitor = 0;

  $: {
    windowBoundaries = [];
    frameCount = $windows.reduce((acc, win, i) => {
      windowBoundaries.push(acc + win.frameCount);
      return acc + win.frameCount;
    }, 0)
  }

  const loop = () => {
    if (playing) {
      requestAnimationFrame(loop);
      fpsMonitor++;
      if (fpsMonitor >= (1 / playSpeed)) {
        fpsMonitor = 0;
        if ($currentFrame + 1 === frameCount) {
          currentFrame.set(0);
          //if (!anim.loop) { playing = false; }
        }
        else { currentFrame.update(n => n + 1) }
      }
    }
  }
  const togglePlay = () => {
    playing = !playing;
    if (playing) loop();
  }

  const playSpeedUp = () => {if (playSpeed == 0.25) { playSpeed = 0.5 } else { playSpeed = 1 } }
  const playSpeedDown = () => {if (playSpeed == 1) { playSpeed = 0.5 } else { playSpeed = 0.25 } }

</script>

<style>
  .container {
    height: 75px;
    width: 500px;
    background-color: grey;
    position: relative;
    user-select: none;
  }

  .toolbar {
    background-color: #000;
    color: #fff;
    width: 100%;
    height: 30px;

    display: flex;
    flex-direction: row;
  }

  .toolbar > div { flex: 1; position: relative; }
  .toolbar .left-align { display: flex; justify-content: flex-start; }
  .toolbar .center-align { display: flex; justify-content: center; }
  .toolbar .right-align { display: flex; justify-content: flex-end; }
  .toolbar svg {
    position: relative;
    display: inline-block;
    width: 24px;
    height: 24px;
    fill: #fff;
    margin-top: 3px;
  }

  svg:hover path {
    stroke: #fff;
    stroke-width: 1;
  }

  .frame,
  .play-speed,
  .window-name {
    position: relative;
    margin-top: 3px;
    padding: 0 5px;
    font-family: "Roboto Mono";
    white-space: pre;
  }

  .timeline {
    background-color: #fff;
    position: relative;
    width: 100% !important;
    height: 45px;

    display: flex;
    flex-direction: row;
  }

  .window {
    position: relative;
    text-align: left;
    margin: 4px 2px;
    border-radius: 5px;
    font-size: 18px;
  }
  .window-name {
    position: absolute;
    top: 0;
    bottom: 0;
    margin: auto;
  }

  .frame-indicators {
    position: absolute;
    margin: auto;
    bottom: 0;
    height: 50px;
    width: 100%;

    display: flex;
    flex-direction: row;
  }

  .frame-indicators .indicator { position: relative; flex: 1; }
  .frame-indicators .indicator .bar {
    position: absolute;
    margin: auto;
    top: 0;
    width: 1px;
    height: 5px;
    background-color: #888;
    mix-blend-mode: multiply;
  }
  .bar-r { right: 0 }
  .bar-l { left: 0 }

  .frame-indicators .indicator .selector {
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    width: 100%;
    height: 5px;
    background-color: #AAA;
    isolation: isolate;
  }

  .frame-indicators .indicator .selector:hover {
    height: 10px;
    margin-top: -2px;
    background-color: #f88;
  }

  .frame-indicators .indicator .current {
    position: absolute;
    margin: auto;
    bottom: 4px;
    width: 100%;
    height: calc(100% - 13px);
    mix-blend-mode: multiply;
  }

</style>