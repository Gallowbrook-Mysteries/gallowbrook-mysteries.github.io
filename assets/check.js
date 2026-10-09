// Answer check for a Gallowbrook elimination mystery. No answers are stored in readable form:
// the page holds SHA-256 hashes of accepted answers and an AES-GCM-encrypted epilogue whose key is
// derived (PBKDF2) from the correct answer. Nothing is sent anywhere; it all runs in the reader's browser.
(function () {
  const C = window.CASE;
  const enc = new TextEncoder();
  const hex = b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const sha = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(C.salt + '|' + s)));

  function normTicket(v) { const d = (v || '').replace(/[^0-9]/g, '').replace(/^0+/, ''); return d; }
  function words(v) { return (v || '').toLowerCase().normalize('NFKD').replace(/[^a-z\s'-]/g, ' ').split(/[\s'-]+/).filter(Boolean); }

  async function decryptEpilogue(ticket, nameKey) {
    const base = await crypto.subtle.importKey('raw', enc.encode(ticket + '|' + nameKey), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: unb64(C.kdfSalt), iterations: C.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(C.iv) }, key, unb64(C.ct));
    return new TextDecoder().decode(pt);
  }

  function say(lines, stamp) {
    const box = document.getElementById('reply');
    box.innerHTML = lines.map(l => '<p><span class="strip">' + l + '</span></p>').join('') +
      (stamp ? '<span class="stamp">' + stamp + '</span>' : '');
    box.hidden = false; box.classList.remove('arrive'); void box.offsetWidth; box.classList.add('arrive');
    box.focus();
  }

  document.getElementById('check').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!window.crypto || !crypto.subtle) { say(['THIS BROWSER CANNOT CHECK ANSWERS STOP', 'THE SOLUTION IS IN THE BACK OF YOUR BOOK STOP']); return; }
    const t = normTicket(document.getElementById('ticket').value);
    const ws = words(document.getElementById('holder').value);
    if (!t) { say(['PLEASE GIVE THE TICKET NUMBER STOP', 'DIGITS ONLY STOP']); return; }
    if (!ws.length) { say(['PLEASE GIVE THE NAME OF THE PERSON WHO REALLY HELD IT STOP']); return; }
    const tOk = (await sha('t:' + t)) === C.ticketHash;
    let nameKey = null;
    for (const w of ws) { if ((await sha('n:' + w)) === C.nameHash) { nameKey = w; break; } }
    if (!tOk) { say(C.msg.wrongTicket); return; }
    if (!nameKey) { say(C.msg.wrongName); return; }
    try {
      const html = await decryptEpilogue(t, nameKey);
      say(C.msg.right, 'Case closed');
      const ep = document.createElement('div'); ep.className = 'epilogue'; ep.innerHTML = html;
      document.getElementById('reply').appendChild(ep);
    } catch (err) { say(['SOMETHING WENT WRONG ON THE LINE STOP', 'THE SOLUTION IS IN THE BACK OF YOUR BOOK STOP']); }
  });
})();
