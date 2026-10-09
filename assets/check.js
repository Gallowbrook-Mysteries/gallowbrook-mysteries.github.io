// Answer check for a Gallowbrook elimination mystery.
//
// Nothing in this file (or this page) contains the answer. The ticket number is checked against a slow,
// salted PBKDF2 hash; the holder's name is checked by trying to decrypt the epilogue, which is AES-GCM
// encrypted with a key derived (PBKDF2, hundreds of thousands of rounds) from the correct ticket and name.
// Everything runs in your browser; nothing is sent anywhere.
//
// Constable Penn would like it noted that reading the source is exactly what Mrs. Ward does with envelopes,
// holding them up to the lamp in the back room. It doesn't work for her either.
(function () {
  const C = window.CASE;
  const enc = new TextEncoder();
  const hex = b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  async function slowHash(s) {
    const base = await crypto.subtle.importKey('raw', enc.encode(s), 'PBKDF2', false, ['deriveBits']);
    return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(C.tSalt), iterations: C.tIter, hash: 'SHA-256' }, base, 256));
  }
  async function tryEpilogue(ticket, word) {
    const base = await crypto.subtle.importKey('raw', enc.encode(ticket + '|' + word), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(C.kdfSalt), iterations: C.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    try { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(C.iv) }, key, unb64(C.ct))); }
    catch (e) { return null; }
  }
  const normTicket = v => (v || '').replace(/[^0-9]/g, '').replace(/^0+/, '');
  const words = v => Array.from(new Set((v || '').toLowerCase().normalize('NFKD').replace(/[^a-z\s'-]/g, ' ').split(/[\s'-]+/)
    .filter(w => w.length > 1 && !['mr', 'mrs', 'miss', 'dr', 'the', 'commander', 'nurse', 'of'].includes(w)))).slice(0, 4);

  function say(lines, stamp) {
    const box = document.getElementById('reply');
    box.innerHTML = lines.map(l => '<p><span class="strip">' + l + '</span></p>').join('') +
      (stamp ? '<span class="stamp">' + stamp + '</span>' : '');
    box.hidden = false; box.classList.remove('arrive'); void box.offsetWidth; box.classList.add('arrive');
    box.focus();
  }

  const form = document.getElementById('check');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!window.crypto || !crypto.subtle) { say(['THIS BROWSER CANNOT SEND TELEGRAMS STOP', 'TRY ANOTHER BROWSER STOP']); return; }
    const t = normTicket(document.getElementById('ticket').value);
    const ws = words(document.getElementById('holder').value);
    if (!t) { say(['PLEASE GIVE THE TICKET NUMBER STOP', 'DIGITS ONLY STOP']); return; }
    if (!ws.length) { say(['PLEASE GIVE THE NAME OF THE PERSON WHO REALLY HELD IT STOP']); return; }
    const btn = form.querySelector('button.send'); btn.disabled = true; btn.textContent = 'Sending…';
    say(['TELEGRAM SENT STOP', 'AWAITING REPLY FROM POLICE HOUSE STOP']);
    try {
      if ((await slowHash('t:' + C.slug + ':' + t)) !== C.ticketHash) { say(C.msg.wrongTicket); return; }
      for (const w of ws) {
        const html = await tryEpilogue(t, w);
        if (html) {
          say(C.msg.right, 'Case closed');
          const ep = document.createElement('div'); ep.className = 'epilogue'; ep.innerHTML = html;
          document.getElementById('reply').appendChild(ep);
          const sv = document.getElementById('solved'); if (sv) sv.hidden = false;
          return;
        }
      }
      say(C.msg.wrongName);
    } finally { btn.disabled = false; btn.textContent = 'Send to Constable Penn'; }
  });
})();
