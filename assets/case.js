// Case-room extras: Ask Connie (day-by-day help), the ticket lookup, and the commendation card for solvers.
(function () {
  const D = window.CASEDATA; if (!D) return;

  // ---------- Ask Connie: one day at a time ----------
  const sel = document.getElementById('dayPick'), out = document.getElementById('dayHelp');
  if (sel) {
    D.days.forEach(d => { const o = document.createElement('option'); o.value = d.day; o.textContent = 'Day ' + d.day; sel.appendChild(o); });
    sel.addEventListener('change', () => {
      const d = D.days.find(x => String(x.day) === sel.value);
      if (!d) { out.hidden = true; return; }
      out.innerHTML = '<p class="rule-clue">' + d.clue + '</p>' +
        '<p><b>The rule.</b> ' + d.rule + '</p>' +
        '<p><b>Why it’s true.</b> ' + d.why + '</p>' +
        (d.tips.length ? '<p><b>Easy slips.</b> ' + d.tips.join(' ') + '</p>' : '') +
        '<p class="count">Still standing after Day ' + d.day + ': <b>' + d.left + '</b></p>';
      out.hidden = false;
    });
  }

  // ---------- Ticket lookup (only answers for Days 1-4, so it can't be used to skip the end) ----------
  const lf = document.getElementById('lookup'), lo = document.getElementById('lookupOut');
  if (lf) lf.addEventListener('submit', e => {
    e.preventDefault();
    const n = parseInt((document.getElementById('lookNo').value || '').replace(/[^0-9]/g, ''), 10);
    if (!n) { lo.textContent = 'Type a ticket number from the Ticket Book.'; return; }
    const day = D.early[String(n)];
    if (day) {
      const d = D.days[day - 1];
      lo.innerHTML = 'No. ' + n + ' was struck on <b>Day ' + day + '</b>. ' + d.rule;
    } else if (n > D.maxno) {
      lo.textContent = 'The Ticket Book stops at No. ' + D.maxno + '.';
    } else {
      lo.innerHTML = 'No. ' + n + ' is either not in the book (unsold, or half a pair never used) or still standing after Day 4. After that, you’re on your own.';
    }
  });

  // ---------- Commendation card (shown only after a correct answer) ----------
  window.makeCommendation = function () {
    const name = (document.getElementById('solverName').value || '').trim().slice(0, 40);
    const cv = document.getElementById('card'), c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.fillStyle = '#ede1bf'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#1f2b45'; c.lineWidth = 6; c.strokeRect(24, 24, W - 48, H - 48); c.lineWidth = 2; c.strokeRect(38, 38, W - 76, H - 76);
    c.fillStyle = '#1f2b45'; c.textAlign = 'center';
    c.font = '28px "Courier Prime", monospace'; c.fillText('GALLOWBROOK POLICE HOUSE', W / 2, 120);
    c.font = 'italic 66px "Libre Caslon Text", Georgia, serif'; c.fillText('Commendation', W / 2, 220);
    c.font = '32px "Libre Caslon Text", Georgia, serif'; c.fillText('This is to certify that', W / 2, 300);
    c.font = 'bold 54px "Libre Caslon Text", Georgia, serif'; c.fillText(name || 'a sharp-eyed reader', W / 2, 380);
    c.font = '32px "Libre Caslon Text", Georgia, serif';
    c.fillText('worked through nearly a thousand guests', W / 2, 450);
    c.fillText('and solved the case of the', W / 2, 495);
    c.font = 'italic 46px "Libre Caslon Text", Georgia, serif'; c.fillText(D.title, W / 2, 565);
    const dt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    c.font = '26px "Courier Prime", monospace'; c.fillText('CASE CLOSED  ' + dt.toUpperCase(), W / 2, 650);
    c.save(); c.translate(W - 210, H - 170); c.rotate(-0.12); c.strokeStyle = '#a8261f'; c.lineWidth = 5; c.strokeRect(-150, -42, 300, 84);
    c.fillStyle = '#a8261f'; c.font = 'bold 34px "Courier Prime", monospace'; c.fillText('T. PENN, PC', 0, 12); c.restore();
    c.fillStyle = '#4a5570'; c.font = '22px "Libre Caslon Text", Georgia, serif'; c.textAlign = 'left';
    c.fillText('gallowbrook-mysteries.github.io', 70, H - 70);
    const a = document.getElementById('cardLink'); a.href = cv.toDataURL('image/png'); a.hidden = false;
  };
})();
