/* Adapter for the course-funded public Claude tutor. No API key enters the browser. */
(() => {
  'use strict';
  const API = 'https://baird-law-school-claude.goldenbrioche1.chatgpt.site';
  let state = null;
  async function status() {
    const response = await fetch(API + '/api/status', {cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error('The course tutor is temporarily unavailable. Please reload.');
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
      const response = await fetch(API + '/api/tutor', {
        credentials: 'omit',
        method: 'POST', headers: {'Content-Type': 'application/json', 'X-Law-Tutor': '1'},
        body: JSON.stringify({messages, images, json_mode: !!options.jsonMode}), signal: options.signal
      });
      const result = await response.json();
      if (!response.ok) throw result;
      if (options.onText) options.onText({text: result.text});
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw {code: 'cancelled'};
      throw error.code ? error : {code: 'upstream_error', message: 'Could not reach Claude. Check your internet connection and reload this course.'};
    }
  }
  sample.limits = async () => ({images: {mediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']}});
  sample.json = async (prompt, options = {}) => {
    const result = await sample(prompt, {...options, jsonMode: true});
    if (result.truncated) throw {code: 'invalid_json', message: 'Claude’s practice response was cut short. Try again.'};
    try { return JSON.parse(result.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); }
    catch (_) { throw {code: 'invalid_json', message: 'Claude returned invalid practice data. Try again.'}; }
  };
  window.SchoolClaude = {
    async connect() {
      try { return (await status()).configured ? sample : null; }
      catch (_) { return null; }
    }
  };
  document.addEventListener('DOMContentLoaded', async () => {
    const badge = document.getElementById('claude-connect');
    try { if (badge) badge.textContent = (await status()).configured ? 'Claude · course-funded' : 'Tutor temporarily unavailable'; }
    catch (_) { if (badge) badge.textContent = 'Tutor connection unavailable'; }
    function keyboardLayout() {
      const viewport = window.visualViewport;
      if (!viewport) return;
      document.documentElement.style.setProperty('--tutor-height', viewport.height + 'px');
      document.documentElement.style.setProperty('--tutor-top', viewport.offsetTop + 'px');
    }
    keyboardLayout();
    window.visualViewport?.addEventListener('resize', keyboardLayout);
    window.visualViewport?.addEventListener('scroll', keyboardLayout);
  });
})();
