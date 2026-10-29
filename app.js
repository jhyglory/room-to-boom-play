import { MovingWorld, PHYSICS, FURNITURE, TOTAL_FURNITURE, WORLD } from './engine.js?v=0.19.0';
import { GameRenderer } from './render.js?v=0.19.0';
import { RunClock, formatSeconds } from './clock.js';
import { readBest, saveBest, parseChallenge, buildChallengeUrl, shareResult } from './records.js?v=0.19.0';
import { GameAudio } from './audio.js?v=0.18.1';
import { ImpactPresentation } from './impact-presentation.js?v=0.12.0';
import { LeaderboardClient, makeSubmissionId, renderLeaderboardHTML, rankLabel } from './leaderboard.js?v=0.19.0';
import { LEADERBOARD_MODE } from './runtime-config.js?v=0.19.0';

function storage(){try{return window.localStorage;}catch{return null;}}
function readSetting(key){try{return storage()?.getItem(key);}catch{return null;}}
function saveSetting(key,value){try{storage()?.setItem(key,value);}catch{}}

const $ = id => document.getElementById(id);
const canvas = $('game');
const world = new MovingWorld();
const renderer = new GameRenderer(canvas, world);
const playButton = $('play');
const playMarkup = playButton.innerHTML;
let artReady = false;
playButton.disabled = true;
playButton.setAttribute('aria-busy','true');
playButton.textContent = 'LOADING ART…';
renderer.ctx.fillStyle = '#E9E8DB';
renderer.ctx.fillRect(0,0,canvas.width,canvas.height);
try {
  await renderer.ready;
  if (document.fonts?.load) {
    await document.fonts.ready;
    const faces=await Promise.all([
      document.fonts.load('700 24px "Fredoka"'),
      document.fonts.load('800 30px "Nunito"'),
    ]);
    if(faces.some(loaded=>!loaded.length))throw new Error('The UI fonts could not load.');
    canvas.setAttribute('data-fonts-ready','true');
  }
  artReady = true;
  playButton.innerHTML = playMarkup;
} catch {
  playButton.textContent = 'ART LOAD FAILED · RELOAD';
  $('announcer').textContent = 'The game artwork or fonts could not load. Reload to try again.';
}
playButton.disabled = false;
playButton.setAttribute('aria-busy','false');
const impactPresentation = new ImpactPresentation();
const clock = new RunClock();
let phase = 'menu';
let reducedMotion = readSetting('room-to-boom:motion') === 'true' || (readSetting('room-to-boom:motion') !== 'false' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let muted = readSetting('room-to-boom:muted') === 'true';
const audio = new GameAudio({muted,onStateChange:updateSound});
const leaderboard = new LeaderboardClient({storage:storage(),fetch:window.fetch?.bind(window),serverEnabled:LEADERBOARD_MODE!=='device'});
let best = readBest(storage());
const pageUrl = window.location?.href || 'https://room-to-boom.tart-gecko-8925.chatgpt.site/';
const challenge = parseChallenge(pageUrl);
let resultSeconds = null;
let runVersion = 0;
let pointerId = null;
let lastFrame = performance.now();
let accumulator = 0;
let physicsNow = null;
let restartWasRunning = false;
let lastItemId = null;
let hintUntil = 0;
let nextHintUpdate = 0;
let resultBoard = null;
let resultSubmissionId = null;
let resultWasNewBest = false;
let nicknameEditing = false;
let nicknameSaving = false;
let leaderboardSyncing = false;
const diagnosticImpacts=[];
const itemNames = Object.fromEntries(FURNITURE.map(item=>[item.id,item.name]));
const STEP = PHYSICS.stepMs;
// Keep reference-world speed units, then add the real material and mass
// context so each contact has an audible character and impact strength.
const REFERENCE_WORLD_SCALE = 760 / 540; // Keep physical audio units independent of the portrait camera.

function announce(message){$('announcer').textContent=message;}
function updateBest(){
  $('best-time').textContent=best===null?'—':`${best.toFixed(2)}s`;
  $('best-time').classList.toggle('long-time',best!==null&&best>=100);
  $('best-time').classList.toggle('very-long-time',best!==null&&best>=1000);
  $('best-time').classList.toggle('extra-long-time',best!==null&&best>=10000);
}
function updateSound(){
  const status=audio.status;
  const states={
    muted:['SOUND OFF','Enable sound','Sound is off by your saved preference.'],
    unsupported:['NO AUDIO','Disable sound preference; audio is unavailable in this browser','This browser does not provide game audio.'],
    paused:['SOUND PAUSED','Mute sound; audio is paused','Sound is enabled in your preferences and will resume with the game.'],
    unlocking:['ENABLING…','Enabling sound','Waiting for the browser to enable audio.'],
    blocked:['SOUND RETRY','Retry sound','Your browser did not start audio. Tap to try again.'],
    locked:['TAP SOUND','Enable sound','Tap to enable audio and hear a confirmation.'],
    ready:['SOUND ON','Mute sound','Audio is running. Tap to mute.'],
  };
  const [caption,action,description]=states[status];
  const label=$('sound-label');
  if(label)label.textContent=caption;
  else $('sound').textContent=caption;
  $('sound').setAttribute('aria-pressed',String(!muted));
  $('sound').setAttribute('aria-label',action);
  $('sound').setAttribute('title',description);
  $('sound').setAttribute('data-audio-state',status);
  $('sound').setAttribute('data-audio-context',audio.context?.state||'none');
  $('sound').setAttribute('data-audio-error',audio.lastError?.name||'');
}
function activateSound(cue='enable',{resume=false}={}){
  if(muted||document.hidden||phase==='paused'){updateSound();return;}
  void audio.gesture(cue,{resume}).then(updateSound);
}

function clearResult(){
  runVersion++;resultSeconds=null;
  resultBoard=null;resultSubmissionId=null;
  resultWasNewBest=false;
  nicknameEditing=false;nicknameSaving=false;leaderboardSyncing=false;
  paintCompletionRecord();
  $('result-load-state').textContent='';
  $('share-status').textContent='';$('manual-share').hidden=true;
  $('share-result').disabled=false;
}
function updateTimer(now){
  const [whole,fraction] = formatSeconds(clock.read(now)).split('.');
  $('timer').classList.toggle('long-time',whole.length>=3);
  $('timer').classList.toggle('very-long-time',whole.length>=4);
  $('timer').classList.toggle('extra-long-time',whole.length>=5);
  $('timer').innerHTML=`${whole.padStart(2,'0')}<span class="time-small">.${fraction}</span><span class="time-unit">s</span>`;
}
function updateProgress(){
  $('moved').textContent=world.moved;
  $('progress').style.width=`${world.moved/TOTAL_FURNITURE*100}%`;
  for(const body of world.bodies){
    const row=document.querySelector(`[data-item="${body.game.id}"]`);
    row?.classList.toggle('done',body.game.delivered);
  }
}
function updateDeliveryHint(now){
  if(phase!=='playing'||now<nextHintUpdate||now<hintUntil)return;
  nextHintUpdate=now+150;
  const remaining=world.bodies.filter(body=>!body.game.delivered);
  const body=remaining.length===1?remaining[0]:world.bodies.find(body=>body.game.id===lastItemId);
  if(!body||body.game.delivered)return;
  const name=itemNames[body.game.id]||body.game.id;
  const state=body.game.deliveryState;
  if(state==='settling'){
    const percent=Math.min(100,Math.round((body.game.settled||0)/5));
    $('live-hint').textContent=`${name} is inside · settling ${percent}%. Let it come to rest.`;
  }else if(state==='outside'&&remaining.length===1){
    $('live-hint').textContent=`${name} is the last piece. Put its whole body inside the upstairs mint floor.`;
  }
}
function isRankingScreen(){return phase==='complete'||phase==='rankings';}
function showPhase(){
  document.body.setAttribute('data-phase',phase);
  if(phase!=='playing'&&!window.matchMedia('(min-width: 740px)').matches)$('game-settings').open=false;
  $('start-overlay').classList.toggle('hidden',phase!=='menu');
  $('pause-overlay').classList.toggle('hidden',phase!=='paused');
  $('result-overlay').classList.toggle('hidden',!isRankingScreen());
  $('result-overlay').classList.toggle('ranking-only',phase==='rankings');
  $('retry-result').hidden=phase==='rankings';
  $('share-result').hidden=phase!=='complete';
  $('result-main').hidden=phase!=='rankings';
  $('result-ranked-best').hidden=phase!=='rankings';
  paintCompletionRecord();
  document.body.classList.toggle('showing-result',isRankingScreen());
  $('result-overlay').setAttribute('aria-hidden',String(!isRankingScreen()));
  $('result-overlay').setAttribute('aria-labelledby',phase==='rankings'?'rankings-title':'result-title');
  $('pause').disabled=phase!=='playing';
  $('board-hint').style.display=phase==='playing'&&!clock.started?'block':'none';
}
function release(){
  world.release();
  canvas.classList.remove('dragging');
  const captured=pointerId;
  pointerId=null;
  if(captured!==null){
    try{if(canvas.hasPointerCapture(captured))canvas.releasePointerCapture(captured);}catch{}
  }
}
function start(){
  if(!artReady){window.location?.reload?.();return;}
  phase='playing';
  activateSound('enable',{resume:true});
  showPhase();
  lastFrame=performance.now();
  accumulator=0;
  $('live-hint').textContent='Packed tight. Light pieces fly; heavy pieces need a stronger pull.';
  announce(`Move all ${TOTAL_FURNITURE} pieces from the lower old room into the upstairs mint home. Every visible wall can break. Pull down to launch up. The timer starts on your first grab.`);
}
function reset(){
  clearResult();audio.cancelPending();
  release();world.reset();diagnosticImpacts.length=0;clock.reset();renderer.clearEffects();impactPresentation.clear();
  accumulator=0;lastFrame=performance.now();phase='playing';lastItemId=null;hintUntil=0;nextHintUpdate=0;
  activateSound('enable',{resume:true});
  updateProgress();updateTimer(performance.now());showPhase();
  $('live-hint').textContent='Fresh start. Same beautiful chaos.';
  announce(`Restarted. Zero of ${TOTAL_FURNITURE} moved.`);
}
function pause(){
  if(phase!=='playing')return;
  const now=performance.now();
  advanceSimulation(now);
  if(phase!=='playing')return;
  release();clock.pause(now);updateTimer(now);phase='paused';accumulator=0;impactPresentation.clear();void audio.suspend();
  showPhase();$('resume').focus();
}
function resume(){
  if(phase!=='paused')return;
  clock.resume(performance.now());phase='playing';lastFrame=performance.now();accumulator=0;
  activateSound('enable',{resume:true});
  showPhase();
}
function paintNickname(){
  $('result-name-display').hidden=nicknameEditing;
  $('result-nickname-form').hidden=!nicknameEditing;
  $('result-player-name').textContent=resultBoard?.me?.nickname??leaderboard.nickname;
  $('result-name-edit').disabled=nicknameSaving||leaderboardSyncing;
  $('result-name-save').disabled=nicknameSaving||leaderboardSyncing;
  $('result-name-cancel').disabled=nicknameSaving;
  $('result-name-cancel').hidden=false;
  $('result-nickname').disabled=nicknameSaving;
}
function paintLeaderboard(board){
  resultBoard=board;
  // A server refresh or a profile rename can reveal a faster saved best too.
  // It updates the auxiliary record, never this run or the ranking entries.
  if(board.me && (best===null||board.me.seconds<best)){
    best=board.me.seconds;saveBest(storage(),best);updateBest();
  }
  $('result-board').innerHTML=renderLeaderboardHTML(board);
  $('result-board').setAttribute('data-count',String(board.top.length));
  $('result-scope').textContent=board.scope==='server'?'This server':'On this device';
  $('result-total').textContent=`${board.total} ${board.total===1?'player':'players'}`;
  $('result-my-rank').textContent=board.me?`${rankLabel(board.me)} / ${board.total}`:'No rank yet';
  $('result-my-time').textContent=board.me?`${board.me.seconds.toFixed(2)}s`:'—';
  $('result-sync-state').textContent=board.syncError?'Offline. Showing your saved record on this device.':'';
  $('result-load-state').textContent=board.syncError?'Offline. Showing your saved record on this device.':'';
  paintCompletionRecord();
  paintNickname();
}
function setNewBestBadge(enabled){
  $('result-badge').textContent=enabled?'NEW BEST!':'';
  $('result-badge').hidden=!enabled;
  $('result-badge').classList.toggle('new-best',enabled);
}
function paintCompletionRecord(){
  const completed=phase==='complete'&&resultSeconds!==null;
  const isNewBest=completed&&resultWasNewBest&&best===resultSeconds;
  $('result-current-record').hidden=!completed;
  // This immutable elapsed result is never replaced by a leaderboard best.
  $('result-time').textContent=completed?resultSeconds.toFixed(2):'—';
  $('result-current-time').classList.toggle('long-time',completed&&resultSeconds>=1000);
  $('result-current-time').classList.toggle('very-long-time',completed&&resultSeconds>=10000);
  $('result-personal-best-time').textContent=best===null?'—':`${best.toFixed(2)}s`;
  $('result-personal-best').hidden=!completed||isNewBest||best===null;
  setNewBestBadge(isNewBest&&(!leaderboard.serverEnabled||!leaderboardSyncing));
}
async function syncLeaderboard(){
  if(phase!=='complete'||resultSeconds===null||leaderboardSyncing)return;
  const version=runVersion;
  leaderboardSyncing=true;paintNickname();paintCompletionRecord();
  // A completion submits its own elapsed time. Browser bests may belong to an
  // older cookie; only the server can compare its authenticated player's best.
  const board=await leaderboard.submit(resultSeconds,{submissionId:resultSubmissionId});
  if(version!==runVersion||phase!=='complete')return;
  if(board.scope==='server')resultWasNewBest=resultWasNewBest&&board.isNewBest===true&&board.me?.seconds===resultSeconds;
  leaderboardSyncing=false;
  paintLeaderboard(board);
}
function editNickname(){
  if(!isRankingScreen()||nicknameSaving||leaderboardSyncing)return;
  nicknameEditing=true;$('result-nickname').value=leaderboard.hasNickname?leaderboard.nickname:'';
  $('result-name-status').textContent='';paintNickname();$('result-nickname').focus();
}
async function saveNickname(){
  if(!isRankingScreen()||nicknameSaving||leaderboardSyncing||!nicknameEditing)return;
  const version=runVersion,name=$('result-nickname').value;
  if(!name.trim()){$('result-name-status').textContent='Enter a name.';$('result-nickname').focus();return;}
  nicknameSaving=true;$('result-name-status').textContent='Saving…';paintNickname();
  try {
    const board=await leaderboard.updateNickname(name,{seconds:resultSeconds,localOnly:resultBoard?.scope==='browser'});
    if(version!==runVersion||!isRankingScreen())return;
    nicknameEditing=false;nicknameSaving=false;paintLeaderboard(board);
    $('result-name-status').textContent=board.profileSaved==='browser'?'Name saved on this device.':'Name saved.';
  }catch{
    if(version!==runVersion||!isRankingScreen())return;
    nicknameSaving=false;paintNickname();
    $('result-name-status').textContent='Could not confirm the save. Please try again.';
  }
}
async function openRankings(){
  if(phase!=='menu')return;
  clearResult();release();phase='rankings';
  nicknameEditing=false;nicknameSaving=false;leaderboardSyncing=true;
  $('result-name-status').textContent='';setNewBestBadge(false);
  $('challenge-result').hidden=true;
  paintLeaderboard(leaderboard.localBoard(null));
  $('result-load-state').textContent='Loading rankings…';
  showPhase();$('result-main').focus();
  const version=runVersion;
  // Browsing the board never starts the clock or creates a completion.
  const board=await leaderboard.refresh(null);
  if(version!==runVersion||phase!=='rankings')return;
  leaderboardSyncing=false;paintLeaderboard(board);
  announce('Rankings loaded.');
}
function goMain(){
  clearResult();audio.cancelPending();release();world.reset();diagnosticImpacts.length=0;clock.reset();
  renderer.clearEffects();impactPresentation.clear();accumulator=0;
  lastFrame=performance.now();phase='menu';lastItemId=null;hintUntil=0;nextHintUpdate=0;
  void audio.suspend();updateProgress();updateTimer(performance.now());showPhase();
  $('live-hint').textContent='Launch opposite to your pull. Time is the only score.';
  announce('Main menu. Your best record is saved.');$('play').focus();
}
function finish(){
  if(phase!=='playing')return;
  const result=clock.finish(physicsNow ?? performance.now());
  release();phase='complete';accumulator=0;impactPresentation.clear();
  resultSeconds=Number(formatSeconds(result));
  const storedBest=readBest(storage());
  if(storedBest!==null)best=best===null?storedBest:Math.min(best,storedBest);
  const previousBest=best;
  best=best===null?resultSeconds:Math.min(best,resultSeconds);
  const saved=saveBest(storage(),best);
  if(saved.best!==null)best=Math.min(best,saved.best);
  const isNewBest=resultSeconds===best&&(previousBest===null||resultSeconds<previousBest);
  updateBest();
  resultWasNewBest=isNewBest;
  setNewBestBadge(isNewBest);
  $('challenge-result').hidden=!challenge;
  if(challenge){
    const delta=Number((resultSeconds-challenge.seconds).toFixed(2));
    $('challenge-result').textContent=delta<0?`YOU BEAT ${challenge.seconds.toFixed(2)}s BY ${Math.abs(delta).toFixed(2)}s!`:delta===0?`A PERFECT TIE AT ${challenge.seconds.toFixed(2)}s!`:`${delta.toFixed(2)}s TO CATCH YOUR FRIEND. ONE MORE?`;
  }
  audio.play('finish');
  updateTimer(performance.now());showPhase();
  resultSubmissionId=makeSubmissionId();
  nicknameEditing=false;nicknameSaving=false;leaderboardSyncing=false;
  $('result-nickname').value=leaderboard.hasNickname?leaderboard.nickname:'';
  $('result-name-status').textContent='';
  paintLeaderboard(leaderboard.localBoard(best));
  void syncLeaderboard();
  $('live-hint').textContent='All home. Ready for another run?';
  announce(`Move complete in ${formatSeconds(result)} seconds.`);
  $('retry-result').focus();
}
function requestRestart(){
  if(phase==='menu'){start();return;}
  if(!clock.started||phase==='complete'){reset();return;}
  restartWasRunning=phase==='playing';
  if(restartWasRunning)pause();
  $('restart-dialog').returnValue='';
  $('restart-dialog').showModal();
}

world.onDeliver = body => {
  audio.play('deliver',world.moved);
  renderer.addBurst(body.position.x,body.position.y,'#79bda0',14);
  updateProgress();
  const remaining=TOTAL_FURNITURE-world.moved;
  $('live-hint').textContent=remaining===0?'Everybody is home!':`${remaining} more ${remaining===1?'piece':'pieces'} to make it home.`;
  announce(`${itemNames[body.game.id]||body.game.id} moved. ${world.moved} of ${TOTAL_FURNITURE}.`);
  if(world.moved===TOTAL_FURNITURE)finish();
};
function observeWallImpact(type,wall,info){
  if(!completionQA)return;
  diagnosticImpacts.push({type,atMs:world.elapsedMs,wallId:wall.game.id,bodyId:info.bodyId,point:info.point?{...info.point}:null,speed:info.speed,energy:info.energy,damage:info.damage,remainingHealth:info.remainingHealth,broken:!!info.broken});
  if(diagnosticImpacts.length>128)diagnosticImpacts.shift();
}
world.onBreak = (wall, info = {}) => {
  observeWallImpact('break',wall,info);
  const referenceSpeed=(Number.isFinite(info.speed)?info.speed:0)/REFERENCE_WORLD_SCALE;
  audio.collision(referenceSpeed,{broken:true,point:info.point,sourceId:`${info.bodyId||'piece'}:${wall.game?.id}`,bodyId:info.bodyId,firstCrack:info.firstCrack,damaged:info.damage>0,impactEnergy:info.energy,bounce:info.restitution,wall:true,material:info.material,heavy:info.heavy,kind:info.kind});
  renderer.addWallBreak(wall,{...info,referenceSpeed});
  impactPresentation.hit(performance.now(),{...info,broken:true},reducedMotion);
  hintUntil=performance.now()+1200;
  $('live-hint').textContent='CRASH! Keep going — every wall can break.';
  announce('Wall smashed. A new way through is open.');
};
world.onWallHit = (wall, info = {}) => {
  if(info.broken)return;
  observeWallImpact('hit',wall,info);
  const referenceSpeed=(Number.isFinite(info.speed)?info.speed:0)/REFERENCE_WORLD_SCALE;
  impactPresentation.hit(performance.now(),info,reducedMotion);
  renderer.addWallHit(wall,{...info,referenceSpeed});
  audio.collision(referenceSpeed,{point:info.point,sourceId:`${info.bodyId||'piece'}:${wall.game?.id}`,bodyId:info.bodyId,firstCrack:info.firstCrack,damaged:info.damage>0,impactEnergy:info.energy,bounce:info.restitution,wall:true,material:info.material,heavy:info.heavy,kind:info.kind});
  if(info.damage>0){
    hintUntil=performance.now()+1300;
    $('live-hint').textContent='Crack! Back up and strike the wall squarely to open a path.';
  }
};
world.onImpact = (body,speed,other,info={}) => {
  if(other?.game?.destructible)return;
  const referenceSpeed=(Number.isFinite(speed)?speed:0)/REFERENCE_WORLD_SCALE;
  const point=info.point||body.position;
  renderer.addImpact(point.x,point.y,referenceSpeed,info);
  audio.collision(referenceSpeed,{point,bodyId:body.game?.id,impactEnergy:info.energy,bounce:info.restitution,sourceId:info.pairId||[body.id,other?.id].sort((a,b)=>a-b).join(':'),material:body.game?.material,otherMaterial:other?.game?.material,heavy:body.game?.heavy,kind:body.game?.kind,wall:Boolean(other?.isStatic)});
};

canvas.addEventListener('pointerdown',event=>{
  if(phase!=='playing'||pointerId!==null||(event.pointerType==='mouse'&&event.button!==0))return;
  advanceSimulation(performance.now());
  if(phase!=='playing')return;
  const point=renderer.screenToWorld(event.clientX,event.clientY);
  const body=world.grab(point.x,point.y);
  if(body&&!window.matchMedia('(min-width: 740px)').matches)$('game-settings').open=false;
  if(!body)return;
  lastItemId=body.game.id;
  activateSound('grab');
  event.preventDefault();pointerId=event.pointerId;
  try{canvas.setPointerCapture(pointerId);}catch(error){if(!completionQA)throw error;}
  canvas.classList.add('dragging');clock.start(performance.now());
  hintUntil=performance.now()+700;
  const feel=body.game.mass<8?'Light and lively. Try a short pull and watch the rebound.':
    body.game.mass>=45?'Heavy and stubborn. Give it room and a stronger pull.':
    'Pull back, release, and leave room for the rebound.';
  $('board-hint').style.display='none';$('live-hint').textContent=`${body.game.name}. ${feel}`;
});
canvas.addEventListener('pointermove',event=>{
  if(event.pointerId!==pointerId||phase!=='playing')return;
  event.preventDefault();const point=renderer.screenToWorld(event.clientX,event.clientY);
  world.movePointer(point.x,point.y);
});
canvas.addEventListener('pointerup',event=>{
  if(event.pointerId!==pointerId||phase!=='playing')return;
  advanceSimulation(performance.now());
  if(event.pointerId!==pointerId||phase!=='playing')return;
  event.preventDefault();
  const point=renderer.screenToWorld(event.clientX,event.clientY);
  world.movePointer(point.x,point.y);
  const launchedBody=world.grabbed;
  const launched=world.launch();
  if(launched&&launchedBody){
    const v=world.M.Body.getVelocity(launchedBody);
    audio.launch(Math.hypot(v.x,v.y)/REFERENCE_WORLD_SCALE,{material:launchedBody.game.material,heavy:launchedBody.game.heavy,kind:launchedBody.game.kind});
  }
  release();hintUntil=performance.now()+700;
  $('live-hint').textContent=launched?'Nice launch. Grab again to adjust your route.':'Pull farther back, then release to launch.';
});
canvas.addEventListener('pointercancel',event=>{if(event.pointerId===pointerId){advanceSimulation(performance.now());release();}});
canvas.addEventListener('lostpointercapture',event=>{if(event.pointerId===pointerId){advanceSimulation(performance.now());release();}});
canvas.addEventListener('contextmenu',event=>event.preventDefault());
$('play').addEventListener('click',start);
$('view-rankings').addEventListener('click',()=>void openRankings());
$('pause').addEventListener('click',pause);
$('resume').addEventListener('click',resume);
$('retry').addEventListener('click',requestRestart);
$('retry-result').addEventListener('click',reset);
$('result-main').addEventListener('click',()=>{if(phase==='rankings')goMain();});
$('result-name-edit').addEventListener('click',editNickname);
$('result-name-cancel').addEventListener('click',()=>{if(nicknameSaving)return;nicknameEditing=false;$('result-name-status').textContent='';paintNickname();});
$('result-name-save').addEventListener('click',event=>{event.preventDefault();void saveNickname();});
$('result-nickname-form').addEventListener('submit',event=>{event.preventDefault();void saveNickname();});
$('result-nickname').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();void saveNickname();}});
$('share-result').addEventListener('click',async()=>{
  if(phase!=='complete'||resultSeconds===null||$('share-result').disabled)return;
  const version=runVersion;
  $('share-result').disabled=true;
  $('share-url').value=buildChallengeUrl(pageUrl,resultSeconds);
  $('manual-share').hidden=false;
  $('share-status').textContent='Share your move, or copy the challenge link below.';
  try{
    const shared=await shareResult({navigator:window.navigator,url:pageUrl,seconds:resultSeconds});
    if(version!==runVersion||phase!=='complete')return;
    $('manual-share').hidden=shared.status!=='manual';
    if(shared.status==='manual'){$('share-url').value=shared.url;$('share-url').focus();$('share-url').select();}
    $('share-status').textContent=shared.status==='shared'?'Challenge shared.':shared.status==='copied'?'Challenge link copied!':shared.status==='manual'?'Select and copy the link below.':'';
  }catch{
    if(version===runVersion)$('share-status').textContent='Sharing is unavailable. Please try again.';
  }finally{if(version===runVersion)$('share-result').disabled=false;}
});
$('share-url').addEventListener('click',()=>$('share-url').select());
$('restart-dialog').addEventListener('close',()=>{
  if($('restart-dialog').returnValue==='restart')reset();
  else if(restartWasRunning)resume();
});
$('motion').addEventListener('click',()=>{
  reducedMotion=!reducedMotion;
  impactPresentation.clear();
  saveSetting('room-to-boom:motion',String(reducedMotion));
  $('motion').setAttribute('aria-pressed',String(reducedMotion));
  document.body.classList.toggle('reduce-motion',reducedMotion);
});
$('sound').addEventListener('click',()=>{
  // A blocked or interrupted ON preference needs another activation attempt,
  // rather than silently becoming an OFF preference on the retry tap.
  if(!muted&&['locked','blocked','unlocking'].includes(audio.status)){
    activateSound('enable',{resume:true});return;
  }
  muted=!muted;audio.setMuted(muted);saveSetting('room-to-boom:muted',String(muted));updateSound();
  if(!muted)activateSound('enable',{resume:true});
});
function quietWhenInactive(){
  if(phase==='playing')pause();
  else void audio.suspend();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)quietWhenInactive();});
