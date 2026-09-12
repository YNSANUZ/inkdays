import {describe,expect,it} from 'vitest';
import {normalizePlayerName} from '../src/network/PlayerName';

describe('nome de jogador',()=>{
  it('preserva nomes legíveis e remove marcação e controles',()=>{
    expect(normalizePlayerName('  João   Silva  ')).toBe('João Silva');
    expect(normalizePlayerName('<b>Bruno</b>\n')).toBe('Bruno');
  });

  it('limita o nome e rejeita conteúdo vazio',()=>{
    expect([...normalizePlayerName('abcdefghijklmnopQRST')!]).toHaveLength(16);
    expect(normalizePlayerName('🔥<>')).toBeNull();
    expect(normalizePlayerName(42)).toBeNull();
  });
});
