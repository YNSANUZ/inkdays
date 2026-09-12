/** Continues above the last command accepted by a preserved server session. */
export const resumeInputSequence=(current:number,acknowledged:number)=>Math.max(current,acknowledged+1,0);
