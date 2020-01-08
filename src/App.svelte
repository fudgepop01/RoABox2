<div id="app">
  <div class="horizontal">
    <div class="vertical">
      <div class="editor-container">
        <Monaco kind="main" style="height: 100%" on:saveFile={saveFile} on:genAST={genGmlAST}/>
      </div>
      <div class="variable-editor">
        <Monaco kind="param" style="height: 100%" on:updateParams={updateParams} />
      </div>
    </div>

    <div class="vertical right-side">
      <div class="horizontal preview-section">
        <div class="vertical">
          <div class="timeline-container" bind:this={tlc}>
            <Timeline timelineWidth={tlc ? tlc.offsetWidth : undefined} />
          </div>
          <div class="preview-container"></div>
        </div>
        <div class="toolbar-container"></div>
      </div>
      <div class="fs-container">
        <FileSystem on:fileSelected={handleFileOpen} />
      </div>
    </div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';

  import FileSystem from './components/webFS/WebFS.svelte';
  import Monaco from './components/monaco/monaco-editor.svelte';
  import Timeline from './components/timeline/Timeline.svelte';

  import { saveFile, handleFileOpen } from './util/FileIO.js';
  import genGmlAST from './util/GMLParser/extractData.js';

  let tlc;

  const updateParams = () => {
    console.log('updated params');
  }
</script>

<style>
  #app {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  #prompts {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: grid;
    justify-content: center;
    align-content: center;
    grid-template-columns: 100%;
    grid-template-rows: 100%;
    background-color: #fffD;

    transition: background-color .5s ease;
  }

  #prompts:not(.active) {
    background-color: #fff0;
    transition: background-color .5s ease;
    pointer-events: none;
  }

  .horizontal,
  .vertical {
    width: 100%;
    height: 100%;
    display: flex;
  }
  .horizontal { flex-direction: row; }
  .vertical { flex-direction: column; }

  .right-side { width: 800px; }
  .editor-container { height: 500px; }
  .variable-editor { flex-grow: 1; }
  .preview-section { height: 500px; }
  .timeline-container { height: 75px; border: 1px solid black; }
  .toolbar-container { width: 50px; }

  .preview-container {
    background-color: #888;
    flex-grow: 1;
  }

  .fs-container {
    flex-grow: 1;
  }

  * :global(.buttons) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
    width: 500px;
  }

  :global(*:not(.editor-container > *)) {
    box-sizing: border-box;
  }
</style>