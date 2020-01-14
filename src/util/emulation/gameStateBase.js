import { baseAttack, baseHitbox, baseWindow, reverseLookup } from './constantLookup';

export default {
  scopes: [],
  instances: {
    self: {
      fields: {},
      attacks: {},
    }
  },
  helpers() {
    return {
      // creates the base for the attack if it doesn't exist
      ensureAttack: (attackName) => {
        if (this.instances.self.attacks[attackName]) return;
        this.instances.self.attacks[attackName] = {
          initial: {
            windows: {},
            hitboxes: {},
            ...baseAttack
          },
          modified: {
            windows: {},
            hitboxes: {}
          }
        }
      },
      getAttack: (attackName) => {
        if (typeof attackName === 'number') attackName = reverseLookup('AT_', attackName);

        const attack = this.instances.self.attacks[attackName];
        const hitboxes = {};
        const windows = {};

        // PROCESS HITBOXES
        const initialHitboxKeys = Object.keys(attack.initial.hitboxes);
        const existingHitboxIndexes = [
          ...Object.keys(attack.initial.hitboxes),
          ...Object.keys(attack.modified.hitboxes).filter((v) => {
            if (initialHitboxKeys.includes(v)) return false;
            else return true;
          })
        ];
        for (const index of existingHitboxIndexes) {
          hitboxes[index] = {
            ...baseHitbox,
            ...(attack.initial.hitboxes[index] || {}),
            ...(attack.modified.hitboxes[index] || {})
          }
        }

        // PROCESS WINDOWS
        const initialWindowKeys = Object.keys(attack.initial.windows);
        const existingWindowIndexes = [
          ...Object.keys(attack.initial.windows),
          ...Object.keys(attack.modified.windows).filter((v) => {
            if (initialWindowKeys.includes(v)) return false;
            else return true;
          })
        ];
        for (const index of existingWindowIndexes) {
          windows[index] = {
            ...baseWindow,
            ...(attack.initial.windows[index] || {}),
            ...(attack.modified.windows[index] || {})
          }
        }

        // ACTUALLY OUTPUT THE DARN THING
        return {
          ...baseAttack,
          ...attack.initial,
          ...attack.modified,
          hitboxes,
          windows,
        }

      }
    }
  }
}