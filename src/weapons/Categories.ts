export type WeaponCategoryId='pistol'|'bat'|'sword'|'smg'|'shotgun'|'bow'|'sniper'|'flamethrower';
export type WeaponMechanic='ranged'|'melee'|'flame';
export interface WeaponGameplay {damage:number;interval:number;magazine:number;reserve:number;maxReserve:number;reload:number;range:number}
export interface WeaponCategory {
  id:WeaponCategoryId;label:string;color:string;mechanic:WeaponMechanic;price:number;unlockDay:number;implemented:boolean;gameplay?:WeaponGameplay;
}
export const weaponCategories:Record<WeaponCategoryId,WeaponCategory>={
  pistol:{id:'pistol',label:'Pistola de Rascunho',color:'#43b95f',mechanic:'ranged',price:0,unlockDay:1,implemented:true,gameplay:{damage:26,interval:.24,magazine:8,reserve:72,maxReserve:192,reload:1.25,range:80}},
  bat:{id:'bat',label:'Taco',color:'#55706a',mechanic:'melee',price:250,unlockDay:1,implemented:false},
  sword:{id:'sword',label:'Espada',color:'#64808a',mechanic:'melee',price:450,unlockDay:2,implemented:false},
  smg:{id:'smg',label:'SMG',color:'#8e55c7',mechanic:'ranged',price:700,unlockDay:3,implemented:false},
  shotgun:{id:'shotgun',label:'Escopeta',color:'#b05252',mechanic:'ranged',price:900,unlockDay:4,implemented:false},
  bow:{id:'bow',label:'Arco',color:'#a7753d',mechanic:'ranged',price:1100,unlockDay:5,implemented:false},
  sniper:{id:'sniper',label:'Sniper',color:'#4779ad',mechanic:'ranged',price:1600,unlockDay:7,implemented:false},
  flamethrower:{id:'flamethrower',label:'Lança-chamas',color:'#ef7b32',mechanic:'flame',price:2400,unlockDay:11,implemented:false},
};
export const pistolGameplay=weaponCategories.pistol.gameplay!;
