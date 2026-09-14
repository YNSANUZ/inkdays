/** Gameplay input is safe only after the player explicitly entered the match. */
export const controlsReady=(active:boolean,connected:boolean,hasSnapshot:boolean,chatOpen:boolean)=>active&&connected&&hasSnapshot&&!chatOpen;
