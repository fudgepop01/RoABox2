import JSZip from 'jszip/dist/jszip.min.js';
import StreamSaver from 'streamsaver';

import { writable, get } from 'svelte/store';

export const selected = writable('');

const fileSystemFactory = () => {
  const myStore = writable([]);
  const { set, update, subscribe } = myStore;

  const genPaths = (nodes, path = '') => {
    for (const node of nodes) {
      if (node.type === 'folder') {
        genPaths(node.children, `${path}/${node.name}`);
      }
      node.path = `${path}/${node.name}`;
    }
  }

  const getFolderPath = (n, path) => {
    path = path.substring(1);
    let target = path.substring(0, path.indexOf('/'));
    if (target.length === 0) target = path;

    for (const entry of n) {
      if (entry.name === target) {
        if (path.indexOf('/') === -1) return entry;
        else {
          let item = getFolderPath(entry.children, path.substring(path.indexOf('/')));
          if (item && item.type === 'folder') return item;
          else return entry;
        }
      }
    }

    return undefined;
  }

  const getPath = (n, path) => {
    path = path.substring(1);
    let target = path.substring(0, path.indexOf('/'));
    if (target.length === 0) target = path;

    for (const entry of n) {
      if (entry.name === target) {
        if (path.indexOf('/') === -1) return entry;
        else return getPath(entry.children, path.substring(path.indexOf('/')));
      }
    }

    return undefined;
  }

  const addEntry = (n, path, type, name, data) => {
    const folder = getFolderPath(n, path);
    const names = folder.children.map((ch) => ch.name);
    let highest = 0;
    let duplicateRegex = new RegExp(`${name ? name : 'new_' + type}(?:\\(\\d+?\\))?`);

    if (duplicateRegex.test(names.join(' -- '))) {
      for (const fileName of names) {
        if (duplicateRegex.test(fileName) === true) {
          let val = parseInt(fileName.substring(fileName.lastIndexOf('(') + 1, fileName.lastIndexOf(')')));
          if (!isNaN(val) && val > highest) {
            highest = val;
          }
        }
      }
      highest += 1;
    }
    if (type === 'folder') {
      folder.children.push({
        type: 'folder',
        name: `${name ? name : 'new_folder'}${highest !== 0 ? `(${highest})` : ''}`,
        children: []
      })
    } else {
      folder.children.push({
        type: 'file',
        name: `${name ? name : 'new_file'}${highest !== 0 ? `(${highest})` : ''}`,
        extension: 'gml',
        data: data ? data : 'NONE'
      })
    }

    return highest;
  }

  const sort = (n) => {
    for (const entry of n) {
      if (entry.type === 'folder') sort(entry.children);
    }

    n.sort((a, b) => {
      if (a.type === b.type) {
        if (a.name === b.name) return 0;
        if ([a.name, b.name].sort()[0] === a.name) return -1
        else return 1
      }
      else {
        return a.type === 'folder' ? -1 : 1;
      }
    })
  }

  const flattenFiles = (n, out = []) => {
    for (let entry of n.children) {
      if (entry.type === 'folder' && entry.children.length === 0) {
        out.push(entry);
      } else {
        if (entry.type === 'file') out.push(entry);
        else flattenFiles(entry, out)
      }
    }
    return out;
  }

  const zipAndDownload = async (files, name, path = '') => {
    const zip = new JSZip();
    for (const file of files) {
      if (file.type === 'folder') zip.folder(`${file.path.substring(path.length + 1)}`);
      else zip.file(`${file.path.substring(path.length + 1)}`, file.data);
    }
    console.log(zip);
    const fileStream = StreamSaver.createWriteStream(`${name}.zip`);
    await new Response(await zip.generateAsync({type: 'arraybuffer'})).body.pipeTo(fileStream);
  }

  return {
    subscribe,
    set,
    newCharacter() {
      update(n => {
        n.push({
          type: 'folder',
          name: 'new character',
          children: [
            {
              type: 'folder',
              name: 'sprites',
              nameLocked: true,
              children: []
            },
            {
              type: 'folder',
              name: 'scripts',
              nameLocked: true,
              children: [
                {
                  type: 'file',
                  name: 'init',
                  extension: 'gml',
                  nameLocked: true,
                  data: 'NONE'
                },
                {
                  type: 'file',
                  name: 'load',
                  extension: 'gml',
                  nameLocked: true,
                  data: 'NONE'
                },
                {
                  type: 'folder',
                  name: 'attacks',
                  nameLocked: true,
                  children: []
                }
              ]
            },
          ]
        });
        sort(n);
        genPaths(n);
        return n;
      })
    },
    updatePaths() {
      update(n => {
        genPaths(n);
        return n;
      })
    },
    newEntry(path, type, name) {
      update(n => {
        addEntry(n, path, type, name);
        sort(n);
        genPaths(n);
        return n;
      })
    },
    rename(path, newName) {
      update(n => {
        const item = getPath(n, path);
        item.name = newName;
        sort(n);
        genPaths(n);
        return n;
      })
    },
    delete(path) {
      update(n => {
        let file = getPath(n, path);
        if (n.includes(file)) {
          n.splice(n.indexOf(file), 1);
        } else {
          let folder = getFolderPath(n, path.substring(0, path.lastIndexOf('/')));
          folder.children.splice(folder.children.indexOf(file), 1);
        }
        return n;
      })
    },
    sort() {
      update(n => {
        sort(n);
        return n;
      })
    },
    async downloadAsZip(path) {
      let item = getPath(get(myStore), path);
      if (item.type === 'file') {
        const fileStream = StreamSaver.createWriteStream(`${item.name}.${item.extension}`);
        await new Response(item.data).body.pipeTo(fileStream);
      } else {
        const files = flattenFiles(item);

        zipAndDownload(files, path.substring(path.lastIndexOf('/') + 1), path)
      }
    },
    async downloadAllAsZip() {
      let item = {
        type: 'folder',
        name: 'characters',
        path: '.',
        children: get(myStore)
      }
      const files = flattenFiles(item);

      zipAndDownload(files, 'characters');
    },
    async loadFromZip(data, zipName, path) {
      const zip = await JSZip.loadAsync(data);
      let folders = [{
        dir: true,
        path: '/',
        name: zipName
      }];

      let files = [];
      for (const entry of Object.values(zip.files)) {
        if (entry.dir) {
          let name = entry.name.substring(0, entry.name.length - 1);
          name = name.substring(name.lastIndexOf('/') + 1);
          let path = zipName + '/' + entry.name.substring(0, entry.name.length - name.length - 2);
          if (path.length > 0) path = '/' + path;
          folders.push({
            ...entry,
            path,
            name
          })
        } else {
          const name = entry.name.substring(entry.name.lastIndexOf('/') + 1);
          const data = await entry.async("text");
          let path = zipName + '/' + entry.name.substring(0, entry.name.length - name.length - 1);
          if (path.length > 0) path = '/' + path;
          files.push({
            ...entry,
            path,
            name,
            data
          })
        }
      }
      update(n => {
        for (const [i, folder] of folders.entries()) {
          let duplicateNum = addEntry(n, path + folder.path, 'folder', folder.name);
          if (duplicateNum !== 0) {
            for (const f of folders.slice(i + 1)) f.path = f.path.replace(folder.name, `${folder.name}(${duplicateNum})`);
            for (const f of files) f.path = f.path.replace(folder.name, `${folder.name}(${duplicateNum})`);
          }
        }
        for (const file of files) addEntry(n, path + file.path, 'file', file.name, file.data);
        sort(n);
        genPaths(n);
        return n;
      })

    }

  }
}
export const fileSystem = fileSystemFactory();