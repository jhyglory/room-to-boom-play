export class RunClock {
  constructor(){this.reset();}
  reset(){this.started=false;this.running=false;this.elapsed=0;this.since=0;this.finished=false;}
  start(now){if(this.started||this.finished)return;this.started=true;this.running=true;this.since=now;}
  read(now){return this.elapsed+(this.running?Math.max(0,now-this.since):0);}
  pause(now){if(!this.running)return;this.elapsed=this.read(now);this.running=false;}
  resume(now){if(!this.started||this.finished||this.running)return;this.running=true;this.since=now;}
  finish(now){this.pause(now);this.finished=true;return this.elapsed;}
}
export function formatSeconds(ms){return (Math.max(0,ms)/1000).toFixed(2);}
