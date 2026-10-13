import { createHash } from 'node:crypto';

export function validatedJobRequest(body) {
  const video_id = String(body?.video_id || '').trim();
  const fps = Number(body?.fps || 30);
  const beats = body?.beats;
  const audio_file_ids = body?.audio_file_ids;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(video_id)) throw new Error('video_id must contain 1-100 letters, digits, underscores or hyphens');
  if (fps !== 30) throw new Error('fps must be 30 for this long-form pipeline');
  if (!Array.isArray(beats) || beats.length < 1 || beats.length > 200) throw new Error('beats must contain 1-200 items');
  if (!Array.isArray(audio_file_ids) || audio_file_ids.length !== 1 || !/^[\w-]{15,100}$/.test(audio_file_ids[0])) throw new Error('one valid Drive audio_file_id is required');
  for (const [i, beat] of beats.entries()) {
    if (!beat || !/^(VC|VA)-LF-\d{3}$/.test(String(beat.card_id || '')) || !(Number(beat.duration) > 0)) throw new Error(`beat ${i + 1}: invalid component or duration`);
  }
  return { video_id, fps, beats, audio_file_ids };
}
export function renderJobId(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 40);
}
export function validateJobId(jobId) {
  if (!/^[a-f0-9]{40}$/.test(String(jobId || ''))) throw new Error('invalid job_id');
  return jobId;
}
