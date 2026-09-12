import {describe,expect,it} from 'vitest';
import {ReliablePlayerName} from '../src/network/ReliablePlayerName';

describe('entrega confiável do nick',()=>{
  it('repete em intervalo limitado até o snapshot confirmar',()=>{
    const name=new ReliablePlayerName(400);expect(name.set('  João  ')).toBe('João');
    expect(name.packet(0)).toEqual({type:'name',name:'João'});expect(name.packet(399)).toBeNull();
    expect(name.packet(400)).toEqual({type:'name',name:'João'});expect(name.pending).toBe(true);
    name.observe('João');expect(name.packet(800)).toBeNull();expect(name.pending).toBe(false);
  });

  it('não envia nome vazio e volta a enviar após nova escolha',()=>{
    const name=new ReliablePlayerName();expect(name.set('🔥')).toBeNull();expect(name.packet(0)).toBeNull();
    name.set('Mari');name.observe('Errante 1');expect(name.packet(0)).toEqual({type:'name',name:'Mari'});
    name.observe('Mari');name.set('Rafa');expect(name.packet(1)).toEqual({type:'name',name:'Rafa'});
  });
});
