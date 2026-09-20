const colors=['#3178b8','#b83b62','#25854c','#8a55b5','#b36a19','#167d84','#a33e32','#586cbd'] as const;
export function playerColor(id:string){let hash=2166136261;for(const char of id){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return colors[(hash>>>0)%colors.length];}
