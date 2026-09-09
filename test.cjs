const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync(__dirname+'/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function setup(saved){
  const elements={},alerts=[];let stored=saved;
  const ctx=vm.createContext({console,Date,Math,Number,JSON,Array,Object,String,Blob,URL,
    alert:x=>alerts.push(x),confirm:()=>true,
    localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v}},
    document:{getElementById:id=>elements[id]??={value:'',style:{},innerHTML:'',checkValidity(){return this.valid!==false},reportValidity(){},focus(){},getAttribute(){return id}},querySelectorAll:()=>[],addEventListener(){}}
  });
  vm.runInContext(script,ctx);
  return {run:s=>vm.runInContext(s,ctx),el:elements,alerts,stored:()=>stored};
}
test('default workout and session survive reload',()=>{const t=setup();assert.equal(t.run('profile().exercises.length'),15);t.run('startOrFinish();changeWeight(profile().exercises[0].id,1);toggleSet(profile().exercises[0].id,1)');const r=setup(t.stored());assert.equal(r.run('app.session.items[0].weight'),37);assert.equal(r.run('app.session.items[0].completedSets.length'),1)});
test('history counts completed sets and remembers previous weight',()=>{const t=setup();t.run('startOrFinish();toggleSet(profile().exercises[0].id,1);toggleSet(profile().exercises[0].id,3);setWeight(profile().exercises[0].id,"42.5");startOrFinish()');assert.match(t.el.historyView.innerHTML,/2\/3 sets/);assert.equal(t.run('lastWeight(profile().exercises[0].id)'),42.5);t.run('startOrFinish()');assert.equal(t.run('app.session.items[0].weight'),42.5)});
test('adding and removing exercises/cardio during training stays synchronized',()=>{const t=setup();t.run('startOrFinish()');t.run('document.getElementById(\"exName\").value=\"Test\"');for(const [id,v] of Object.entries({exSets:'3',exReps:'12',exWeight:'10',exStep:'1',exMachine:'',exNote:''}))t.run(`document.getElementById('${id}').value=${JSON.stringify(v)}`);t.run('addExercise();toggleSet(profile().exercises.at(-1).id,1)');assert.equal(t.run('app.session.items.at(-1).completedSets.length'),1);for(const [id,v] of Object.entries({cardioType:'Loopband',cardioMinutes:'15',cardioLevel:'3',cardioCalories:'50',cardioNote:''}))t.run(`document.getElementById('${id}').value=${JSON.stringify(v)}`);t.run('addCardio()');assert.equal(t.run('app.session.cardio.length'),2);t.run('removeCardio(profile().cardio.at(-1).id);removeExercise(profile().exercises.at(-1).id)');assert.equal(t.run('app.session.cardio.length'),1);assert.equal(t.run('app.session.items.length'),15)});
test('profile switching and creation preserve unfinished session',()=>{const t=setup();t.run('startOrFinish();globalThis.first=app.activeProfile;setWeight(profile().exercises[0].id,"50");document.getElementById("newProfileName").value="Tweede";addProfile();startOrFinish()');assert.equal(t.alerts.length,1);assert.equal(t.run('app.session.profileId===first'),true);t.run('switchProfile(first)');assert.equal(t.run('currentWeight(profile().exercises[0])'),50);t.run('startOrFinish()');assert.equal(t.run('profile().history.length'),1)});
test('invalid numbers cannot corrupt session',()=>{const t=setup();t.run('startOrFinish();setWeight(profile().exercises[0].id,"Infinity");setWeight(profile().exercises[0].id,"-1");setCardio(profile().cardio[0].id,"minutes","0");setCardio(profile().cardio[0].id,"level","-3")');assert.equal(t.alerts.length,4);assert.equal(t.run('app.session.items[0].weight'),36);assert.equal(t.run('app.session.cardio[0].minutes'),10)});
test('text is escaped and storage failure is reported',()=>{const t=setup();t.run('profile().name="<img src=x onerror=alert(1)>";render()');assert.ok(!t.el.profileSelect.innerHTML.includes('<img'));t.run('localStorage.setItem=()=>{throw Error("full")};save()');assert.match(t.alerts[0],/Opslaan is niet gelukt/)});
test('old session without cardio is migrated',()=>{const t=setup();t.run('startOrFinish();delete app.session.cardio');const r=setup(t.run('JSON.stringify(app)'));assert.equal(r.run('app.session.cardio.length'),1)});
