export type Cue='shot'|'reload'|'impact'|'damage'|'enemy'|'ui';
export class GameAudio {
  private context:AudioContext|null=null;private master:GainNode|null=null;private beat=0;private timer=0;volume=.35;
  start() {try {this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.master.connect(this.context.destination);}void this.context.resume();this.setVolume(this.volume);}catch{/* Silent play remains available when Web Audio is unsupported. */}}
  setVolume(v:number) {this.volume=v;if(this.master&&this.context)this.master.gain.setTargetAtTime(v*.3,this.context.currentTime,.04);}
  pause() {void this.context?.suspend();}
  status() {return this.context?.state??'not-started';}
  cue(c:Cue) {const notes:Record<Cue,[number,number,OscillatorType]>={shot:[130,.07,'sawtooth'],reload:[650,.1,'triangle'],impact:[85,.07,'square'],damage:[56,.2,'sawtooth'],enemy:[72,.25,'triangle'],ui:[440,.08,'sine']};const [f,d,t]=notes[c];this.tone(f,d,t,c==='shot'?.7:.25);}
  update(dt:number,horde:boolean) {this.timer-=dt;if(this.timer>0)return;this.timer=horde?.32:.85;const notes=horde?[73.42,73.42,87.31,65.41,73.42,110,87.31,65.41]:[146.83,220,174.61,130.81,146.83,196,174.61,220];this.tone(notes[this.beat++%notes.length],horde?.28:1.5,'sine',horde?.1:.045);if(horde&&this.beat%2===0)this.tone(48,.08,'triangle',.12);}
  private tone(f:number,d:number,type:OscillatorType,volume:number) {if(!this.context||!this.master||this.context.state!=='running')return;const t=this.context.currentTime,o=this.context.createOscillator(),g=this.context.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.6,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+d+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
}
