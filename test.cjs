const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync(__dirname+'/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
test('custom workout selection survives filters, time change and reload',()=>{
  const t=setup();t.run('setBuilder("type","custom");toggleProposalExercise(profile().exercises[0].id);toggleProposalExercise(profile().exercises[6].id);setLibraryFilter("Rug");setBuilder("minutes",45)');
  const ids=t.run('JSON.stringify(profile().workoutProposal.exerciseIds)');assert.equal(t.run('profile().workoutProposal.exerciseIds.length'),2);
  const r=setup(t.stored());assert.equal(r.run('JSON.stringify(profile().workoutProposal.exerciseIds)'),ids);assert.equal(r.run('profile().workoutProposal.filter'),'Rug');assert.equal(r.run('profile().workoutProposal.minutes'),45);
});
test('editor removal and ordering never change the base or history',()=>{
  const t=setup();const before=t.run('JSON.stringify([profile().exercises,profile().history])');
  t.run('setBuilder("type","custom");toggleProposalExercise(profile().exercises[0].id);toggleProposalExercise(profile().exercises[1].id);moveProposalExercise(profile().exercises[1].id,-1)');
  assert.equal(t.run('profile().workoutProposal.exerciseIds[0]===profile().exercises[1].id'),true);
  t.run('toggleProposalExercise(profile().exercises[0].id)');assert.equal(t.run('profile().workoutProposal.exerciseIds.length'),1);assert.equal(t.run('JSON.stringify([profile().exercises,profile().history])'),before);
});
test('leg and arm filters include related muscle labels without duplicates',()=>{
  const t=setup();assert.equal(t.run('filteredLibrary("Benen").length'),4);assert.equal(t.run('filteredLibrary("Armen").length'),2);assert.equal(t.run('filteredLibrary("Alles").length'),15);
});
test('custom order carries into the tracker and empty workouts cannot start',()=>{
  const t=setup();t.run('setBuilder("type","custom");startProposal()');assert.equal(t.run('app.session'),null);
  t.run('toggleProposalExercise(profile().exercises[6].id);toggleProposalExercise(profile().exercises[0].id);startProposal()');assert.equal(t.run('app.session.items[0].name'),'Lat pulldown');assert.equal(t.run('app.session.items[1].name'),'Leg press');
});
test('automatic proposals fit all time budgets and muscle groups without duplicates',()=>{
  const t=setup();
  for(const type of ['total','upper','lower','back','chest','legs'])for(const minutes of [30,45,60,90]){
    const result=JSON.parse(t.run(`JSON.stringify(makeProposal({type:'${type}',minutes:${minutes},warmup:true,variation:0}))`));
    assert.ok(result.estimatedMinutes<=minutes);assert.ok(result.exerciseIds.length>0);assert.equal(new Set(result.exerciseIds).size,result.exerciseIds.length);
    assert.equal(t.run(`makeProposal({type:'${type}',minutes:${minutes},warmup:true}).exerciseIds.every(id=>workoutTypes().find(t=>t.id==='${type}').groups.includes(profile().exercises.find(e=>e.id===id).primaryMuscle))`),true);
  }
});
test('fixed base remains complete even when longer than chosen time',()=>{
  const t=setup();assert.equal(t.run('makeProposal({type:"base",minutes:30,warmup:true}).exerciseIds.length'),15);assert.ok(t.run('makeProposal({type:"base",minutes:30,warmup:true}).estimatedMinutes')>30);
});
test('viewing and regenerating proposal does not change base, history or active session',()=>{
  const t=setup();t.run('startOrFinish()');const before=t.run('JSON.stringify([profile().exercises,profile().history,app.session])');
  t.run('setBuilder("type","back");previewWorkout();previewWorkout(true)');assert.equal(t.run('JSON.stringify([profile().exercises,profile().history,app.session])'),before);
  t.run('startProposal()');assert.equal(t.alerts.length,1);assert.equal(t.run('JSON.stringify([profile().exercises,profile().history,app.session])'),before);
});
test('proposal session contains only selected IDs through reload and completion',()=>{
  const t=setup();t.run('setBuilder("type","back");setBuilder("minutes",30);setBuilder("warmup",false);previewWorkout();startProposal()');
  const ids=t.run('JSON.stringify(app.session.exerciseIds)');assert.equal(t.run('JSON.stringify(app.session.items.map(e=>e.exerciseId))'),ids);assert.equal(t.run('app.session.cardio.length'),0);
  const r=setup(t.stored());assert.equal(r.run('JSON.stringify(app.session.items.map(e=>e.exerciseId))'),ids);r.run('setWeight(app.session.items[0].exerciseId,"70");toggleSet(app.session.items[0].exerciseId,1);startOrFinish()');
  assert.equal(r.run('JSON.stringify(profile().history[0].items.map(e=>e.exerciseId))'),ids);assert.equal(r.run('profile().exercises.length'),15);assert.equal(r.run('lastWeight(profile().history[0].items[0].exerciseId)'),70);
});
test('each person retains their own builder selection and proposal',()=>{
  const t=setup();t.run('globalThis.first=app.activeProfile;setBuilder("type","lower");previewWorkout();document.getElementById("newProfileName").value="Tweede";addProfile()');
  assert.equal(t.run('builderSettings().type'),'total');assert.equal(t.run('profile().workoutProposal'),undefined);t.run('switchProfile(first)');assert.equal(t.run('profile().workoutProposal.type'),'lower');
});
test('empty library and too-long warmup do not invent exercises',()=>{
  const t=setup();t.run('profile().exercises=[]');assert.equal(t.run('makeProposal({type:"total",minutes:30,warmup:true}).exerciseIds.length'),0);
  t.run('profile().exercises=defaultExercises();profile().cardio[0].minutes=90');assert.equal(t.run('makeProposal({type:"total",minutes:30,warmup:true}).exerciseIds.length'),0);
});
function legacyFixture(){
  const seed=setup();
  seed.run('startOrFinish();setWeight(profile().exercises[0].id,"45");toggleSet(profile().exercises[0].id,2);startOrFinish();startOrFinish();toggleSet(profile().exercises[0].id,1)');
  const data=JSON.parse(seed.run('JSON.stringify(app)'));
  delete data.schemaVersion;
  for(const p of Object.values(data.profiles))for(const e of p.exercises)for(const key of ['catalogId','primaryMuscle','secondaryMuscles','movement','defaultSets','defaultReps'])delete e[key];
  return data;
}
test('V1 migration keeps every original field, ID, history and active session',()=>{
  const before=legacyFixture(),raw=JSON.stringify(before),t=setup(raw),after=JSON.parse(t.run('JSON.stringify(app)'));
  assert.equal(after.schemaVersion,2);
  assert.deepEqual(after.session,before.session);
  for(const [id,p] of Object.entries(before.profiles)){
    assert.deepEqual(after.profiles[id].history,p.history);
    for(const e of p.exercises)for(const [key,value] of Object.entries(e))assert.deepEqual(after.profiles[id].exercises.find(x=>x.id===e.id)[key],value);
  }
  assert.equal(t.storage.get('workout_basis_universal_v1_backup_before_v2'),raw);
  assert.equal(t.run('profile().exercises[0].primaryMuscle'),'Benen');
});
test('migration is repeatable, non-mutating and preserves custom exercise fields',()=>{
  const data=legacyFixture(),p=data.profiles[data.activeProfile];
  p.exercises.push({id:'custom',name:'Eigen oefening',sets:4,reps:8,weight:12,step:2,machine:'X',note:'Eigen notitie',customFlag:true});
  const raw=JSON.stringify(data),t=setup(raw);
  assert.equal(t.run('profile().exercises.at(-1).primaryMuscle'),null);
  assert.equal(t.run('profile().exercises.at(-1).customFlag'),true);
  const result=t.run('JSON.stringify(app)');
  assert.equal(t.run('JSON.stringify(migrateData(app))'),result);
  const reload=setup(result);assert.equal(reload.run('JSON.stringify(app)'),result);
  assert.equal(JSON.stringify(data),raw);
});
test('history-only exercises remain available as archived library entries',()=>{
  const data=legacyFixture();data.session=null;const p=data.profiles[data.activeProfile],removed=p.exercises.shift();
  const t=setup(JSON.stringify(data));
  assert.equal(t.run('profile().exercises.length'),14);
  const entry=JSON.parse(t.run(`JSON.stringify(exerciseLibrary().find(e=>e.id===${JSON.stringify(removed.id)}))`));
  assert.equal(entry.archived,true);assert.equal(entry.lastUsedWeight,45);assert.equal(entry.history.length,1);
});
test('invalid JSON, malformed data, future version and backup failure never overwrite source',()=>{
  for(const raw of ['{broken',JSON.stringify({profiles:{}}),JSON.stringify({...legacyFixture(),schemaVersion:99})]){
    const t=setup(raw);assert.equal(t.run('app'),null);assert.equal(t.stored(),raw);assert.match(t.el.wrap.innerHTML,/Originele gegevens downloaden/);
  }
  const raw=JSON.stringify(legacyFixture()),t=setup(raw,{failWrite:true});assert.equal(t.run('app'),null);assert.equal(t.stored(),raw);
});
test('library separates latest historical weight from editable default and other profiles',()=>{
  const t=setup(JSON.stringify(legacyFixture()));t.run('startOrFinish();setWeight(profile().exercises[0].id,"80")');
  assert.equal(t.run('exerciseLibrary()[0].lastUsedWeight'),45);assert.equal(t.run('exerciseLibrary()[0].weight'),80);
  t.run('document.getElementById("newProfileName").value="Tweede";addProfile()');
  assert.equal(t.run('exerciseLibrary()[0].lastUsedWeight'),null);
});
test('weights and cardio editable before starting and decimal comma supported',()=>{const t=setup();t.run('setWeight(profile().exercises[0].id,"42,5",true);setCardio(profile().cardio[0].id,"minutes","18",true)');const r=setup(t.stored());assert.equal(r.run('profile().exercises[0].weight'),42.5);assert.equal(r.run('profile().cardio[0].minutes'),18);assert.equal(r.run('app.session'),null);r.run('changeWeight(profile().exercises[0].id,1);startOrFinish()');assert.equal(r.run('app.session.items[0].weight'),43.5)});
test('typing persists without replacing inputs and survives immediate finish',()=>{const t=setup();t.run('startOrFinish()');const before=t.el.workoutView.innerHTML;t.run('setWeight(profile().exercises[0].id,"55,5",true);setCardio(profile().cardio[0].id,"calories","120",true)');assert.equal(t.el.workoutView.innerHTML,before);t.run('startOrFinish()');assert.equal(t.run('profile().history[0].items[0].weight'),55.5);assert.equal(t.run('profile().history[0].cardio[0].calories'),120)});
test('editing another profile leaves running session untouched',()=>{const t=setup();t.run('startOrFinish();document.getElementById("newProfileName").value="Tweede";addProfile();setWeight(profile().exercises[0].id,"60",true)');assert.equal(t.run('app.session.items[0].weight'),36);assert.equal(t.run('profile().exercises[0].weight'),60)});
function setup(saved,options={}){
  const elements={},alerts=[],storage=new Map(saved===undefined?[]:[['workout_basis_universal_v1',saved]]);
  const ctx=vm.createContext({console,Date,Math,Number,JSON,Array,Object,String,Blob,URL,
    alert:x=>alerts.push(x),confirm:()=>true,
    localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>{if(options.failWrite)throw Error('full');storage.set(k,v)}},
    document:{getElementById:id=>elements[id]??={value:'',style:{},innerHTML:'',checkValidity(){return this.valid!==false},reportValidity(){},focus(){},getAttribute(){return id}},querySelector:()=>elements.wrap??={innerHTML:''},querySelectorAll:()=>[],addEventListener(){}}
  });
  vm.runInContext(script,ctx);
  return {run:s=>vm.runInContext(s,ctx),el:elements,alerts,storage,stored:()=>storage.get('workout_basis_universal_v1')};
}
test('default workout and session survive reload',()=>{const t=setup();assert.equal(t.run('profile().exercises.length'),15);t.run('startOrFinish();changeWeight(profile().exercises[0].id,1);toggleSet(profile().exercises[0].id,1)');const r=setup(t.stored());assert.equal(r.run('app.session.items[0].weight'),37);assert.equal(r.run('app.session.items[0].completedSets.length'),1)});
test('history counts completed sets and remembers previous weight',()=>{const t=setup();t.run('startOrFinish();toggleSet(profile().exercises[0].id,1);toggleSet(profile().exercises[0].id,3);setWeight(profile().exercises[0].id,"42.5");startOrFinish()');assert.match(t.el.historyView.innerHTML,/2\/3 sets/);assert.equal(t.run('lastWeight(profile().exercises[0].id)'),42.5);t.run('startOrFinish()');assert.equal(t.run('app.session.items[0].weight'),42.5)});
test('adding and removing exercises/cardio during training stays synchronized',()=>{const t=setup();t.run('startOrFinish()');t.run('document.getElementById(\"exName\").value=\"Test\"');for(const [id,v] of Object.entries({exSets:'3',exReps:'12',exWeight:'10',exStep:'1',exMachine:'',exNote:''}))t.run(`document.getElementById('${id}').value=${JSON.stringify(v)}`);t.run('addExercise();toggleSet(profile().exercises.at(-1).id,1)');assert.equal(t.run('app.session.items.at(-1).completedSets.length'),1);for(const [id,v] of Object.entries({cardioType:'Loopband',cardioMinutes:'15',cardioLevel:'3',cardioCalories:'50',cardioNote:''}))t.run(`document.getElementById('${id}').value=${JSON.stringify(v)}`);t.run('addCardio()');assert.equal(t.run('app.session.cardio.length'),2);t.run('removeCardio(profile().cardio.at(-1).id);removeExercise(profile().exercises.at(-1).id)');assert.equal(t.run('app.session.cardio.length'),1);assert.equal(t.run('app.session.items.length'),15)});
test('profile switching and creation preserve unfinished session',()=>{const t=setup();t.run('startOrFinish();globalThis.first=app.activeProfile;setWeight(profile().exercises[0].id,"50");document.getElementById("newProfileName").value="Tweede";addProfile();startOrFinish()');assert.equal(t.alerts.length,1);assert.equal(t.run('app.session.profileId===first'),true);t.run('switchProfile(first)');assert.equal(t.run('currentWeight(profile().exercises[0])'),50);t.run('startOrFinish()');assert.equal(t.run('profile().history.length'),1)});
test('invalid numbers cannot corrupt session',()=>{const t=setup();t.run('startOrFinish();setWeight(profile().exercises[0].id,"Infinity");setWeight(profile().exercises[0].id,"-1");setCardio(profile().cardio[0].id,"minutes","0");setCardio(profile().cardio[0].id,"level","-3")');assert.equal(t.alerts.length,4);assert.equal(t.run('app.session.items[0].weight'),36);assert.equal(t.run('app.session.cardio[0].minutes'),10)});
test('text is escaped and storage failure is reported',()=>{const t=setup();t.run('profile().name="<img src=x onerror=alert(1)>";render()');assert.ok(!t.el.profileSelect.innerHTML.includes('<img'));t.run('localStorage.setItem=()=>{throw Error("full")};save()');assert.match(t.alerts[0],/Opslaan is niet gelukt/)});
test('old session without cardio is migrated',()=>{const t=setup();t.run('startOrFinish();delete app.session.cardio');const r=setup(t.run('JSON.stringify(app)'));assert.equal(r.run('app.session.cardio.length'),1)});
