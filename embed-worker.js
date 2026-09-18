import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2';

env.allowLocalModels = false;
env.useBrowserCache = true;

let extractorPromise = null;
function getExtractor(){
  if(!extractorPromise){
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
      progress_callback: (p) => self.postMessage({ type: 'progress', data: p })
    });
  }
  return extractorPromise;
}

self.onmessage = async (e) => {
  const { id, type, text } = e.data;

  if (type === 'init') {
    try {
      await getExtractor();
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message });
    }
    return;
  }

  if (type === 'embed') {
    try {
      const extractor = await getExtractor();
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      self.postMessage({ id, type: 'embed-result', embedding: Array.from(output.data) });
    } catch (err) {
      self.postMessage({ id, type: 'error', error: err.message });
    }
  }
};
