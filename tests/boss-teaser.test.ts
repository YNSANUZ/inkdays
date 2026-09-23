import {describe,expect,it} from 'vitest';
import {BossTeaser} from '../src/world/BossTeaser';

describe('boss teaser da home',()=>{
  it('mantém somente uma silhueta sem detalhes e anima respiração discreta',()=>{
    const teaser=new BossTeaser();
    expect(teaser.root.name).toBe('boss-teaser-silhouette');
    expect(teaser.root.userData.silhouetteOnly).toBe(true);
    expect(teaser.root.userData.represents).toBe('human-deer');
    const before=teaser.root.scale.y;teaser.update(Math.PI/(2*.55));expect(teaser.root.scale.y).not.toBe(before);
    teaser.visible=false;expect(teaser.root.visible).toBe(false);
  });
});
