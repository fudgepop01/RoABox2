<div class="container{data.path === $selected ? ' selected' : ''}{data.dirty ? ' dirty' : ''}"
  on:click|stopPropagation={select}
  transition:fly="{{delay: 0, duration: 300, x: -20, opacity: 0, easing: quintInOut}}"
>
  {#if uploading}
    <input type="file" bind:this={uploadInput} on:change={uploadSelected}/>
  {/if}
  {#if data.type === 'folder'}
    <svg viewBox="0 0 24 24" on:click|stopPropagation={handleClick}><path d={data.open ? mdiFolderOpen : mdiFolder} /></svg>
    {#if renaming}
      <input bind:this={editBox} type="text" on:keypress={renameSubmit}/>
    {:else}
      <span>{data.name}</span>
    {/if}
  {:else}
    <svg viewBox="0 0 24 24"><path d={mdiFile} /></svg>
    {#if renaming}
      <input bind:this={editBox} type="text" on:keypress={renameSubmit}/>
      <span>.{data.extension}</span>
    {:else}
      <span>{data.name}.{data.extension}</span>
    {/if}
  {/if}
  {#if data.path === $selected}
    <svg viewBox="0 0 24 24" on:click|stopPropagation={renameStart}><path d={mdiPencil} /></svg>
    <svg viewBox="0 0 24 24" on:click|stopPropagation={deleteFile}><path d={mdiDelete} /></svg>
    <svg viewBox="0 0 24 24" on:click|stopPropagation={download}><path d={mdiFolderDownload} /></svg>
    <svg viewBox="0 0 24 24" on:click|stopPropagation={upload}><path d={mdiFolderUpload} /></svg>
  {/if}
  {#if data.open}
    {#each data.children as child}
      <svelte:self data={child} on:fileSelected></svelte:self>
    {/each}
  {/if}
</div>

<script>
  import {
    mdiFolder,
    mdiFolderOpen,
    mdiFile,
    mdiPencil,
    mdiDelete,
    mdiFolderDownload,
    mdiFolderUpload
  } from '@mdi/js'

  import { tick, createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import { quintInOut } from 'svelte/easing';

  import { selected, fileSystem } from '../../store/fileSystem.js';

  export let data;
  export let root = false;

  let renaming = false;
  let editBox;

  let uploading = false;
  let uploadInput;

  const handleClick = () => {
    if (data.type === 'folder') {
      data.open = !data.open;
    }
  }

  let dispatch = createEventDispatcher();
  const select = () => {
    selected.set(data.path);
    dispatch('fileSelected', data);
  }

  const renameStart = async () => {
    renaming = true;
    await tick();
    editBox.select();
  }

  const renameSubmit = (evt) => {
    if (['Enter', 'Insert'].includes(evt.key)) {
      evt.preventDefault();

      renaming = false;
      fileSystem.rename(data.path, editBox.value);
    }
  }

  const deleteFile = () => {
    fileSystem.delete(data.path);
  }

  const download = () => {
    fileSystem.downloadAsZip(data.path);
  }

  const upload = async () => {
    uploading = true;
    await tick();
    uploadInput.click();
  }

  const uploadSelected = () => {
    const file = uploadInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      fileSystem.loadFromZip(reader.result, file.name.substring(0, file.name.length - 4), data.path);
      uploading = false;
    }
    reader.readAsArrayBuffer(file);
  }
</script>

<style>
  .container {
    position: relative;
    width: 100%;
    min-height: 25px;
    padding-left: 24px;
    box-sizing: border-box;
    user-select: none;
    padding-top: 2px;
  }

  .container:hover::before {
    position: absolute;
    content: '>';
    color: #0004;
    right: calc(100% - 20px);
  }

  .container.selected::before {
    position: absolute;
    content: '>';
    color: #000;
    right: calc(100% - 20px);
  }

  .container.dirty {
    background-color: #f003
  }

  .container.selected {
    background-color: #0003;
  }

  svg {
    display: inline-block;
    width: 20px;
    margin-bottom: -3px;
  }

  input {
    border: none;
    outline: none;
  }

  input[type="file"] {
    display: none;
  }
</style>