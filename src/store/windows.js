import { writable, derived } from 'svelte/store';

export const currentFrame = writable(0);
export const selectedWindow = writable(-1);

const randColor = () => {
  return `#${
    Math.floor(Math.random() * 105 + 150).toString(16).padStart(2, '0') +
    Math.floor(Math.random() * 105 + 150).toString(16).padStart(2, '0') +
    Math.floor(Math.random() * 105 + 150).toString(16).padStart(2, '0')}
  `;
}

const createWindows = () => {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    clear() { set(0) },
    createNew(index) {
      update(n => {
        n.splice(index, 0, {
          name: 'new window',
          color: randColor(),
          frameCount: 8
        })
        return n;
      })
    },
    remove(index) {
      update(n => {
        n.splice(index, 1)
        return n;
      })
    }
  }
}
export const windows = createWindows();
export const frameCount = derived(
  windows,
  $windows => {
    return $windows.reduce((acc, win, i) => {
      return acc + win.frameCount;
    }, 0)
  }
)
export const windowPositions = derived(
  windows,
  $windows => {
    let out = [];
    let tracker = 0;
    for (const win of $windows) {
      out.push(tracker);
      tracker += win.frameCount;
    }
    return out;
  }
)

const createPlaySpeed = () => {
  const { update, subscribe } = writable(1);

  return {
    subscribe,
    increase() {
      update(n => {
        return (n === 0.25) ? 0.5 : 1;
      })
    },
    decrease() {
      update (n => {
        return (n === 1) ? 0.5 : 0.25;
      })
    }
  }
}
export const playSpeed = createPlaySpeed();
