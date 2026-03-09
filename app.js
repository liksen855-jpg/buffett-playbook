// ─── CURSOR ──────────────────────────────────────────────
const cursor = document.querySelector('.cursor');
const cursorRing = document.querySelector('.cursor-ring');
if (cursor && cursorRing) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  const animateCursor = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    cursorRing.style.left = rx + 'px';
    cursorRing.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  };
  animateCursor();
  document.querySelectorAll('a, button, .card, [data-hover]').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); cursorRing.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); cursorRing.classList.remove('hover'); });
  });
}

// ─── NAV SCROLL ───────────────────────────────────────────
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ─── INTERSECTION OBSERVER (reveal on scroll) ─────────────
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('animate-fade-up');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => revealObs.observe(el));

// ─── MODULE DATA ──────────────────────────────────────────
window.MODULES = [
  // TIER 1
  { id: '1-1', code: '1.1', tier: 1, title: 'Money, Value & Time', desc: 'What money really is, why inflation steals from you, and how compound growth is the only free lunch in finance.', time: '45 min', formats: ['video','article','quiz','tool'], prereqs: [], locked: false },
  { id: '1-2', code: '1.2', tier: 1, title: 'How Markets Work', desc: 'The mechanical reality of how stocks are bought and sold — exchanges, participants, price discovery, and order types.', time: '55 min', formats: ['video','article','quiz'], prereqs: ['1-1'], locked: false },
  { id: '1-3', code: '1.3', tier: 1, title: 'Interest Rates: The Master Variable', desc: 'The single most important variable in all of finance. Understanding rates unlocks everything else.', time: '60 min', formats: ['video','case study','article','quiz'], prereqs: ['1-2'], locked: false },
  { id: '1-4', code: '1.4', tier: 1, title: 'Inflation & Purchasing Power', desc: 'How inflation is measured, what drives it, and how it distorts every investment decision you will ever make.', time: '50 min', formats: ['video','article','case study','quiz'], prereqs: ['1-3'], locked: false },
  { id: '1-5', code: '1.5', tier: 1, title: 'Reading Financial Statements', desc: 'The three financial statements every investor must read — and what to actually look for beyond the numbers.', time: '70 min', formats: ['video','article','template','quiz'], prereqs: ['1-1'], locked: false },
  { id: '1-6', code: '1.6', tier: 1, title: 'Asset Classes 101', desc: 'A clean map of every major asset class — stocks, bonds, real estate, commodities, crypto, and ETFs.', time: '65 min', formats: ['video','article','quiz'], prereqs: ['1-2','1-5'], locked: false },
  // TIER 2
  { id: '2-1', code: '2.1', tier: 2, title: 'Equity Valuation Fundamentals', desc: "How to put a number on a company. P/E, EV/EBITDA, FCF yield, DCF, and Buffett's margin of safety.", time: '75 min', formats: ['video','article','template','quiz'], prereqs: ['1-1','1-2','1-3','1-4','1-5','1-6'], locked: true },
  { id: '2-2', code: '2.2', tier: 2, title: 'Behavioral Finance & Psychology', desc: 'Why smart people make terrible investment decisions — loss aversion, recency bias, herd behavior, and how to stop.', time: '55 min', formats: ['video','article','case study','quiz'], prereqs: ['2-1'], locked: true },
  { id: '2-3', code: '2.3', tier: 2, title: 'Portfolio Construction & Risk', desc: 'Asset allocation, position sizing, Kelly Criterion, stop losses, and cash as a strategic weapon.', time: '80 min', formats: ['video','article','tool','quiz'], prereqs: ['2-1','2-2'], locked: true },
  { id: '2-4', code: '2.4', tier: 2, title: 'Investing Strategies Compared', desc: 'Value vs growth vs dividend vs momentum vs index. The honest trade-offs of each approach.', time: '65 min', formats: ['video','article','quiz'], prereqs: ['2-3'], locked: true },
  { id: '2-5', code: '2.5', tier: 2, title: 'Understanding ETFs & Index Funds', desc: 'The most democratizing financial product of the last 30 years. How it works, how to use it, how to misuse it.', time: '50 min', formats: ['video','article','tool','quiz'], prereqs: ['2-4'], locked: true },
  { id: '2-6', code: '2.6', tier: 2, title: 'Options & Derivatives Basics', desc: 'Not speculation tools — risk management instruments used by every institutional investor on the planet.', time: '70 min', formats: ['video','article','quiz'], prereqs: ['2-3','2-4'], locked: true },
  // TIER 3
  { id: '3-1', code: '3.1', tier: 3, title: 'Central Banks & Liquidity', desc: 'Central banks control the liquidity that inflates and deflates every asset. This is the most important module.', time: '90 min', formats: ['video','article','case study','tool','quiz'], prereqs: ['2-1','2-2','2-3','2-4','2-5','2-6'], locked: true },
  { id: '3-2', code: '3.2', tier: 3, title: 'The Macro Triangle', desc: 'Rates, inflation, and growth — the three variables that drive everything else. Their interactions create opportunity.', time: '75 min', formats: ['video','article','tool','quiz'], prereqs: ['3-1'], locked: true },
  { id: '3-3', code: '3.3', tier: 3, title: 'Geopolitics & Markets', desc: 'Every geopolitical shock creates dislocations. The question is: who quietly captures the asymmetric upside?', time: '80 min', formats: ['video','article','case study','quiz'], prereqs: ['3-2'], locked: true },
  { id: '3-4', code: '3.4', tier: 3, title: 'Currency Markets & FX Dynamics', desc: 'Currency moves silently through every investment. Ignoring it is not an option for serious investors.', time: '65 min', formats: ['video','article','case study','quiz'], prereqs: ['3-2'], locked: true },
  { id: '3-5', code: '3.5', tier: 3, title: 'Building a Trade Thesis', desc: 'The operational module. Setup → Catalyst → Edge → Timeline → Target → Invalidation. Become accountable to your ideas.', time: '100 min', formats: ['video','article','template','case study','quiz'], prereqs: ['3-1','3-2','3-3','3-4'], locked: true },
  { id: '3-6', code: '3.6', tier: 3, title: 'Sector Analysis & Rotation', desc: 'Markets do not move as one block. Sectors lead and lag based on the macro regime — learn to read the rotation.', time: '70 min', formats: ['video','article','tool','quiz'], prereqs: ['3-1','3-2'], locked: true },
  // TIER 4
  { id: '4-1', code: '4.1', tier: 4, title: 'Investing Like Druckenmiller', desc: 'Liquidity-first, macro-top-down, asymmetric conviction. The operating framework of the greatest macro investor alive.', time: '90 min', formats: ['video','article','case study','quiz'], prereqs: ['3-1','3-2','3-3','3-4','3-5','3-6'], locked: true },
  { id: '4-2', code: '4.2', tier: 4, title: 'Investing Like Buffett', desc: 'Owner mindset, durable moats, capital allocation, and the patience to wait for the fat pitch. The full playbook.', time: '85 min', formats: ['video','article','tool','quiz'], prereqs: ['4-1'], locked: true },
  { id: '4-3', code: '4.3', tier: 4, title: 'Asymmetric Investing', desc: 'Constructing positions where potential gain vastly outweighs potential loss. The core skill of elite investors.', time: '95 min', formats: ['video','article','case study','template','quiz'], prereqs: ['4-1','4-2'], locked: true },
  { id: '4-4', code: '4.4', tier: 4, title: 'Managing Through a Full Cycle', desc: 'Bull market to mania to crash to bear to recovery. Bringing everything together to navigate with discipline.', time: '110 min', formats: ['video','article','tool','quiz'], prereqs: ['4-1','4-2','4-3'], locked: true },
];

window.TIERS = [
  { num: 1, label: 'Foundation', tagline: 'Zero to financially literate', color: '#5A9FCC', count: 6 },
  { num: 2, label: 'Investor',   tagline: 'Literate to structured investor', color: '#4CAF80', count: 6 },
  { num: 3, label: 'Operator',   tagline: 'Investor to macro thinker', color: '#E07070', count: 6 },
  { num: 4, label: 'Strategist', tagline: 'Operator to asymmetric elite', color: '#C8A84B', count: 4 },
];
