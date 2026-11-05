/* Adapter for the existing tutor. Loaded only by the local Python server. */
(() => {
  'use strict';
  let state = null;
  async function status() {
    const response = await fetch('/api/status', {cache: 'no-store'});
    if (!response.ok) throw new Error('Local school is unavailable.');
    state = await response.json();
    return state;
  }
  function photo(file) {
    if (file.size > 5 * 1024 * 1024) return Promise.reject({code: 'image_rejected', message: 'Use a photo under 5 MB.'});
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({media_type: file.type, data: String(reader.result).split(',')[1]});
      reader.onerror = () => reject({code: 'image_rejected', message: 'Could not read this photo.'});
      reader.readAsDataURL(file);
    });
  }
  async function sample(input, options = {}) {
    if (!state) await status();
    const messages = typeof input === 'string' ? [{role: 'user', content: input}] : input;
    const images = await Promise.all((options.images || []).map(photo));
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'X-School-Token': state.token},
        body: JSON.stringify({messages, images, json_mode: !!options.jsonMode}), signal: options.signal
      });
      const result = await response.json();
      if (!response.ok) throw result;
      if (options.onText) options.onText({text: result.text});
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw {code: 'cancelled'};
      throw error.code ? error : {code: 'upstream_error', message: 'Could not reach the local tutor. Reopen Law School with Claude.'};
    }
  }
  sample.limits = async () => ({images: {mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']}});
  sample.json = async (prompt, options = {}) => {
    const result = await sample(prompt, {...options, jsonMode: true});
    if (result.truncated) throw {code: 'invalid_json', message: 'Claude’s practice response was cut short. Try again.'};
    try { return JSON.parse(result.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
    catch (_) { throw {code: 'invalid_json', message: 'Claude returned invalid practice data. Try again.'}; }
  };
  window.ToELocal = {
    async connect() {
      try { return (await status()).configured ? sample : null; }
      catch (_) { return null; }
    }
  };
  document.addEventListener('DOMContentLoaded', async () => {
    const bar = document.querySelector('.topbar .wrap');
    const link = document.querySelector('#claude-connect') || document.createElement('a');
    link.href = '/connect'; link.className = 'btn btn-sm'; link.textContent = 'Connect Claude';
    link.title = 'Connect your Claude API credits';
    if (bar) bar.insertBefore(link, document.querySelector('#tutor-btn'));
    try { if ((await status()).configured) link.textContent = 'Claude settings'; } catch (_) {}
  });
})();