window.addEventListener('blur',quietWhenInactive);
window.addEventListener('keydown',event=>{
  if($('restart-dialog').open)return;
  if(event.code==='Escape'||event.code==='KeyP'){
    if(phase==='playing')pause();else if(phase==='paused')resume();
  }
});
const resizeObserver=new ResizeObserver(()=>renderer.resize());resizeObserver.observe(canvas);
function syncSettingsLayout(){if(window.matchMedia('(min-width: 740px)').matches)$('game-settings').open=true;else $('game-settings').open=false;}
window.addEventListener('resize',()=>{renderer.resize();syncSettingsLayout();});
syncSettingsLayout();
$('motion').setAttribute('aria-pressed',String(reducedMotion));
document.body.classList.toggle('reduce-motion',reducedMotion);
updateBest();updateSound();updateTimer(performance.now());
$('challenge-badge').hidden=!challenge;
if(challenge)$('challenge-time').textContent=`BEAT ${challenge.seconds.toFixed(2)}s`;
showPhase();updateProgress();renderer.resize();

// A local development harness may inspect copied metadata and dispatch normal
// DOM pointer inputs. It cannot change the world or call simulation methods.
const completionQA=(()=>{try{const url=new URL(window.location.href);return ['127.0.0.1','localhost'].includes(url.hostname)&&url.searchParams.get('qa')==='completion';}catch{return false;}})();
if(completionQA)canvas.addEventListener('room-to-boom:inspect',event=>{
  if(!event.detail||typeof event.detail!=='object')return;
  const activeBodies=new Set(world.M.Composite.allBodies(world.engine.world));
  event.detail.snapshot={phase,moved:world.moved,resultSeconds,world:JSON.parse(JSON.stringify(WORLD)),impacts:diagnosticImpacts.map(event=>({...event,point:event.point?{...event.point}:null})),maxPull:PHYSICS.maxPull,
    bodies:world.bodies.map(body=>({id:body.game.id,position:{...body.position},velocity:{...world.M.Body.getVelocity(body)},mass:body.mass,restitution:body.restitution,angle:body.angle,angularVelocity:world.M.Body.getAngularVelocity(body),vertices:body.vertices.map(({x,y})=>({x,y})),w:body.game.w,h:body.game.h,
      maxLaunchSpeed:body.game.maxLaunchSpeed,minimumLaunchSpeed:body.game.minimumLaunchSpeed,
      frictionAir:body.frictionAir,floorDamping:body.game.floorDamping,delivered:body.game.delivered})),
    walls:world.walls.map(wall=>({id:wall.game.id,group:wall.game.group,position:{...wall.position},w:wall.game.w,h:wall.game.h,health:wall.game.health,maxHealth:wall.game.maxHealth,colliderActive:activeBodies.has(wall),lastHitEnergy:wall.game.lastHitEnergy,lastHitDamage:wall.game.lastHitDamage,cracked:wall.game.cracked,broken:wall.game.broken,hidden:wall.game.hidden}))};
});

function advanceSimulation(now){
  // Input handlers also catch up before changing physics state: a delayed
  // render must never apply a fresh release to time that preceded that input.
  // Keep all active wall time. Discarding delayed frames would slow the world
  // while the record clock continued, penalising slower rendering devices.
  // RAF timestamps can be older than an input's performance.now() within a
  // rendering cycle. Keep one monotonic baseline so that time is never counted twice.
  now=Math.max(now,lastFrame);
  const delta=now-lastFrame;lastFrame=now;
  if(phase==='playing'){
    accumulator+=delta;
    while(accumulator+.000001>=STEP&&phase==='playing'){
      accumulator=Math.max(0,accumulator-STEP);
      // Delivery can finish during catch-up: record that simulation substep,
      // rather than the later render frame's timestamp.
      physicsNow=now-accumulator;
      world.step(STEP);
      physicsNow=null;
    }
  }
  return now;
}
function frame(now){
  now=advanceSimulation(now);
  if(phase==='playing'){updateTimer(now);updateDeliveryHint(now);}
  if(impactPresentation.shouldDraw(now,{phase,reducedMotion,aiming:!!world.grabbed}))
    renderer.draw(now,{phase,reducedMotion});
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
