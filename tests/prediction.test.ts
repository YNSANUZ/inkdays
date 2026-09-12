import {describe,it,expect} from 'vitest';
import {ClientPrediction} from '../src/network/ClientPrediction';
import {MovementAuthority} from '../src/network/MovementAuthority';
import type {Point} from '../src/simulation/Movement';
const world={move(p:Point,x:number,z:number){p.x+=x;p.z+=z;}};
const command=(moving=true)=>({x:0,z:moving?1:0,run:false,crouch:false,jump:false,fire:false,reload:false});
describe('predição e reconciliação',()=>{
  it.each([{ping:50,delay:2,loss:17},{ping:120,delay:4,loss:11},{ping:250,delay:8,loss:7}])('mantém resposta e converge com ping de $ping ms, perda, duplicação e reordenação',({delay,loss})=>{
    const server=new MovementAuthority(world);server.join('a');
    const initial=server.snapshot().players[0];const client=new ClientPrediction(world,initial);
    const network:{deliver:number;packet:ReturnType<typeof packet>}[]=[];
    function packet(sequence:number,moving=true){return {version:1 as const,sequence,yaw:0,command:command(moving)};}
    let lastSnapshot=server.snapshot();
    for(let tick=0;tick<180;tick++){
      const p=packet(tick,tick<120);client.submit({sequence:p.sequence,yaw:p.yaw,command:p.command});
      // Deterministic delay, jitter, loss, duplication and occasional reordering.
      if(tick%loss!==5%loss){const deliver=tick+delay+(tick%7===0?delay:0);network.push({deliver,packet:p});if(tick%19===0)network.push({deliver:deliver+1,packet:p});}
      for(const item of network.filter(item=>item.deliver===tick).reverse())server.receive('a',item.packet);
      server.step();if(tick%3===0){lastSnapshot=server.snapshot();client.reconcile(lastSnapshot.players[0]);}
      client.updateRender(1/60);
    }
    for(let tick=180;tick<240;tick++){const p=packet(tick,false);server.receive('a',p);server.step();lastSnapshot=server.snapshot();client.reconcile(lastSnapshot.players[0]);client.updateRender(1/60);}
    expect(client.motion.position.z).toBeCloseTo(lastSnapshot.players[0].position.z,8);
    expect(client.pendingCount).toBe(0);expect(client.renderPosition.z).toBeCloseTo(client.motion.position.z,3);
  });
  it('corrige erros pequenos gradualmente e teleporte grande imediatamente',()=>{
    const client=new ClientPrediction(world,{acknowledged:-1,position:{x:0,y:0,z:0},velocity:{x:0,y:0,z:0},vertical:0});
    client.submit({sequence:0,yaw:0,command:command()});const before=client.renderPosition.z;
    client.reconcile({acknowledged:0,position:{x:0,y:0,z:before-.5},velocity:{x:0,y:0,z:0},vertical:0});
    expect(client.renderPosition.z).toBeCloseTo(before);for(let i=0;i<60;i++)client.updateRender(1/60);expect(client.renderPosition.z).toBeCloseTo(before-.5,3);
    client.reconcile({acknowledged:0,position:{x:10,y:0,z:0},velocity:{x:0,y:0,z:0},vertical:0});expect(client.renderPosition.x).toBe(10);
  });
});
