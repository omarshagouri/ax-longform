import test from 'node:test';
import assert from 'node:assert/strict';
import { validatedJobRequest, renderJobId, validateJobId } from './chapter-jobs-core.mjs';
const valid = {video_id:'AX-LF-003_CH4',fps:30,beats:[{beat:1,card_id:'VC-LF-004',duration:'10',values:'{"HOOK":"Hi"'+'}'},{beat:2,card_id:'VA-LF-004',duration:'2.525',values:{title:'Test'}}],audio_file_ids:['exampleDriveAudioId_1234567890']};
test('valid request yields stable id',()=>{
 const p=validatedJobRequest(valid);
 assert.deepEqual(p,valid);
 assert.equal(renderJobId(p),renderJobId(validatedJobRequest({...valid})));
 assert.match(renderJobId(p),/^[a-f0-9]{40}$/);
 assert.equal(validateJobId(renderJobId(p)),renderJobId(p));
});
test('invalid jobs fail before enqueueing',()=>{
 for(const body of [{...valid,video_id:'invalid / id'},{...valid,fps:60},{...valid,beats:[]},{...valid,beats:[{card_id:'VV-LF-001',duration:1}]},{...valid,audio_file_ids:['x']}])
 assert.throws(()=>validatedJobRequest(body));
 for(const id of ['abc','../secret','a'.repeat(41)]) assert.throws(()=>validateJobId(id));
});
test('different payload -> different id',()=>{
 assert.notEqual(renderJobId(validatedJobRequest(valid)),renderJobId(validatedJobRequest({...valid,beats:[{card_id:'VC-LF-005',duration:12}]})));
});

test('rejects short visual coverage before queueing the long Remotion job',()=>{
 const short={...valid,audio_duration_sec:24.525};
 assert.throws(()=>validatedJobRequest(short),/Visual Plan timing mismatch before queueing/);
});
test('accepts measured audio match including frame rounding',()=>{
 const match={...valid,audio_duration_sec:12.525};
 const result=validatedJobRequest(match);
 assert.equal(result.audio_duration_sec,12.525);
 assert.ok(renderJobId(result));
});
test('rejects missing numeric duration when supplied',()=>{
 assert.throws(()=>validatedJobRequest({...valid,audio_duration_sec:''}),/audio_duration_sec/);
});
