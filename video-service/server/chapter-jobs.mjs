// Durable asynchronous long-form chapter rendering via Cloud Tasks + private GCS.
import { GoogleAuth } from 'google-auth-library';
import { validatedJobRequest, renderJobId, validateJobId } from './chapter-jobs-core.mjs';
import { createSignedReadURL } from './assembly-gcs.mjs';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
const storageAPI = 'https://storage.googleapis.com';
const tasksAPI = 'https://cloudtasks.googleapis.com/v2';
const jobName = id => `chapter-render-jobs/${id}.json`;
const encode = encodeURIComponent;

function config() {
  const bucket = process.env.AXLF_ASSEMBLY_GCS_BUCKET;
  const project = process.env.AXLF_RENDER_PROJECT || 'ampcorex';
  const region = process.env.AXLF_RENDER_REGION || 'europe-west1';
  const queue = process.env.AXLF_RENDER_TASK_QUEUE || 'axlf-chapter-render';
  const worker = process.env.AXLF_RENDER_WORKER_URL;
  const key = process.env.LONGFORM_RENDER_API_KEY;
  if (!bucket || !worker || !key) throw new Error('chapter-job environment is incomplete (bucket, worker URL, or API key)');
  if (!/^https:\/\//.test(worker)) throw new Error('worker URL must use HTTPS');
  return { bucket, project, region, queue, worker, key };
}
async function client() { return auth.getClient(); }
function objectURL(bucket, id) { return `${storageAPI}/storage/v1/b/${encode(bucket)}/o/${encode(jobName(id))}?alt=media`; }
function uploadURL(bucket, id, onlyIfNew) { return `${storageAPI}/upload/storage/v1/b/${encode(bucket)}/o?uploadType=media&name=${encode(jobName(id))}${onlyIfNew ? '&ifGenerationMatch=0' : ''}`; }
function httpStatus(error) { return error?.response?.status || error?.code || 0; }
async function getJobRecord(id) {
  const { bucket } = config();
  try {
    const response = await (await client()).request({url: objectURL(bucket, validateJobId(id)), method: 'GET'});
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  } catch (error) {
    if (Number(httpStatus(error)) === 404) return null;
    throw error;
  }
}
async function saveJobRecord(record, onlyIfNew = false) {
  const { bucket } = config();
  const response = await (await client()).request({
    url: uploadURL(bucket, validateJobId(record.job_id), onlyIfNew), method: 'POST',
    headers: {'Content-Type':'application/json'},
    data: JSON.stringify(record),
  });
  return response.data;
}
async function enqueue(id) {
  const cfg = config();
  const name = `projects/${cfg.project}/locations/${cfg.region}/queues/${cfg.queue}`;
  const body = {
    task: {
      name: `${name}/tasks/${id}`,
      httpRequest: {
        httpMethod: 'POST', url: cfg.worker,
        headers: {'Content-Type': 'application/json', 'x-api-key': cfg.key},
        body: Buffer.from(JSON.stringify({job_id:id})).toString('base64'),
      },
      dispatchDeadline: '900s',
    },
  };
  try {
    await (await client()).request({ url: `${tasksAPI}/${name}/tasks`, method: 'POST', data: body });
  } catch (error) {
    if (Number(httpStatus(error)) !== 409) throw error;
  }
}
export async function submitRenderJob(raw) {
  const request = validatedJobRequest(raw);
  const job_id = renderJobId(request);
  let record = await getJobRecord(job_id);
  if (!record) {
    record = {job_id, status:'queued', request, created_at:new Date().toISOString()};
    try { await saveJobRecord(record, true); }
    catch (error) {
      if (Number(httpStatus(error)) !== 412) throw error;
      record = await getJobRecord(job_id);
      if (!record) throw Error('Job record conflict; retry submission');
    }
  }
  if (record.status === 'queued') await enqueue(job_id);
  return {job_id, status:record.status, filename:`${request.video_id}.mp4`};
}
export async function renderJobStatus(jobId) {
  const record = await getJobRecord(jobId);
  if (!record) return null;
  const result = {job_id:record.job_id,status:record.status,filename:`${record.request.video_id}.mp4`};
  if (record.status === 'completed') {
    const signed = await createSignedReadURL(record.storage_bucket, record.storage_object);
    Object.assign(result,signed,{size_bytes:record.size_bytes});
  }
  if (record.status === 'failed') result.error = record.error;
  return result;
}
export async function processRenderJob(jobId, renderToGCS, retryCount = 0) {
  let record = await getJobRecord(jobId);
  if (!record) throw new Error('render job was not found');
  if (record.status === 'completed') return {job_id:jobId,status:'completed',already_done:true};
  record = {...record,status:'running',started_at:new Date().toISOString()};
  await saveJobRecord(record);
  try {
    const uploaded = await renderToGCS(record.request);
    await saveJobRecord({...record,status:'completed',completed_at:new Date().toISOString(),
      filename:uploaded.filename,storage_bucket:uploaded.storage_bucket,
      storage_object:uploaded.storage_object,size_bytes:uploaded.size_bytes});
    return {job_id:jobId,status:'completed'};
  } catch (error) {
    const message = String(error?.message || error).slice(0,700);
    // Cloud Tasks is configured for three attempts (retry counts 0, 1, 2).
    // Intermediate failures must not be exposed as terminal failures to Make.
    const finalAttempt = Number(retryCount) >= 2;
    const nextStatus = finalAttempt ? 'failed' : 'retrying';
    try { await saveJobRecord({...record,status:nextStatus,error:message,failed_at:new Date().toISOString()}); }
    catch (storageError) { console.error('Cannot persist failed job:',storageError); }
    throw error;
  }
}
