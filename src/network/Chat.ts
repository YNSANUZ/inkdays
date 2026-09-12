const MAX_CHAT_LENGTH=100;
export function normalizeChatText(value:unknown){
  if(typeof value!=='string')return null;
  const clean=[...value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]+/gu,' ').replace(/\s+/g,' ').trim()].slice(0,MAX_CHAT_LENGTH).join('');
  return clean||null;
}

export class ChatOutbox {
  private next=0;private queue:{messageId:number;text:string;sentAt:number}[]=[];
  constructor(private intervalMs=400){}
  observe(acknowledged:number){if(Number.isSafeInteger(acknowledged)){this.next=Math.max(this.next,acknowledged+1);this.queue=this.queue.filter(message=>message.messageId>acknowledged);}}
  submit(value:unknown){const text=normalizeChatText(value);if(!text)return null;const message={messageId:this.next++,text,sentAt:-Infinity};this.queue.push(message);return {messageId:message.messageId,text};}
  packet(now:number){const message=this.queue[0];if(!message||now-message.sentAt<this.intervalMs)return null;message.sentAt=now;return {type:'chat' as const,messageId:message.messageId,text:message.text};}
  get pending(){return this.queue.length;}
}
