export type Cue='shot'|'reload'|'impact'|'damage'|'enemy'|'ui';

export class GameAudio {
  private context:AudioContext|null=null;private master:GainNode|null=null;private music:GainNode|null=null;private beat=0;private musicTimer=0;private stepTimer=0;private hordeMode=false;volume=.35;
  start(){try{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.music=this.context.createGain();this.music.gain.value=.42;this.music.connect(this.master);this.master.connect(this.context.destination);}void this.context.resume();this.setVolume(this.volume);}catch{/* The game remains playable without Web Audio. */}}
  setVolume(v:number){this.volume=v;if(this.master&&this.context)this.master.gain.setTargetAtTime(v*.32,this.context.currentTime,.04);}
  pause(){void this.context?.suspend();}
  status(){return this.context?.state??'not-started';}
  cue(c:Cue){
    if(c==='shot'){this.noise(.075,.85,1100);this.tone(145,.09,'sawtooth',.7,0,.38);this.tone(58,.13,'triangle',.5,0,.55);return;}
    if(c==='reload'){this.noise(.035,.2,2800);this.tone(920,.045,'triangle',.28,0,.76);this.tone(610,.055,'square',.18,.32,.72);this.tone(1180,.04,'triangle',.22,.76,.8);return;}
    const notes:Record<Exclude<Cue,'shot'|'reload'>,[number,number,OscillatorType,number]>={impact:[92,.07,'square',.24],damage:[54,.2,'sawtooth',.34],enemy:[72,.3,'triangle',.32],ui:[440,.08,'sine',.2]};const [f,d,t,v]=notes[c];this.tone(f,d,t,v);
  }
  update(dt:number,horde:boolean,speed=0,crouch=false){
    if(horde!==this.hordeMode){this.hordeMode=horde;this.beat=0;this.musicTimer=0;}
    this.musicTimer-=dt;if(this.musicTimer<=0){this.musicTimer=horde?.24:.7;this.playMusic(horde);}
    this.stepTimer-=dt;if(speed>.45&&!crouch&&this.stepTimer<=0){this.stepTimer=speed>6?.27:.42;this.footstep(speed>6);}
    if(speed<=.45)this.stepTimer=0;
  }
  private playMusic(horde:boolean){
    const calm=[146.83,174.61,220,196,164.81,196,246.94,220],action=[73.42,87.31,98,110,73.42,116.54,98,87.31],note=(horde?action:calm)[this.beat%(horde?action:calm).length];
    if(horde){this.tone(note,.22,'sawtooth',.075,0,.82,true);this.tone(note*2,.12,'square',.035,0,.9,true);if(this.beat%2===0){this.noise(.045,.08,180);this.tone(46,.09,'triangle',.13,0,.55,true);}}
    else{this.tone(note,1.25,'sine',.055,0,.92,true);this.tone(note*1.5,.85,'triangle',.022,.08,.96,true);}
    this.beat++;
  }
  private footstep(run:boolean){this.noise(.045,run?.15:.1,run?520:420);this.tone(run?82:70,.055,'triangle',run?.14:.1,0,.62);}
  private noise(duration:number,volume:number,cutoff:number,delay=0){if(!this.context||!this.master||this.context.state!=='running')return;const rate=this.context.sampleRate,size=Math.ceil(rate*duration),buffer=this.context.createBuffer(1,size,rate),data=buffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*(1-i/size);const source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain(),time=this.context.currentTime+delay;source.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.setValueAtTime(volume,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start(time);source.stop(time+duration+.01);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};}
  private tone(frequency:number,duration:number,type:OscillatorType,volume:number,delay=0,endRatio=.6,toMusic=false){if(!this.context||!this.master||this.context.state!=='running')return;const target=toMusic?this.music:this.master;if(!target)return;const time=this.context.currentTime+delay,oscillator=this.context.createOscillator(),gain=this.context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time);oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,frequency*endRatio),time+duration);gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(volume,time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);oscillator.connect(gain);gain.connect(target);oscillator.start(time);oscillator.stop(time+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
}
