import {describe,expect,it} from 'vitest';
import {ShotEventCursor} from '../src/network/ShotEventCursor';

describe('cursor de eventos de tiro',()=>{
  it('usa o primeiro snapshot como base e entrega somente eventos novos uma vez',()=>{
    const cursor=new ShotEventCursor();
    expect(cursor.consume([{serial:4},{serial:5}])).toEqual([]);
    expect(cursor.consume([{serial:4},{serial:5},{serial:6}])).toEqual([{serial:6}]);
    expect(cursor.consume([{serial:5},{serial:6}])).toEqual([]);
    expect(cursor.consume([{serial:7},{serial:8}])).toEqual([{serial:7},{serial:8}]);
  });

  it('não reproduz o histórico retido quando uma conexão é retomada',()=>{
    const cursor=new ShotEventCursor();
    cursor.consume([{serial:10}]);
    expect(cursor.consume([{serial:10},{serial:11}])).toEqual([{serial:11}]);
    cursor.reset();
    expect(cursor.consume([{serial:11},{serial:12},{serial:13}])).toEqual([]);
    expect(cursor.consume([{serial:12},{serial:13},{serial:14}])).toEqual([{serial:14}]);
  });
});
