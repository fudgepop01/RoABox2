import { writable } from 'svelte/store';

export const spritesheet = writable({});

export const frameCount = writable(1);
export const currentFrame = writable(0); 