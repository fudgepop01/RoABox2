<div class="container">
  {#if uploading}
    <input type="file" bind:this={uploadInput} on:change={uploadZip}/>
  {/if}
  <div class="files">
    {#each $fileSystem as item}
      <Entry data={item} root={true} on:fileSelected />
    {/each}
  </div>
  <div class="options">
    <div class="option" on:click={newCharacter}>
      <svg viewBox="0 0 24 24"><path d={mdiFolderPlus}/></svg>
    </div>
    <div class="option" on:click={newFile}>
      <svg viewBox="0 0 24 24"><path d={mdiFilePlus}/></svg>
    </div>
    <div class="option" on:click={download}>
      <svg viewBox="0 0 24 24"><path d={mdiFolderDownload}/></svg>
    </div>
    <div class="option" on:click={upload}>
      <svg viewBox="0 0 24 24"><path d={mdiFolderUpload}/></svg>
    </div>
    <div class="option" on:click={storeAll}>
      <svg viewBox="0 0 24 24"><path d={mdiCloudUpload}/></svg>
    </div>
    <div class="option" on:click={loadFromStore}>
      <svg viewBox="0 0 24 24"><path d={mdiCloudDownload}/></svg>
    </div>
  </div>
</div>

<script>
  import {
    mdiFileUpload,
    mdiFileDownload,
    mdiFilePlus,
    mdiFolderPlus,
    mdiFolderDownload,
    mdiFolderUpload,
    mdiCloudUpload,
    mdiCloudDownload
  } from '@mdi/js';

  import { tick } from 'svelte';

  import store from 'store2';

  import Entry from './Entry.svelte';

  import { fileSystem, selected } from '../../store/fileSystem.js';

  const newCharacter = () => {
    fileSystem.newCharacter()
  }

  const newFile = () => {
    fileSystem.newEntry($selected, 'file');
  }

  const download = () => {
    fileSystem.downloadAllAsZip()
  }

  let uploading = false;
  let uploadInput;
  const upload = async () => {
    uploading = true;
    await tick();
    uploadInput.click();
  }

  const uploadZip = () => {
    const file = uploadInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      fileSystem.loadFromZip(reader.result, file.name.substring(0, file.name.length - 4), '');
      uploading = false;
    }
    reader.readAsArrayBuffer(file);
  }

  const storeAll = () => {
    const fs = $fileSystem;
    store({
      fs: $fileSystem
    });
  }

  const reloadAllImages = (folder) => {
    for (const f of folder.children) {
      if (f.type === 'folder') reloadAllImages(f);
      else if (f.extension === 'png') {
         f.data = document.createElement('img');
         f.data.src = f.base64;
      }
    }
  }
  const loadFromStore = () => {
    const fs = store().fs;
    reloadAllImages({children: fs});
    fileSystem.set(fs);
  }
</script>

<style>
  .container {
    position: relative;
    left: 0;
    right: 0;
    margin: auto;
    width: 100%;
    height: 100%;
    box-shadow: 0 2px 2px #000;
    text-align: left;
    font-family: 'Roboto';
    font-size: 16px;
  }

  .files {
    position: absolute;
    width: 100%;
    height: calc(100% - 40px);
    top: 40px;

    overflow-y: scroll;
  }

  .options {
    position: absolute;
    top: 0;
    margin: auto;
    width: 100%;
    height: 40px;
    display: flex;
    flex-direction: row;
    background-color: #000;
  }

  .option {
    position: relative;
    flex-grow: 1;
  }

  .option svg {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    fill: #FFF;
    width: 24px;
  }

  input[type="file"] {
    display: none;
  }
</style>