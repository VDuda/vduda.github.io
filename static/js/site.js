/* Local reading preferences and progressive enhancement; no analytics or requests. */
(() => {
  const sizeControl = document.querySelector('#text-size');
  const allowedSizes = ['100', '125', '150', '200'];
  const setSize = (size) => {
    const value = allowedSizes.includes(size) ? size : '100';
    document.documentElement.style.fontSize = `${value}%`;
    sizeControl.value = value;
  };
  if (sizeControl) {
    try { setSize(localStorage.getItem('vduda:text-size')); } catch { setSize('100'); }
    sizeControl.addEventListener('change', () => {
      setSize(sizeControl.value);
      try { localStorage.setItem('vduda:text-size', sizeControl.value); } catch { /* Preferences are optional. */ }
    });
    document.querySelector('.reading-controls').hidden = false;
  }

  const form = document.querySelector('#reading-filters');
  if (!form) return;
  const overview = document.querySelector('#overview-year');
  const entries = [...document.querySelectorAll('.book-entry')];
  const groups = [...document.querySelectorAll('[data-reading-year]')];
  const status = document.querySelector('#reading-results');
  const empty = document.querySelector('#reading-empty');
  const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  const text = new Map(entries.map(entry => [entry, normalize(
    `${entry.dataset.title} ${entry.dataset.author} ${entry.dataset.category}`
  )]));
  const scoreOrder = (a, b) => Number(b.dataset.score) - Number(a.dataset.score)
    || Number(b.dataset.row) - Number(a.dataset.row);
  const recentOrder = (a, b) => Number(b.dataset.year) - Number(a.dataset.year) || scoreOrder(a, b);
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const updateOverview = () => {
    const year = overview.value;
    const scoped = entries.filter(entry => !year || entry.dataset.year === year);
    document.querySelector('#category-scope').textContent = year ? `Categories in ${year}.` : 'Categories across all reading years.';
    document.querySelector('#overview-status').textContent = `${year || 'All years'} · ${scoped.length} ${scoped.length === 1 ? 'entry' : 'entries'}`;
    const categoryCounts = new Map();
    for (const entry of scoped) categoryCounts.set(entry.dataset.category, (categoryCounts.get(entry.dataset.category) || 0) + 1);
    const maximum = Math.max(1, ...categoryCounts.values());
    for (const row of document.querySelectorAll('[data-chart-category]')) {
      const count = categoryCounts.get(row.dataset.chartCategory) || 0;
      row.querySelector('.category-count').textContent = count;
      row.querySelector('.bar-fill').style.width = `${count / maximum * 100}%`;
    }
    const seen = new Set();
    const top = [...scoped].sort(recentOrder).filter(entry => {
      const title = normalize(entry.dataset.title);
      if (seen.has(title)) return false;
      seen.add(title);
      return true;
    }).slice(0, 5);
    document.querySelector('#recent-title').textContent = year ? `Top reads from ${year}` : 'Five recent reads';
    const fragment = document.createDocumentFragment();
    for (const entry of top) {
      const book = entry.dataset;
      const row = element('li');
      const details = element('div');
      details.append(element('h3', '', book.title), element('p', 'book-author', book.author));
      const meta = element('p', 'ranked-meta', `${book.category} · `);
      const time = element('time', '', `Read in ${book.year}`);
      time.dateTime = book.year;
      meta.append(time);
      details.append(meta);
      const score = element('p', 'book-score');
      score.append(element('span', 'visually-hidden', 'Personal score: '), document.createTextNode(`${book.score}/10`));
      row.append(details, score);
      fragment.append(row);
    }
    document.querySelector('#recent-books').replaceChildren(fragment);
  };
  let announcement;
  const apply = () => {
    const words = normalize(form.elements.search.value).trim().split(/\s+/).filter(Boolean);
    const category = form.elements.category.value;
    const year = overview.value;
    const sorting = form.elements.sort.value;
    const active = Boolean(words.length || category || year);
    let count = 0;
    for (const group of groups) {
      const books = entries.filter(entry => entry.dataset.year === group.dataset.readingYear);
      books.sort((a, b) => sorting === 'title'
        ? a.dataset.title.localeCompare(b.dataset.title, undefined, {sensitivity: 'base'}) || scoreOrder(a, b)
        : scoreOrder(a, b));
      let groupCount = 0;
      const fragment = document.createDocumentFragment();
      for (const entry of books) {
        const matches = words.every(word => text.get(entry).includes(word))
          && (!category || entry.dataset.category === category)
          && (!year || entry.dataset.year === year);
        entry.hidden = !matches;
        if (matches) { count++; groupCount++; }
        fragment.append(entry);
      }
      group.querySelector('.year-book-list').append(fragment);
      group.hidden = groupCount === 0;
      group.querySelector('[data-year-count]').textContent = `${groupCount} ${groupCount === 1 ? 'entry' : 'entries'}`;
      if (active && groupCount) group.open = true;
    }
    empty.hidden = count !== 0;
    clearTimeout(announcement);
    announcement = setTimeout(() => {
      status.textContent = `${count} of ${entries.length} reading ${count === 1 ? 'entry' : 'entries'}`;
    }, 200);
  };
  form.hidden = false;
  document.querySelector('.overview-controls').hidden = false;
  overview.addEventListener('change', () => { updateOverview(); apply(); });
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => setTimeout(() => {
    overview.value = '';
    groups.forEach(group => { group.open = false; });
    updateOverview();
    apply();
  }, 0));
  // The native disclosures remain user-controlled; loading the page never opens the archive.
  updateOverview();
})();
