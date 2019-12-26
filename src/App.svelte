<div id="app">
  <svelte:component this={page} on:continue={(evt) => page = evt.detail}></svelte:component>
</div>

<script>
  import Begin from './prompts/begin.svelte';
  
  let page = Begin;
</script>

<style>
  #app {
    width: 100vw;
    height: 100vh;
    position: relative;
    display: grid;
    justify-content: center;
    align-content: center;

    grid-template-columns: 100%;
    grid-template-rows: 100%;
  }

  * :global(.buttons) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px,1fr));
    width: 500px;
  }
</style>