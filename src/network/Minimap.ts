export interface MapPosition {x:number;z:number}

export function minimapPoint(position:MapPosition,radius:number,size:number){
  const safeRadius=Number.isFinite(radius)&&radius>0?radius:1;
  const safeSize=Number.isFinite(size)&&size>0?size:1;
  const usable=safeSize*.43,limit=(value:number)=>Math.max(-safeRadius,Math.min(safeRadius,Number.isFinite(value)?value:0));
  return {x:safeSize/2+limit(position.x)/safeRadius*usable,y:safeSize/2+limit(position.z)/safeRadius*usable};
}
