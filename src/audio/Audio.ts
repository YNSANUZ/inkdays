export type Cue='shot'|'reload'|'impact'|'damage'|'enemy'|'ui';

export class GameAudio {
  private context:AudioContext|null=null;private master:GainNode|null=null;private music:GainNode|null=null;private calm:GainNode|null=null;private action:GainNode|null=null;private ambience:GainNode|null=null;private beat=0;private musicTimer=0;private stepTimer=0;private ambienceTimer=1;private ambienceBeat=0;private hordeMode=false;private bossMode=false;private effectWindow=0;private effectVoices=0;volume=.35;
  start(){try{this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.music=this.context.createGain();this.calm=this.context.createGain();this.action=this.context.createGain();this.ambience=this.context.createGain();this.music.gain.value=.42;this.calm.gain.value=1;this.action.gain.value=0;this.ambience.gain.value=.8;this.calm.connect(this.music);this.action.connect(this.music);this.music.connect(this.master);this.ambience.connect(this.master);this.master.connect(this.context.destination);}void this.context.resume();this.setVolume(this.volume);}catch{/* The game remains playable without Web Audio. */}}
  setVolume(v:number){this.volume=v;if(this.master&&this.context)this.master.gain.setTargetAtTime(v*.32,this.context.currentTime,.04);}
  pause(){void this.context?.suspend();}
  status(){return this.context?.state??'not-started';}
  cue(c:Cue){
    if(c==='shot'){if(!this.allowEffect())return;this.noise(.018,.88,3600,0,undefined,'highpass');this.noise(.085,.42,1350);this.tone(132,.085,'sawtooth',.56,0,.38);this.tone(52,.16,'triangle',.34,0,.5);this.noise(.05,.11,760,.075);return;}
    if(c==='reload'){this.noise(.035,.2,2800);this.tone(920,.045,'triangle',.28,0,.76);this.tone(610,.055,'square',.18,.32,.72);this.tone(1180,.04,'triangle',.22,.76,.8);return;}
    const notes:Record<Exclude<Cue,'shot'|'reload'>,[number,number,OscillatorType,number]>={impact:[92,.07,'square',.24],damage:[54,.2,'sawtooth',.34],enemy:[72,.3,'triangle',.32],ui:[440,.08,'sine',.2]};const [f,d,t,v]=notes[c];this.tone(f,d,t,v);
  }
  update(dt:number,horde:boolean,speed=0,crouch=false,boss=false){
    if(horde!==this.hordeMode||boss!==this.bossMode){this.hordeMode=horde;this.bossMode=boss;this.beat=0;this.musicTimer=0;this.crossfade(horde);if(boss)this.cue('enemy');}
    this.musicTimer-=dt;if(this.musicTimer<=0){this.musicTimer=boss?.18:horde?.24:.7;this.playMusic(horde,boss);}
    this.ambienceTimer-=dt;if(this.ambienceTimer<=0){this.ambienceTimer=horde?7:3.8+(this.ambienceBeat%3)*1.1;this.playAmbience(horde);}
    this.stepTimer-=dt;if(speed>.45&&!crouch&&this.stepTimer<=0){this.stepTimer=speed>6?.27:.42;this.footstep(speed>6);}
    if(speed<=.45)this.stepTimer=0;
  }
  private playMusic(horde:boolean,boss=false){
    const calm=[146.83,174.61,220,196,164.81,196,246.94,220],action=[73.42,87.31,98,110,73.42,116.54,98,87.31],colossus=[55,55,65.41,58.27,55,73.42,65.41,49],phrase=boss?colossus:horde?action:calm,note=phrase[this.beat%phrase.length];
    const bus=horde?this.action:this.calm;
    if(horde){this.tone(note,boss?.3:.22,'sawtooth',boss?.1:.075,0,.82,bus);this.tone(note*2,.12,'square',boss?.05:.035,0,.9,bus);if(this.beat%2===0){this.noise(boss?.07:.045,boss?.12:.08,boss?130:180,0,bus);this.tone(boss?38:46,.09,'triangle',boss?.18:.13,0,.55,bus);}}
    else{this.tone(note,1.25,'sine',.055,0,.92,bus);this.tone(note*1.5,.85,'triangle',.022,.08,.96,bus);}
    this.beat++;
  }
  private crossfade(horde:boolean){if(!this.context||!this.calm||!this.action||!this.ambience)return;const now=this.context.currentTime,fade=1.15;for(const [gain,target] of [[this.calm,horde?0:1],[this.action,horde?1:0],[this.ambience,horde?.22:.8]] as const){gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(target,now+fade);}}
  private playAmbience(horde:boolean){this.ambienceBeat++;if(horde)return;this.noise(1.6,.018,620,0,this.ambience);if(this.ambienceBeat%3===0){this.tone(1760,.09,'sine',.018,.35,1.18,this.ambience);this.tone(2280,.07,'sine',.014,.47,.9,this.ambience);}}
  private allowEffect(){if(!this.context||this.context.state!=='running')return false;const now=this.context.currentTime;if(now-this.effectWindow>.05){this.effectWindow=now;this.effectVoices=0;}return ++this.effectVoices<=6;}
  private footstep(run:boolean){this.noise(.045,run?.15:.1,run?520:420);this.tone(run?82:70,.055,'triangle',run?.14:.1,0,.62);}
  private noise(duration:number,volume:number,cutoff:number,delay=0,target:AudioNode|null=this.master,filterType:BiquadFilterType='lowpass'){if(!this.context||!target||this.context.state!=='running')return;const rate=this.context.sampleRate,size=Math.ceil(rate*duration),buffer=this.context.createBuffer(1,size,rate),data=buffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*(1-i/size);const source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain(),time=this.context.currentTime+delay;source.buffer=buffer;filter.type=filterType;filter.frequency.value=cutoff;gain.gain.setValueAtTime(volume,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);source.connect(filter);filter.connect(gain);gain.connect(target);source.start(time);source.stop(time+duration+.01);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};}
  private tone(frequency:number,duration:number,type:OscillatorType,volume:number,delay=0,endRatio=.6,target:AudioNode|null=this.master){if(!this.context||!target||this.context.state!=='running')return;const time=this.context.currentTime+delay,oscillator=this.context.createOscillator(),gain=this.context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time);oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,frequency*endRatio),time+duration);gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(volume,time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);oscillator.connect(gain);gain.connect(target);oscillator.start(time);oscillator.stop(time+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
}
