import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {registry} from './fixtures.mjs';

test('registered entries have matching model directories, results and logos',async()=>{
  assert.equal(registry.policies.filter(p=>p.evaluation.recordType==='maintained-reference').length,7);
  for(const p of registry.policies){
    const dir=new URL('../leaderboard/'+p.model.id+'/',import.meta.url);
    const files=await readdir(dir);
    assert.equal(files.length,3);
    assert.ok(files.includes('README.md'));
    const saved=JSON.parse(await readFile(new URL('leaderboard_'+p.model.id+'.json',dir),'utf8'));
    assert.deepEqual(saved,p);
    assert.match(p.model.logoPath,new RegExp('^leaderboard/'+p.model.id+'/logo\\.(png|svg|webp)$'));
    assert.ok((await readFile(new URL('../'+p.model.logoPath,import.meta.url))).length>0);
    if(p.evaluation.recordType==='maintained-reference'){
      assert.equal(p.model.contributor,'Bench2Dex Team');
      assert.equal(p.evaluation.logs.status,'not-submitted');
      assert.equal(p.evaluation.logs.revision,null);
      assert.equal(p.evaluation.logs.repository,null);
      assert.equal(p.evaluation.logs.policyPath,null);
    }else{
      assert.equal(p.model.externalReport,true);
      assert.equal(p.evaluation.logs.status,'archived');
      assert.match(p.evaluation.logs.revision,/^[a-f0-9]{40}$/);
      assert.equal(p.evaluation.logs.repository,'Bench2Dex/Leaderboard');
      assert.equal(p.evaluation.logs.policyPath,p.model.id);
    }
  }
});

test('GitHub template contains only model metadata and a logo placeholder',async()=>{
  const dir=new URL('../leaderboard/policy_template/',import.meta.url);
  assert.deepEqual((await readdir(dir)).sort(),['README.md','leaderboard_policy_template.json','logo.svg']);
  const p=JSON.parse(await readFile(new URL('leaderboard_policy_template.json',dir),'utf8'));
  assert.equal(p.evaluation.logs.repository,'Bench2Dex/Leaderboard');
  assert.equal(p.evaluation.logs.policyPath,p.model.id);
});
