/** Gameplay input is safe only after transport and authoritative baseline are ready. */
export const controlsReady=(connected:boolean,hasSnapshot:boolean,chatOpen:boolean)=>connected&&hasSnapshot&&!chatOpen;
