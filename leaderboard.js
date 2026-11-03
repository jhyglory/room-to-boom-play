import { STAGE, normalizeSeconds, readBest, saveBest } from './records.js?v=0.32.1';

export const RANKING_RULESETS = Object.freeze([
  {stage:STAGE,label:'v0.32',current:true},
  {stage:'studio-single-hall16-v31',label:'v0.31'},
  {stage:'studio-billiards16-v30',label:'v0.30'},
  {stage:'studio-triple-top-swap16-v29',label:'v0.29'},
  {stage:'studio-triple-swap16-v28',label:'v0.28'},
  {stage:'studio-triple-half16-v27',label:'v0.27'},
].map(value=>Object.freeze(value)));
function rankingStage(value){
  if(!RANKING_RULESETS.some(rules=>rules.stage===value))throw new RangeError('Unsupported ranking rules');
  return value;
}

const PLAYER_KEY = 'room-to-boom:player-id';
const NAME_KEY = 'room-to-boom:nickname';
function remoteBase(value) {
  if(value==='')return '';
  let url;
  try{url=new URL(value);}catch{throw new TypeError('Invalid leaderboard API base');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)
    throw new TypeError('Invalid leaderboard API base');
  return url.href.replace(/\/+$/,'');
}
function validToken(value){return typeof value==='string'&&/^[A-Za-z0-9._~-]{1,512}$/.test(value);}
export function cleanNickname(value) {
  const text = String(value ?? '').normalize('NFC').replace(/\p{C}/gu, '').replace(/\s+/g, ' ').trim();
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
export function validateBoard(value, expectedStage = STAGE) {
  if (!value || value.stage !== expectedStage || value.scope !== 'server' || !Number.isSafeInteger(value.total) || value.total < 0 || !Array.isArray(value.top) || value.top.length !== Math.min(8,value.total)) throw new Error('Invalid leaderboard');
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
  constructor({storage,fetch:fetcher,timeoutMs=2500,serverEnabled=true,apiBase='',locks=globalThis.navigator?.locks}={}) {
    this.storage=storage;this.fetcher=fetcher;this.timeoutMs=timeoutMs;this.serverEnabled=serverEnabled;
    this.apiBase=remoteBase(apiBase);this.apiOrigin=this.apiBase?new URL(this.apiBase).origin:null;this.locks=locks;
    const authPrefix=this.apiOrigin?`room-to-boom:remote:${this.apiOrigin}:`:null;
    this.playerKey=authPrefix?`${authPrefix}player-id`:PLAYER_KEY;
    this.tokenKey=authPrefix?`${authPrefix}token`:null;
    this.pendingNameKey=authPrefix?`${authPrefix}pending-nickname`:null;
    const pendingName=this.pendingNameKey?this.read(this.pendingNameKey):null;
    this.pendingRemoteNickname=pendingName?cleanNickname(pendingName):null;
    if(pendingName&&this.pendingRemoteNickname!==pendingName)this.write(this.pendingNameKey,this.pendingRemoteNickname);
    const savedToken=this.tokenKey?this.read(this.tokenKey):null;
    this.token=validToken(savedToken)?savedToken:null;
    this.invalidStoredCredential=!!savedToken&&!validToken(savedToken);
    const savedPlayer=this.read(this.playerKey);
    this.playerId=savedPlayer||makeSubmissionId();this.write(this.playerKey,this.playerId);
    this.confirmedPlayerId=this.token&&savedPlayer?savedPlayer:null;
    this.outboxPrefix=`${authPrefix||'room-to-boom:cookie:'}finish:`;
    this.outboxEntries=new Map();this.volatileEntries=new Set();this.flushPromise=null;this.retryAfter=new Map();this.queuedNicknameEdits=0;
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
    if(this.apiBase){
      if(profile.token!==undefined){
        if(!validToken(profile.token))throw new Error('Invalid profile credential');
        this.token=profile.token;this.write(this.tokenKey,this.token);
      }
      if(!this.token)throw new Error('Missing profile credential');
    }
    this.playerId=profile.playerId;this.confirmedPlayerId=profile.playerId;this.write(this.playerKey,this.playerId);
    this.nickname=cleanNickname(profile.nickname);this.write(NAME_KEY,this.nickname);
    if(!['Player','플레이어'].includes(this.nickname)){this.hasNickname=true;this.write('room-to-boom:nickname-set','true');}
    // The bearer credential belongs only to this API origin's private storage.
    // Profile consumers and rendered boards receive public identity fields only.
    const {token,...publicProfile}=profile;
    this.profile={...publicProfile,nickname:this.nickname};return this.profile;
  }
  adoptBoard(board){
    if(board.playerId)this.adoptProfile({scope:'server',playerId:board.playerId,nickname:board.nickname??board.me?.nickname??this.nickname});
    else if(board.me)this.adoptProfile({scope:'server',playerId:board.me.playerId,nickname:board.me.nickname});
    const {token,...publicBoard}=board;
    return publicBoard;
  }
  enqueue(action){const pending=this.pending.then(action,action);this.pending=pending.catch(()=>{});return pending;}
  reloadRemoteIdentity(){
    if(!this.apiBase)return;
    const token=this.read(this.tokenKey);
    this.invalidStoredCredential=!!token&&!validToken(token);
    if(validToken(token)&&token!==this.token){
      this.token=token;this.profile=null;
      this.playerId=this.read(this.playerKey)||this.playerId;this.confirmedPlayerId=this.read(this.playerKey)||null;
    }
  }
  async ensureProfile({skipNameSync=false}={}){
    this.reloadRemoteIdentity();
    if(this.apiBase&&(this.invalidStoredCredential||!this.token&&this.restorePending().some(entry=>entry.playerId)))
      throw new Error('The saved player credential must be restored before pending finishes can authenticate');
    if(this.profile&&(skipNameSync||!this.pendingRemoteNickname))return this.profile;
    if(!this.profilePromise){
      const establish=async()=>{
        // Another tab may have established this browser's identity while this
        // tab was waiting. Reload inside the origin-wide lock before any GET.
        this.reloadRemoteIdentity();
        if(this.profile&&(skipNameSync||!this.pendingRemoteNickname))return this.profile;
        const preferredName=this.hasNickname?this.nickname:null;
        const incoming=await this.request('./api/profile');
        // Reusing an explicit nickname for a newly issued anonymous identity
        // does not import any local time or turn a rename into a completion.
        if(this.apiBase&&incoming.token!==undefined&&preferredName&&!this.pendingRemoteNickname&&preferredName!==cleanNickname(incoming.nickname)){
          this.pendingRemoteNickname=preferredName;this.write(this.pendingNameKey,preferredName);
        }
        this.adoptProfile(incoming);
        if(this.apiBase&&this.pendingRemoteNickname&&!skipNameSync){
          try{
            this.adoptProfile(await this.request('./api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:this.pendingRemoteNickname})}));
            this.pendingRemoteNickname=null;this.write(this.pendingNameKey,'');
          }catch(error){this.profile=null;throw error;}
        }
        return this.profile;
      };
      const pending=this.apiBase&&typeof this.locks?.request==='function'
        ?this.locks.request(`room-to-boom:identity:${this.apiOrigin}`,establish):establish();
      this.profilePromise=Promise.resolve(pending).finally(()=>{this.profilePromise=null;});
    }
    return this.profilePromise;
  }
  localBoard(seconds,{stage=STAGE}={}) {
    rankingStage(stage);
    const current=stage===STAGE,known=readBest(this.storage,stage),given=current?normalizeSeconds(seconds):null;
    const candidates=[known,given,...(!this.serverEnabled&&current?[this.deviceBest]:[])].filter(value=>value!==null);
    const best=candidates.length?Math.min(...candidates):null;
    const me=best===null?null:{rank:1,position:1,tied:false,playerId:this.playerId,nickname:this.nickname,seconds:best,isMe:true};
    return {scope:'browser',stage,total:me?1:0,top:me?[me]:[],me,persisted:known!==null&&(this.serverEnabled||known===best)};
  }
  async request(path,options={}, {anonymous=false}={}) {
    if(!this.serverEnabled)throw new Error('Server requests are disabled');
    if(typeof this.fetcher!=='function')throw new Error('Server unavailable');
    if(anonymous&&(!path.startsWith('./api/leaderboard?')||options.method&&options.method!=='GET'))throw new TypeError('Public access is read-only');
    let target=path,requestOptions={...options,credentials:'same-origin'};
    if(this.apiBase){
      if(typeof path!=='string'||!path.startsWith('./api/'))throw new TypeError('Invalid leaderboard API path');
      const url=new URL(path,`${this.apiBase}/`),prefix=`${new URL(this.apiBase).pathname.replace(/\/+$/,'')}/api/`;
      if(url.origin!==this.apiOrigin||!url.pathname.startsWith(prefix))throw new TypeError('Invalid leaderboard API path');
      target=url.href;
      const headers=new Headers(options.headers);
      headers.delete('Authorization');
      if(this.token&&!anonymous)headers.set('Authorization',`Bearer ${this.token}`);
      requestOptions={...options,headers:Object.fromEntries(headers),credentials:'omit',cache:'no-store'};
    }
    const controller=new AbortController();let timer;
    try {
      const response=await Promise.race([
        this.fetcher(target,{...requestOptions,signal:controller.signal}),
        new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Request timed out'));},this.timeoutMs);}),
      ]);
      if(!response.ok)throw new Error(`Request failed (${response.status})`);
      return await Promise.race([response.json(),new Promise((_,reject)=>{
        clearTimeout(timer);timer=setTimeout(()=>{controller.abort();reject(new Error('Response timed out'));},this.timeoutMs);
      })]);
    } finally {clearTimeout(timer);}
  }
  async publicBoard(stage,extra={}) {
    // A failed personal proof must not hide everybody else's public records.
    // Keep that proof unchanged: only an explicit authenticated operation can
    // identify this browser, and this read must never mint another player.
    const board=validateBoard(await this.request(`./api/leaderboard?stage=${encodeURIComponent(stage)}`,{}, {anonymous:true}),stage);
    return {...board,identityWarning:true,...extra};
  }
  // Pending entries are individual origin-scoped keys. Two tabs appending
  // different real finishes cannot overwrite a shared JSON-array catalog.
  outboxKey(submissionId){return this.outboxPrefix+encodeURIComponent(submissionId);}
  parsePending(raw){
    try{
      const entry=JSON.parse(raw);
      if(!entry||entry.schema!==1||!RANKING_RULESETS.some(r=>r.stage===entry.stage)||
        typeof entry.submissionId!=='string'||!/^[A-Za-z0-9_.:-]{8,128}$/.test(entry.submissionId)||
        normalizeSeconds(entry.seconds)!==entry.seconds||typeof entry.nickname!=='string'||cleanNickname(entry.nickname)!==entry.nickname||
        entry.playerId!==null&&(typeof entry.playerId!=='string'||!entry.playerId)||!Number.isFinite(entry.createdAt))return null;
      return entry;
    }catch{return null;}
  }
  persistPending(entry){
    const copy={...entry};this.outboxEntries.set(entry.submissionId,copy);
    const persisted=this.write(this.outboxKey(entry.submissionId),JSON.stringify(copy));
    if(persisted)this.volatileEntries.delete(entry.submissionId);else this.volatileEntries.add(entry.submissionId);
    return persisted;
  }
  removePending(submissionId){
    const key=this.outboxKey(submissionId);
    try{if(typeof this.storage?.removeItem==='function')this.storage.removeItem(key);else this.storage?.setItem(key,'');}catch{}
    this.outboxEntries.delete(submissionId);this.volatileEntries.delete(submissionId);this.retryAfter.delete(submissionId);
  }
  restorePending({stage}={}){
    if(stage!==undefined)rankingStage(stage);
    if(!this.serverEnabled)return [];
    try{
      for(let index=0;index<this.storage.length;index++){
        const key=this.storage.key(index);if(typeof key!=='string'||!key.startsWith(this.outboxPrefix))continue;
        const entry=this.parsePending(this.read(key));
        if(entry&&key===this.outboxKey(entry.submissionId))this.outboxEntries.set(entry.submissionId,entry);
      }
    }catch{/* A blocked store still permits this session's volatile entries. */}
    for(const [id]of this.outboxEntries){
      const stored=this.parsePending(this.read(this.outboxKey(id)));
      if(stored)this.outboxEntries.set(id,stored);
      else if(!this.volatileEntries.has(id))this.outboxEntries.delete(id);
    }
    return [...this.outboxEntries.values()].filter(entry=>stage===undefined||entry.stage===stage)
      .sort((a,b)=>a.createdAt-b.createdAt||a.submissionId.localeCompare(b.submissionId))
      .map(({schema,...entry})=>({...entry}));
  }
  get pendingCount(){return this.restorePending().length;}
  async sendPending(entry){
    const send=async()=>{
      const latest=this.restorePending().find(value=>value.submissionId===entry.submissionId);
      if(!latest)return null; // Another tab already received the same acknowledgement.
      entry={schema:1,...latest};
      const startName=this.hasNickname?cleanNickname(this.pendingRemoteNickname||this.read(NAME_KEY)||this.nickname):null;
      const laterName=startName&&startName!==entry.nickname&&startName!==entry.nameAtCreation?startName:null;
      try{
        // A cosmetic preferred-name retry must never block an actual finish.
        // The immutable record payload itself can establish its saved name.
        await this.ensureProfile({skipNameSync:true});
        // Reload after the asynchronous handshake: another tab may have bound
        // this receipt while it was waiting for the shared identity lock.
        const current=this.restorePending().find(value=>value.submissionId===entry.submissionId);
        if(!current)return null;
        entry={schema:1,...current};
        if(entry.playerId&&entry.playerId!==this.playerId)throw new Error('Pending finish belongs to another authenticated player');
        if(!entry.playerId){entry={...entry,playerId:this.playerId};this.persistPending(entry);}
        const data=await this.request('./api/records',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({stage:entry.stage,seconds:entry.seconds,nickname:entry.nickname,submissionId:entry.submissionId})});
        let board=validateBoard(data,entry.stage);
        if(!board.persisted||(board.playerId||board.me?.playerId)!==entry.playerId)throw new Error('Completion acknowledgement has no matching authenticated owner');
        const desired=this.pendingRemoteNickname||laterName;
        if(this.pendingRemoteNickname&&(board.nickname??board.me?.nickname)===this.pendingRemoteNickname){
          this.pendingRemoteNickname=null;if(this.pendingNameKey)this.write(this.pendingNameKey,'');
        }
        const acknowledgement={isNewBest:board.isNewBest,replayed:board.replayed};
        this.removePending(entry.submissionId);
        // A new receipt may commit after a later rename. Keep the receipt's
        // immutable name for idempotency, then restore the explicit new name.
        if(!this.queuedNicknameEdits&&desired&&desired!==entry.nickname&&desired!==entry.nameAtCreation){
          this.pendingRemoteNickname=desired;if(this.pendingNameKey)this.write(this.pendingNameKey,desired);
          try{
            this.adoptProfile(await this.request('./api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:desired})}));
            this.pendingRemoteNickname=null;if(this.pendingNameKey)this.write(this.pendingNameKey,'');
            board={...validateBoard(await this.request(`./api/leaderboard?stage=${encodeURIComponent(entry.stage)}`),entry.stage),...acknowledgement};
          }catch{board={...board,nicknamePending:true};}
        }
        return this.adoptBoard(board);
      }catch{
        this.profile=null;this.retryAfter.set(entry.submissionId,Date.now()+1000);
        const extra={syncError:true,submissionPending:true,pendingDurable:!this.volatileEntries.has(entry.submissionId)};
        if(this.apiBase){try{return await this.publicBoard(entry.stage,extra);}catch{}}
        return {...this.localBoard(entry.stage===STAGE?entry.seconds:null,{stage:entry.stage}),...extra};
      }
    };
    // Profile establishment keeps its origin-wide Web Lock. Concurrent tabs
    // may replay this immutable receipt safely through server idempotency.
    return send();
  }
  async flushEntries({stage,limit=16,force=false}={}){
    const maximum=Math.max(1,Math.min(16,Math.trunc(limit)||16)),boards=[];
    let submittedCount=0,failedCount=0;
    for(const entry of this.restorePending({stage}).slice(0,maximum)){
      if(!force&&(this.retryAfter.get(entry.submissionId)||0)>Date.now())continue;
      const board=await this.sendPending(entry);
      if(!board)continue;
      if(board.syncError){failedCount++;break;} // One failed network round is enough for this trigger.
      submittedCount++;boards.push(board);
    }
    return {pendingCount:this.pendingCount,submittedCount,failedCount,boards};
  }
  flushPending(options={}){
    if(options.stage!==undefined)rankingStage(options.stage);
    if(this.flushPromise)return this.flushPromise;
    const promise=this.enqueue(()=>this.flushEntries(options));
    this.flushPromise=promise;
    void promise.finally(()=>{if(this.flushPromise===promise)this.flushPromise=null;}).catch(()=>{});
    return promise;
  }
  submit(seconds,{submissionId=makeSubmissionId(),nickname}={}) {
    const value=normalizeSeconds(seconds);
    if(value===null)return Promise.reject(new RangeError('Invalid completion time'));
    if(typeof submissionId!=='string'||!/^[A-Za-z0-9_.:-]{8,128}$/.test(submissionId))return Promise.reject(new RangeError('Invalid submission ID'));
    const previous=this.submissions.get(submissionId);
    if(previous){
      if(previous.seconds!==value)return Promise.reject(new Error('Submission already used'));
      return previous.promise;
    }
    let entry;
    if(this.serverEnabled){
      const existing=this.restorePending().find(item=>item.submissionId===submissionId);
      if(existing&&(existing.seconds!==value||existing.stage!==STAGE))return Promise.reject(new Error('Submission already used'));
      // This synchronous write precedes profile establishment, fetch and the
      // first await, so Retry or reload cannot erase a completed event.
      entry=existing?{schema:1,...existing}:{schema:1,submissionId,stage:STAGE,seconds:value,
        nickname:cleanNickname(nickname??this.pendingRemoteNickname??this.nickname),
        nameAtCreation:cleanNickname(this.pendingRemoteNickname??this.nickname),
        playerId:this.confirmedPlayerId,createdAt:Date.now()};
      this.persistPending(entry);
    }
    const promise=this.enqueue(async()=>{
      if(!this.serverEnabled){
        if(nickname!==undefined)this.setNickname(nickname);
        const previous=this.localBoard(null).me?.seconds??null;
        saveBest(this.storage,value);
        this.deviceBest=previous===null?value:Math.min(previous,value);
        return {...this.localBoard(value),isNewBest:previous===null||value<previous};
      }
      return await this.sendPending(entry)||this.refreshBoard(value,STAGE);
    });
    this.submissions.set(submissionId,{seconds:value,promise});
    void promise.then(board=>{if(board.syncError&&this.submissions.get(submissionId)?.promise===promise)this.submissions.delete(submissionId);});
    if(this.submissions.size>64)this.submissions.delete(this.submissions.keys().next().value);
    return promise;
  }

  updateNickname(value,{seconds=null,localOnly=false,stage=STAGE}={}) {
    rankingStage(stage);
    const name=cleanNickname(value);
    this.queuedNicknameEdits++;
    // An explicit valid edit supersedes a failed legacy preferred-name sync.
    // Establish identity without first retrying that obsolete name.
    if(!localOnly&&this.serverEnabled){this.pendingRemoteNickname=name;if(this.pendingNameKey)this.write(this.pendingNameKey,name);}
    const pending=this.enqueue(async()=>{
      try{
        if(localOnly||!this.serverEnabled){this.setNickname(name);return {...this.localBoard(seconds,{stage}),profileSaved:'browser'};}
        await this.ensureProfile({skipNameSync:true});
        const profile=await this.request('./api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:name})});
        const saved=this.adoptProfile(profile);this.setNickname(saved.nickname);
        if(this.pendingRemoteNickname===name){this.pendingRemoteNickname=null;if(this.pendingNameKey)this.write(this.pendingNameKey,'');}
        const board=this.adoptBoard(validateBoard(await this.request(`./api/leaderboard?stage=${encodeURIComponent(stage)}`),stage));
        return {...board,profileSaved:'server'};
      }catch(error){
        // An unsuccessful edit is not a saved name. Cancel/Retry must not
        // silently publish it later or keep blocking the next real finish.
        if(this.pendingRemoteNickname===name){this.pendingRemoteNickname=null;if(this.pendingNameKey)this.write(this.pendingNameKey,'');}
        throw error;
      }finally{this.queuedNicknameEdits--;}
    });
    return pending;
  }
  async refreshBoard(seconds,stage){
    if(!this.serverEnabled)return this.localBoard(seconds,{stage});
    try {await this.ensureProfile();return this.adoptBoard(validateBoard(await this.request(`./api/leaderboard?stage=${encodeURIComponent(stage)}`),stage));}
    catch {
      this.profile=null;
      if(this.apiBase){try{return await this.publicBoard(stage);}catch{}}
      return {...this.localBoard(seconds,{stage}),syncError:true};
    }
  }
  refresh(seconds,{stage=STAGE,force=false}={}) {
    rankingStage(stage);
    return this.enqueue(async()=>{
      if(!this.serverEnabled)return this.localBoard(seconds,{stage});
      await this.flushEntries({stage,force});
      const board=await this.refreshBoard(seconds,stage),pendingCount=this.pendingCount;
      return pendingCount?{...board,submissionPending:true,pendingCount}:board;
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
  const actual=board.top,personal=board.scope==='browser';
  if(!actual.length)return personal?'<p class="result-empty">No saved record in this browser yet.</p>'
    :'<p class="result-empty">No records yet. Be the first to finish!</p>';
  const first=actual.slice(0,3),order=first.length>=2?[1,0,...(first.length===3?[2]:[])]:[0];
  const podium=order.map(index=>{
    const entry=first[index],modifier=['first','second','third'][index];
    return `<li class="result-podium-place result-podium-${modifier}${entry.isMe?' is-self':''}" data-player-id="${escapeHTML(entry.playerId)}"${entry.isMe?' aria-current="true"':''}><span class="result-podium-medal">${personal?'PB':entry.rank}</span>${entry.tied?`<span class="result-tie-label">${rankLabel(entry)}</span>`:''}${avatarHTML(entry)}<strong class="result-player-name">${escapeHTML(entry.nickname)}${entry.isMe?'<small>You</small>':''}</strong><span class="result-player-time">${timeHTML(entry.seconds)}</span></li>`;
  }).join('');
  const rows=actual.slice(3).map(entry=>`<div class="result-table-row${entry.isMe?' is-self':''}" role="row" data-player-id="${escapeHTML(entry.playerId)}"${entry.isMe?' aria-current="true"':''}><span class="result-rank-number" role="cell">${rankLabel(entry)}</span><span class="result-table-player" role="cell">${avatarHTML(entry)}<strong class="result-player-name">${escapeHTML(entry.nickname)}${entry.isMe?'<small>You</small>':''}</strong></span><span class="result-player-time" role="cell">${timeHTML(entry.seconds)}</span></div>`).join('');
  return `<ol class="result-podium" data-count="${first.length}" aria-label="${personal?'Personal best on this browser':`Top ${first.length} players`}">${podium}</ol>${rows?`<div class="result-table" role="table" aria-label="More leaderboard records"><div class="result-table-head" role="row"><span role="columnheader">Rank</span><span role="columnheader">Player</span><span role="columnheader">Time</span></div><div class="result-table-rows" role="rowgroup" tabindex="0" aria-label="Leaderboard list">${rows}</div></div>`:''}`;
}
