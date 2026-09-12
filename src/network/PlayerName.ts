const MAX_NAME_LENGTH=16;

/** Keeps player names short and readable before they enter authoritative state. */
export function normalizePlayerName(value:unknown){
  if(typeof value!=='string')return null;
  const clean=[...value.normalize('NFKC').replace(/<[^>]*>/g,'').replace(/[^\p{L}\p{N} _-]/gu,'').replace(/\s+/g,' ').trim()].slice(0,MAX_NAME_LENGTH).join('');
  return clean||null;
}
