import { STAGE, normalizeSeconds, readBest, saveBest } from './records.js?v=0.19.0';

const PLAYER_KEY = 'room-to-boom:player-id';
const NAME_KEY = 'room-to-boom:nickname';
export function cleanNickname(value) {
  const text = String(value ?? '').normalize('NFC').replace(/[\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim();
  return Array.from(text).slice(0, 16).join('') || 'Player';
}
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
export function makeSubmissionId() {
  return globalThis.crypto?.randomUUID?.() || `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function rankLabel(entry) {
  return entry ? `${entry.tied ? 'Tied ' : ''}#${entry.rank}` : 'No rank yet';
}
export function validateBoard(value) {
  if (!value || value.stage !== STAGE || value.scope !== 'server' || !Number.isSafeInteger(value.total) || value.total < 0 || !Array.isArray(value.top) || value.top.length !== Math.min(8,value.total)) throw new Error('Invalid leaderboard');
  const row = (entry, position) => {
    if (!entry || typeof entry.playerId !== 'string' || !entry.playerId || typeof entry.nickname !== 'string' || normalizeSeconds(entry.seconds) === null || !Number.isSafeInteger(entry.rank) || entry.rank < 1 || entry.rank > value.total) throw new Error('Invalid rank');
    const ordinal=entry.position ?? position;
    if (!Number.isSafeInteger(ordinal) || ordinal < entry.rank || ordinal > value.total || (position && ordinal !== position)) throw new Error('Invalid position');
    if (typeof entry.tied !== 'boolean') throw new Error('Invalid tie');
    return {...entry,position:ordinal,nickname:cleanNickname(entry.nickname),seconds:normalizeSeconds(entry.seconds)};
  };
  const ids=new Set();
  const top=value.top.map((entry,index)=>{
    const checked=row(entry,index+1);
    if(ids.has(checked.playerId))throw new Error('Duplicate player');
    ids.add(checked.playerId);return checked;
  });
  top.forEach((entry,index)=>{
    const previous=top[index-1],same=previous?.seconds===entry.seconds;
    if(previous && entry.seconds<previous.seconds)throw new Error('Unsorted records');
    if(entry.rank !== (same?previous.rank:index+1))throw new Error('Invalid competition rank');
    if(same && (!entry.tied||!previous.tied))throw new Error('Missing tie');
    const next=top[index+1];
    if(!same && (!next || next.seconds!==entry.seconds) && (index<top.length-1 || top.length===value.total) && entry.tied)throw new Error('False tie');
  });
  const me=value.me ? row(value.me,value.me.position ?? value.me.rank) : null;
  if(me){
    const visible=top.find(entry=>entry.playerId===me.playerId);
    if(me.position<=top.length && !visible)throw new Error('Mismatched self position');
    if(visible && ['rank','position','seconds','tied','nickname'].some(key=>visible[key]!==me[key]))throw new Error('Mismatched self record');
    if(!visible && top.length){
      const boundary=top.at(-1);
      if(me.position<=top.length||me.seconds<boundary.seconds)throw new Error('Unsorted self record');
      if(me.seconds===boundary.seconds && (me.rank!==boundary.rank||!me.tied||!boundary.tied))throw new Error('Mismatched boundary tie');
      if(me.seconds>boundary.seconds && me.rank<=boundary.position)throw new Error('Invalid outside rank');
    }
    if(value.playerId && value.playerId!==me.playerId)throw new Error('Mismatched identity');
  }
  return {...value,top:top.map(entry=>({...entry,isMe:entry.playerId===me?.playerId})),me,persisted:value.persisted===true};
}

export class LeaderboardClient {
  constructor({storage,fetch:fetcher,timeoutMs=2500,serverEnabled=true}={}) {
    this.storage=storage;this.fetcher=fetcher;this.timeoutMs=timeoutMs;this.serverEnabled=serverEnabled;
    this.playerId=this.read(PLAYER_KEY)||makeSubmissionId();this.write(PLAYER_KEY,this.playerId);
    const savedName=this.read(NAME_KEY);
    this.nickname=cleanNickname(savedName);
    this.hasNickname=this.read('room-to-boom:nickname-set')==='true'||!!savedName&&!['Player','플레이어'].includes(this.nickname);
    this.pending=Promise.resolve();this.profile=null;this.profilePromise=null;this.submissions=new Map();
    this.deviceBest=null;
  }
  read(key){try{return this.storage?.getItem(key);}catch{return null;}}
  write(key,value){try{this.storage?.setItem(key,value);return !!this.storage;}catch{return false;}}
  setNickname(value){this.nickname=cleanNickname(value);this.hasNickname=true;this.write(NAME_KEY,this.nickname);this.write('room-to-boom:nickname-set','true');return this.nickname;}
  adoptProfile(profile){
    if(!profile||profile.scope!=='server'||typeof profile.playerId!=='string'||!profile.playerId||typeof profile.nickname!=='string')throw new Error('Invalid profile');
    this.playerId=profile.playerId;this.write(PLAYER_KEY,this.playerId);
    this.nickname=cleanNickname(profile.nickname);this.write(NAME_KEY,this.nickname);
    if(!['Player','플레이어'].includes(this.nickname)){this.hasNickname=true;this.write('room-to-boom:nickname-set','true');}
    this.profile={...profile,nickname:this.nickname};return this.profile;
  }
  adoptBoard(board){
    if(board.playerId)this.adoptProfile({scope:'server',playerId:board.playerId,nickname:board.nickname??board.me?.nickname??this.nickname});
    else if(board.me)this.adoptProfile({scope:'server',playerId:board.me.playerId,nickname:board.me.nickname});
    return board;
  }
  enqueue(action){const pending=this.pending.then(action,action);this.pending=pending.catch(()=>{});return pending;}
  async ensureProfile(){
    if(this.profile)return this.profile;
    if(!this.profilePromise)this.profilePromise=this.request('./api/profile').then(value=>this.adoptProfile(value)).finally(()=>{this.profilePromise=null;});
    return this.profilePromise;
  }
  localBoard(seconds) {
    const known=readBest(this.storage),given=normalizeSeconds(seconds);
    const candidates=[known,given,...(!this.serverEnabled?[this.deviceBest]:[])].filter(value=>value!==null);
    const best=candidates.length?Math.min(...candidates):null;
    const me=best===null?null:{rank:1,position:1,tied:false,playerId:this.playerId,nickname:this.nickname,seconds:best,isMe:true};
    return {scope:'browser',stage:STAGE,total:me?1:0,top:me?[me]:[],me,persisted:known!==null&&(this.serverEnabled||known===best)};
  }
  async request(path,options={}) {
    if(!this.serverEnabled)throw new Error('Server requests are disabled');
    if(typeof this.fetcher!=='function')throw new Error('Server unavailable');
    const controller=new AbortController();let timer;
    try {
      const response=await Promise.race([
        this.fetcher(path,{...options,credentials:'same-origin',signal:controller.signal}),
        new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Request timed out'));},this.timeoutMs);}),
      ]);
      if(!response.ok)throw new Error(`Request failed (${response.status})`);
      return await Promise.race([response.json(),new Promise((_,reject)=>{
        clearTimeout(timer);timer=setTimeout(()=>{controller.abort();reject(new Error('Response timed out'));},this.timeoutMs);
      })]);
    } finally {clearTimeout(timer);}
  }
  submit(seconds,{submissionId=makeSubmissionId(),nickname}={}) {
    const value=normalizeSeconds(seconds);
    if(value===null)return Promise.reject(new RangeError('Invalid completion time'));
    const previous=this.submissions.get(submissionId);
    if(previous){
      if(previous.seconds!==value)return Promise.reject(new Error('Submission already used'));
      return previous.promise;
    }
    const promise=this.enqueue(async()=>{
      if(!this.serverEnabled){
        if(nickname!==undefined)this.setNickname(nickname);
        const previous=this.localBoard(null).me?.seconds??null;
        saveBest(this.storage,value);
        this.deviceBest=previous===null?value:Math.min(previous,value);
        return {...this.localBoard(value),isNewBest:previous===null||value<previous};
      }
      try {
        // Establish the authenticated identity before a completion can commit.
        // A timed-out identity GET may create an empty profile, never a record.
        await this.ensureProfile();
        const name=cleanNickname(nickname??this.nickname);
        const data=await this.request('./api/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage:STAGE,seconds:value,nickname:name,submissionId})});
        return this.adoptBoard(validateBoard(data));
      } catch { return {...this.localBoard(value),syncError:true}; }
    });
    this.submissions.set(submissionId,{seconds:value,promise});
    // A failed connection may have committed on the server. Retry with the
    // same receipt ID and established identity, never invent a second finish.
    void promise.then(board=>{if(board.syncError&&this.submissions.get(submissionId)?.promise===promise)this.submissions.delete(submissionId);});
    if(this.submissions.size>64)this.submissions.delete(this.submissions.keys().next().value);
    return promise;
  }
  updateNickname(value,{seconds=null,localOnly=false}={}) {
    const name=cleanNickname(value);
    return this.enqueue(async()=>{
      if(localOnly||!this.serverEnabled){this.setNickname(name);return {...this.localBoard(seconds),profileSaved:'browser'};}
      await this.ensureProfile();
      const profile=await this.request('./api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:name})});
      const saved=this.adoptProfile(profile);this.setNickname(saved.nickname);
      const board=this.adoptBoard(validateBoard(await this.request(`./api/leaderboard?stage=${encodeURIComponent(STAGE)}`)));
      return {...board,profileSaved:'server'};
    });
  }
  refresh(seconds) {
    return this.enqueue(async()=>{
      if(!this.serverEnabled)return this.localBoard(seconds);
      try {await this.ensureProfile();return this.adoptBoard(validateBoard(await this.request(`./api/leaderboard?stage=${encodeURIComponent(STAGE)}`)));}
      catch {return {...this.localBoard(seconds),syncError:true};}
    });
  }
}

function timeHTML(seconds){return `${seconds.toFixed(2)}<small>s</small>`;}
function avatarHTML(entry){
  // The server has no profile artwork field. Use the supplied neutral profile
  // icon for actual players; never assign the kit's sample identities.
  return entry
    ? '<img class="result-avatar" src="./assets/leaderboard/components/avatar_default.svg" alt="" aria-hidden="true" width="88" height="88">'
    : '<span class="result-avatar result-avatar-empty" aria-hidden="true">·</span>';
}
export function renderLeaderboardHTML(board) {
  const actual=board.top;
  if(!actual.length)return '<p class="result-empty">No records yet. Be the first to finish!</p>';
  const first=actual.slice(0,3),order=first.length>=2?[1,0,...(first.length===3?[2]:[])]:[0];
  const podium=order.map(index=>{
    const entry=first[index],modifier=['first','second','third'][index];
    return `<li class="result-podium-place result-podium-${modifier}${entry.isMe?' is-self':''}" data-player-id="${escapeHTML(entry.playerId)}"${entry.isMe?' aria-current="true"':''}><span class="result-podium-medal">${entry.rank}</span>${entry.tied?`<span class="result-tie-label">${rankLabel(entry)}</span>`:''}${avatarHTML(entry)}<strong class="result-player-name">${escapeHTML(entry.nickname)}${entry.isMe?'<small>You</small>':''}</strong><span class="result-player-time">${timeHTML(entry.seconds)}</span></li>`;
  }).join('');
  const rows=actual.slice(3).map(entry=>`<div class="result-table-row${entry.isMe?' is-self':''}" role="row" data-player-id="${escapeHTML(entry.playerId)}"${entry.isMe?' aria-current="true"':''}><span class="result-rank-number" role="cell">${rankLabel(entry)}</span><span class="result-table-player" role="cell">${avatarHTML(entry)}<strong class="result-player-name">${escapeHTML(entry.nickname)}${entry.isMe?'<small>You</small>':''}</strong></span><span class="result-player-time" role="cell">${timeHTML(entry.seconds)}</span></div>`).join('');
  return `<ol class="result-podium" data-count="${first.length}" aria-label="Top ${first.length} players">${podium}</ol>${rows?`<div class="result-table" role="table" aria-label="More leaderboard records"><div class="result-table-head" role="row"><span role="columnheader">Rank</span><span role="columnheader">Player</span><span role="columnheader">Time</span></div><div class="result-table-rows" role="rowgroup" tabindex="0" aria-label="Leaderboard list">${rows}</div></div>`:''}`;
}
