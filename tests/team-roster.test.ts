import {describe,expect,it} from 'vitest';
import {teamRoster} from '../src/network/TeamRoster';

describe('lista de equipe',()=>{
  it('preserva a ordem do servidor e identifica vida, queda, conexão e jogador local',()=>{
    expect(teamRoster([
      {id:'a',name:'Bruno',health:120,connected:true,ready:true},
      {id:'b',name:'Mari',health:0,connected:false,ready:false},
      {id:'c',name:'Lucas',health:Number.NaN,connected:true},
    ],'a')).toEqual([
      {id:'a',name:'Bruno',health:120,connected:true,ready:true,local:true,healthPercent:100,down:false,waiting:false},
      {id:'b',name:'Mari',health:0,connected:false,ready:false,local:false,healthPercent:0,down:true,waiting:true},
      {id:'c',name:'Lucas',health:Number.NaN,connected:true,local:false,healthPercent:0,down:false,waiting:false},
    ]);
  });
});
