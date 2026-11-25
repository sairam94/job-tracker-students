(() => {
  'use strict';

  const STORAGE_KEY = 'rolebook_applications_v1';
  const STATUSES = ['Applied', 'Interviewing', 'Offer', 'Rejected'];
  const STATUS_META = {
    Applied: { color: '#2563eb', order: 1 },
    Interviewing: { color: '#d97706', order: 2 },
    Offer: { color: '#16a34a', order: 3 },
    Rejected: { color: '#dc2626', order: 4 },
  };

  // Seed data loaded only on first visit when localStorage has never been initialized
  const SAMPLE_APPLICATIONS = [
    {
      id: 'app-sample-1',
      company: 'Linear',
      role: 'Product Engineer',
      location: 'Remote, US / EU',
      dateApplied: '2026-11-22',
      status: 'Interviewing',
      jobLink: 'https://linear.app/careers',
      notes: 'Completed technical architecture chat with engineering manager. System design round scheduled for Thursday.',
    },
    {
      id: 'app-sample-2',
      company: 'Stripe',
      role: 'Senior Frontend Engineer',
      location: 'Seattle, WA',
      dateApplied: '2026-11-18',
      status: 'Offer',
      jobLink: 'https://stripe.com/jobs',
      notes: 'Verbal offer received after final panel. Reviewing total compensation breakdown and start date.',
    },
    {
      id: 'app-sample-3',
      company: 'Figma',
      role: 'Design Systems Engineer',
      location: 'San Francisco, CA',
      dateApplied: '2026-11-20',
      status: 'Interviewing',
      jobLink: 'https://www.figma.com/careers/',
      notes: 'Submitted component accessibility walkthrough. Recruiter confirmed feedback by early next week.',
    },
    {
      id: 'app-sample-4',
      company: 'Datadog',
      role: 'Staff UI Engineer',
      location: 'New York, NY',
      dateApplied: '2026-11-24',
      status: 'Applied',
      jobLink: 'https://careers.datadoghq.com/',
      notes: 'Applied directly on careers portal with referral from Maya on the observability dashboards team.',
    },
    {
      id: 'app-sample-5',
      company: 'Vercel',
      role: 'Frontend Infrastructure Engineer',
      location: 'Remote',
      dateApplied: '2026-11-19',
      status: 'Applied',
      jobLink: 'https://vercel.com/careers',
      notes: 'Tailored resume for build tooling and edge rendering experience.',
    },
    {
      id: 'app-sample-6',
      company: 'Plaid',
      role: 'Full Stack Software Engineer',
      location: 'San Francisco, CA',
      dateApplied: '2026-11-14',
      status: 'Applied',
      jobLink: 'https://plaid.com/careers/',
      notes: 'Follow up with recruiter if no update by Nov 28.',
    },
    {
      id: 'app-sample-7',
      company: 'Airbnb',
      role: 'Senior Web Engineer',
      location: 'Remote, US',
      dateApplied: '2026-11-08',
      status: 'Rejected',
      jobLink: 'https://careers.airbnb.com/',
      notes: 'Role filled internally after hiring manager screen. Kept positive connection for Q1 openings.',
    },
  ];

  // Application State
  const state = {
    applications: [],
    searchQuery: '',
    statusFilter: 'All',
    sortBy: 'date-desc',
    editingId: null,
    pendingDeleteId: null,
    lastDeleted: null,
    lastFocusEl: null,
  };

  // DOM References
  const dom = {
    overviewSubtitle: document.getElementById('overview-subtitle'),
    countTotal: document.getElementById('count-total'),
    metaTotal: document.getElementById('meta-total'),
    countApplied: document.getElementById('count-applied'),
    pctApplied: document.getElementById('pct-applied'),
    countInterviewing: document.getElementById('count-interviewing'),
    pctInterviewing: document.getElementById('pct-interviewing'),
    countOffer: document.getElementById('count-offer'),
    pctOffer: document.getElementById('pct-offer'),
    countRejected: document.getElementById('count-rejected'),
    pctRejected: document.getElementById('pct-rejected'),
    kpiCells: document.querySelectorAll('.kpi-cell'),

    chartSvg: document.getElementById('status-bar-chart'),
    chartStage: document.getElementById('chart-stage'),
    chartTooltip: document.getElementById('chart-tooltip'),
    chartResetFilter: document.getElementById('chart-reset-filter'),

    metricActive: document.getElementById('metric-active'),
    metricInterviewRate: document.getElementById('metric-interview-rate'),
    metricOfferRate: document.getElementById('metric-offer-rate'),
    metricLatest: document.getElementById('metric-latest'),

    resultsSummary: document.getElementById('results-summary'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    segmentBtns: document.querySelectorAll('.segment-btn'),
    sortSelect: document.getElementById('sort-select'),
    exportCsvBtn: document.getElementById('export-csv-btn'),

    tableWrap: document.getElementById('table-wrap'),
    tbody: document.getElementById('applications-tbody'),
    emptyState: document.getElementById('empty-state'),
    noMatchesState: document.getElementById('no-matches-state'),
    noMatchesTitle: document.getElementById('no-matches-title'),
    noMatchesDescription: document.getElementById('no-matches-description'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    emptyAddBtn: document.getElementById('empty-add-btn'),
    loadSampleBtn: document.getElementById('load-sample-btn'),

    openAddBtn: document.getElementById('open-add-btn'),
    appModal: document.getElementById('application-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalDeleteBtn: document.getElementById('modal-delete-btn'),
    modalSubmitBtn: document.getElementById('modal-submit-btn'),
    form: document.getElementById('application-form'),

    fieldId: document.getElementById('field-id'),
    fieldCompany: document.getElementById('field-company'),
    fieldRole: document.getElementById('field-role'),
    fieldLocation: document.getElementById('field-location'),
    fieldDate: document.getElementById('field-date'),
    fieldStatus: document.getElementById('field-status'),
    fieldLink: document.getElementById('field-link'),
    fieldNotes: document.getElementById('field-notes'),

    errorCompany: document.getElementById('error-company'),
    errorRole: document.getElementById('error-role'),
    errorDate: document.getElementById('error-date'),
    errorLink: document.getElementById('error-link'),

    deleteModal: document.getElementById('delete-modal'),
    deleteModalDesc: document.getElementById('delete-modal-desc'),
    deleteCloseBtn: document.getElementById('delete-close-btn'),
    deleteCancelBtn: document.getElementById('delete-cancel-btn'),
    deleteConfirmBtn: document.getElementById('delete-confirm-btn'),

    toastRegion: document.getElementById('toast-region'),
  };

  /* --------------------------------------------------------------------------
     Utilities
     -------------------------------------------------------------------------- */

  function getTodayIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function generateId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `app-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function sanitizeUrl(rawUrl) {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) return '';
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
      return null;
    } catch {
      return null;
    }
  }

  function isValidDateString(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate || !isValidDateString(isoDate)) return '—';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatPercent(part, total) {
    if (!total) return '0%';
    return `${Math.round((part / total) * 100)}%`;
  }

  function normalizeRecord(raw) {
    const status = STATUSES.includes(raw.status) ? raw.status : 'Applied';
    const safeLink = raw.jobLink ? sanitizeUrl(raw.jobLink) || '' : '';
    return {
      id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : generateId(),
      company: String(raw.company || '').trim(),
      role: String(raw.role || '').trim(),
      location: String(raw.location || '').trim(),
      dateApplied: isValidDateString(String(raw.dateApplied || ''))
        ? String(raw.dateApplied)
        : getTodayIso(),
      status,
      jobLink: safeLink,
      notes: String(raw.notes || '').trim(),
    };
  }

  /* --------------------------------------------------------------------------
     localStorage Persistence
     -------------------------------------------------------------------------- */

  function loadApplications() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        const seeded = SAMPLE_APPLICATIONS.map(normalizeRecord);
        saveApplications(seeded);
        return seeded;
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter((item) => item && typeof item === 'object')
        .map(normalizeRecord)
        .filter((item) => item.company && item.role);
    } catch {
      return SAMPLE_APPLICATIONS.map(normalizeRecord);
    }
  }

  function saveApplications(list) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      showToast('Unable to save to browser storage. Check storage quota or privacy settings.');
    }
  }

  /* --------------------------------------------------------------------------
     Derived Metrics & Filtering
     -------------------------------------------------------------------------- */

  function computeCounts(list) {
    const counts = {
      Total: list.length,
      Applied: 0,
      Interviewing: 0,
      Offer: 0,
      Rejected: 0,
    };
    for (const app of list) {
      if (Object.prototype.hasOwnProperty.call(counts, app.status)) {
        counts[app.status] += 1;
      }
    }
    return counts;
  }

  function getFilteredApplications() {
    const query = state.searchQuery.trim().toLowerCase();
    const filtered = state.applications.filter((app) => {
      if (state.statusFilter !== 'All' && app.status !== state.statusFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        app.company,
        app.role,
        app.location,
        app.status,
        app.notes,
        app.dateApplied,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const sorted = filtered.slice();
    sorted.sort((a, b) => {
      if (state.sortBy === 'date-asc') {
        return a.dateApplied.localeCompare(b.dateApplied) || a.company.localeCompare(b.company);
      }
      if (state.sortBy === 'company-asc') {
        return a.company.localeCompare(b.company) || b.dateApplied.localeCompare(a.dateApplied);
      }
      if (state.sortBy === 'status') {
        return (
          STATUS_META[a.status].order - STATUS_META[b.status].order ||
          b.dateApplied.localeCompare(a.dateApplied)
        );
      }
      // Default: newest applied first
      return b.dateApplied.localeCompare(a.dateApplied) || a.company.localeCompare(b.company);
    });

    return sorted;
  }

  /* --------------------------------------------------------------------------
     Rendering: Dashboard Counts & Summary
     -------------------------------------------------------------------------- */

  function renderDashboard(counts) {
    const total = counts.Total;

    dom.countTotal.textContent = String(total);
    dom.metaTotal.textContent =
      total === 1 ? '1 tracked role' : `${total} tracked roles`;

    dom.countApplied.textContent = String(counts.Applied);
    dom.pctApplied.textContent = `${formatPercent(counts.Applied, total)} of total`;

    dom.countInterviewing.textContent = String(counts.Interviewing);
    dom.pctInterviewing.textContent = `${formatPercent(counts.Interviewing, total)} of total`;

    dom.countOffer.textContent = String(counts.Offer);
    dom.pctOffer.textContent = `${formatPercent(counts.Offer, total)} of total`;

    dom.countRejected.textContent = String(counts.Rejected);
    dom.pctRejected.textContent = `${formatPercent(counts.Rejected, total)} of total`;

    const activeCount = counts.Applied + counts.Interviewing;
    const progressedCount = counts.Interviewing + counts.Offer;

    dom.metricActive.textContent = String(activeCount);
    dom.metricInterviewRate.textContent = formatPercent(progressedCount, total);
    dom.metricOfferRate.textContent = formatPercent(counts.Offer, total);

    if (total === 0) {
      dom.metricLatest.textContent = '—';
      dom.metricLatest.removeAttribute('title');
      dom.overviewSubtitle.textContent =
        'Add your first job application to track stages, notes, and outcomes.';
    } else {
      const latest = state.applications.reduce((best, cur) =>
        cur.dateApplied > best.dateApplied ? cur : best
      );
      const latestText = `${latest.company} · ${formatDisplayDate(latest.dateApplied)}`;
      dom.metricLatest.textContent = latestText;
      dom.metricLatest.title = `${latest.company} — ${latest.role} (${formatDisplayDate(latest.dateApplied)})`;
      dom.overviewSubtitle.textContent =
        `Tracking ${total} ${total === 1 ? 'application' : 'applications'} · ${activeCount} currently active`;
    }

    // Sync active state on KPI cells
    dom.kpiCells.forEach((cell) => {
      const target = cell.getAttribute('data-status-filter');
      const isActive = target === state.statusFilter;
      cell.classList.toggle('is-active', isActive);
      cell.setAttribute('aria-pressed', String(isActive));
    });

    // Sync segmented tabs
    dom.segmentBtns.forEach((btn) => {
      const target = btn.getAttribute('data-filter');
      const isActive = target === state.statusFilter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    dom.chartResetFilter.hidden = state.statusFilter === 'All';
  }

  /* --------------------------------------------------------------------------
     Rendering: Interactive SVG Bar Chart
     -------------------------------------------------------------------------- */

  function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, val] of Object.entries(attrs)) {
      el.setAttribute(key, String(val));
    }
    return el;
  }

  function renderBarChart(counts) {
    const svg = dom.chartSvg;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    dom.chartTooltip.hidden = true;

    const width = 640;
    const height = 248;
    const pad = { top: 28, right: 20, bottom: 38, left: 42 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const maxCount = Math.max(
      counts.Applied,
      counts.Interviewing,
      counts.Offer,
      counts.Rejected,
      0
    );

    // Compute clean integer Y-axis ticks (always at least 4 so empty chart looks balanced)
    const tickCount = 4;
    const step = Math.max(1, Math.ceil(Math.max(maxCount, 4) / tickCount));
    const yMax = step * tickCount;

    // Horizontal gridlines & Y-axis labels
    for (let i = 0; i <= tickCount; i += 1) {
      const val = i * step;
      const y = pad.top + plotH - (val / yMax) * plotH;

      svg.appendChild(
        createSvgEl('line', {
          x1: pad.left,
          y1: y,
          x2: width - pad.right,
          y2: y,
          class: i === 0 ? 'chart-axis-line' : 'chart-grid-line',
        })
      );

      const yLabel = createSvgEl('text', {
        x: pad.left - 12,
        y: y + 4,
        'text-anchor': 'end',
        class: 'chart-y-label',
      });
      yLabel.textContent = String(val);
      svg.appendChild(yLabel);
    }

    // Bars
    const slotW = plotW / STATUSES.length;
    const barW = Math.min(72, slotW * 0.46);
    const total = counts.Total;

    STATUSES.forEach((status, index) => {
      const count = counts[status];
      const barH = yMax > 0 ? (count / yMax) * plotH : 0;
      const centerX = pad.left + slotW * index + slotW / 2;
      const barX = centerX - barW / 2;
      const barY = pad.top + plotH - barH;
      const isDimmed = state.statusFilter !== 'All' && state.statusFilter !== status;

      const group = createSvgEl('g', {
        class: `chart-bar-group${isDimmed ? ' is-dimmed' : ''}`,
        tabindex: '0',
        role: 'button',
        'aria-label': `${status}: ${count} ${count === 1 ? 'application' : 'applications'} (${formatPercent(count, total)}). Click to filter.`,
      });

      // Invisible full-height hit target so even 0-count bars are easily clickable
      group.appendChild(
        createSvgEl('rect', {
          x: pad.left + slotW * index + 8,
          y: pad.top,
          width: slotW - 16,
          height: plotH + 28,
          fill: 'transparent',
        })
      );

      // Visible bar rectangle (minimum 2px subtle baseline notch when count is 0)
      const renderH = count > 0 ? Math.max(barH, 4) : 2;
      const renderY = pad.top + plotH - renderH;
      const barRect = createSvgEl('rect', {
        x: barX,
        y: renderY,
        width: barW,
        height: renderH,
        rx: count > 0 ? 4 : 1,
        ry: count > 0 ? 4 : 1,
        fill: count > 0 ? STATUS_META[status].color : '#cbd5e1',
        class: 'chart-bar-rect',
      });
      group.appendChild(barRect);

      // Exact count label above bar
      const valText = createSvgEl('text', {
        x: centerX,
        y: renderY - 8,
        'text-anchor': 'middle',
        class: 'chart-bar-value',
      });
      valText.textContent = String(count);
      group.appendChild(valText);

      // X-axis status label
      const xLabel = createSvgEl('text', {
        x: centerX,
        y: pad.top + plotH + 24,
        'text-anchor': 'middle',
        class: 'chart-x-label',
      });
      xLabel.textContent = status;
      group.appendChild(xLabel);

      // Interactive filter on click or Enter/Space
      const toggleStatus = () => {
        state.statusFilter = state.statusFilter === status ? 'All' : status;
        render();
      };

      group.addEventListener('click', toggleStatus);
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleStatus();
        }
      });

      // Hover tooltip positioning
      const showTooltip = () => {
        const pct = formatPercent(count, total);
        dom.chartTooltip.textContent = '';
        const titleNode = document.createTextNode(`${status}: `);
        const strongNode = document.createElement('strong');
        strongNode.textContent = `${count}`;
        const shareNode = document.createTextNode(
          ` (${pct} of total)`
        );
        dom.chartTooltip.appendChild(titleNode);
        dom.chartTooltip.appendChild(strongNode);
        dom.chartTooltip.appendChild(shareNode);

        const stageRect = dom.chartStage.getBoundingClientRect();
        const barBox = barRect.getBoundingClientRect();
        const leftPx = barBox.left - stageRect.left + barBox.width / 2;
        const topPx = Math.max(24, barBox.top - stageRect.top - 10);

        dom.chartTooltip.style.left = `${leftPx}px`;
        dom.chartTooltip.style.top = `${topPx}px`;
        dom.chartTooltip.hidden = false;
      };

      const hideTooltip = () => {
        dom.chartTooltip.hidden = true;
      };

      group.addEventListener('mouseenter', showTooltip);
      group.addEventListener('mouseleave', hideTooltip);
      group.addEventListener('focus', showTooltip);
      group.addEventListener('blur', hideTooltip);

      svg.appendChild(group);
    });
  }

  /* --------------------------------------------------------------------------
     Rendering: Applications Table
     -------------------------------------------------------------------------- */

  function createIconSvg(kind) {
    const svg = createSvgEl('svg', {
      width: 15,
      height: 15,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    });

    if (kind === 'external') {
      svg.appendChild(createSvgEl('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }));
      svg.appendChild(createSvgEl('polyline', { points: '15 3 21 3 21 9' }));
      svg.appendChild(createSvgEl('line', { x1: 10, y1: 14, x2: 21, y2: 3 }));
    } else if (kind === 'edit') {
      svg.appendChild(createSvgEl('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }));
      svg.appendChild(createSvgEl('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' }));
    } else if (kind === 'delete') {
      svg.appendChild(createSvgEl('polyline', { points: '3 6 5 6 21 6' }));
      svg.appendChild(createSvgEl('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }));
    }

    return svg;
  }

  function renderTable(filteredList) {
    const totalCount = state.applications.length;
    const shownCount = filteredList.length;

    dom.clearSearchBtn.hidden = state.searchQuery.length === 0;
    dom.exportCsvBtn.disabled = totalCount === 0;
    dom.exportCsvBtn.style.opacity = totalCount === 0 ? '0.5' : '1';

    if (totalCount === 0) {
      dom.resultsSummary.textContent = '0 applications';
      dom.tableWrap.hidden = true;
      dom.noMatchesState.hidden = true;
      dom.emptyState.hidden = false;
      return;
    }

    if (shownCount === 0) {
      dom.resultsSummary.textContent = `0 of ${totalCount} applications`;
      dom.tableWrap.hidden = true;
      dom.emptyState.hidden = true;
      dom.noMatchesState.hidden = false;

      if (state.searchQuery.trim()) {
        dom.noMatchesTitle.textContent = `No applications match "${state.searchQuery.trim()}"`;
      } else {
        dom.noMatchesTitle.textContent = `No applications in ${state.statusFilter}`;
      }
      return;
    }

    dom.tableWrap.hidden = false;
    dom.emptyState.hidden = true;
    dom.noMatchesState.hidden = true;

    if (shownCount === totalCount) {
      dom.resultsSummary.textContent =
        `${totalCount} ${totalCount === 1 ? 'application' : 'applications'}`;
    } else {
      dom.resultsSummary.textContent = `Showing ${shownCount} of ${totalCount} applications`;
    }

    const fragment = document.createDocumentFragment();

    filteredList.forEach((app) => {
      const tr = document.createElement('tr');
      tr.dataset.id = app.id;

      // Clicking the row opens the edit modal (ignoring clicks on interactive controls)
      tr.addEventListener('click', (event) => {
        if (event.target.closest('button, a, select')) return;
        openEditModal(app.id, tr);
      });

      // 1. Company
      const tdCompany = document.createElement('td');
      const companySpan = document.createElement('span');
      companySpan.className = 'cell-company-name';
      companySpan.textContent = app.company;
      tdCompany.appendChild(companySpan);
      tr.appendChild(tdCompany);

      // 2. Role (+ optional external link)
      const tdRole = document.createElement('td');
      const roleWrap = document.createElement('div');
      roleWrap.className = 'cell-role-wrap';

      const roleSpan = document.createElement('span');
      roleSpan.className = 'cell-role-title';
      roleSpan.textContent = app.role;
      roleWrap.appendChild(roleSpan);

      if (app.jobLink) {
        const linkEl = document.createElement('a');
        linkEl.href = app.jobLink;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer';
        linkEl.className = 'job-link-icon';
        linkEl.title = `Open job posting at ${app.company}`;
        linkEl.setAttribute('aria-label', `Open job posting for ${app.role} at ${app.company}`);
        linkEl.appendChild(createIconSvg('external'));
        roleWrap.appendChild(linkEl);
      }

      tdRole.appendChild(roleWrap);
      tr.appendChild(tdRole);

      // 3. Location
      const tdLocation = document.createElement('td');
      tdLocation.className = 'cell-location';
      tdLocation.textContent = app.location || '—';
      tr.appendChild(tdLocation);

      // 4. Date applied
      const tdDate = document.createElement('td');
      tdDate.className = 'cell-date';
      tdDate.textContent = formatDisplayDate(app.dateApplied);
      tr.appendChild(tdDate);

      // 5. Status (clean unboxed inline selector)
      const tdStatus = document.createElement('td');
      const statusSelect = document.createElement('select');
      statusSelect.className = 'status-inline-select';
      statusSelect.dataset.status = app.status;
      statusSelect.setAttribute(
        'aria-label',
        `Status for ${app.company} ${app.role}`
      );

      STATUSES.forEach((st) => {
        const option = document.createElement('option');
        option.value = st;
        option.textContent = st;
        option.selected = st === app.status;
        statusSelect.appendChild(option);
      });

      statusSelect.addEventListener('change', (event) => {
        const nextStatus = event.target.value;
        updateApplicationStatus(app.id, nextStatus);
      });

      tdStatus.appendChild(statusSelect);
      tr.appendChild(tdStatus);

      // 6. Notes preview
      const tdNotes = document.createElement('td');
      tdNotes.className = 'cell-notes';
      tdNotes.textContent = app.notes || '—';
      if (app.notes) {
        tdNotes.title = app.notes;
      }
      tr.appendChild(tdNotes);

      // 7. Row Actions (Edit & Delete)
      const tdActions = document.createElement('td');
      tdActions.className = 'cell-actions';

      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'row-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'icon-btn';
      editBtn.title = 'Edit application';
      editBtn.setAttribute('aria-label', `Edit ${app.company} ${app.role}`);
      editBtn.appendChild(createIconSvg('edit'));
      editBtn.addEventListener('click', () => openEditModal(app.id, editBtn));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn icon-btn-danger';
      deleteBtn.title = 'Delete application';
      deleteBtn.setAttribute('aria-label', `Delete ${app.company} ${app.role}`);
      deleteBtn.appendChild(createIconSvg('delete'));
      deleteBtn.addEventListener('click', () => openDeleteModal(app.id, deleteBtn));

      actionsWrap.appendChild(editBtn);
      actionsWrap.appendChild(deleteBtn);
      tdActions.appendChild(actionsWrap);
      tr.appendChild(tdActions);

      fragment.appendChild(tr);
    });

    dom.tbody.textContent = '';
    dom.tbody.appendChild(fragment);
  }

  function render() {
    const counts = computeCounts(state.applications);
    const filtered = getFilteredApplications();
    renderDashboard(counts);
    renderBarChart(counts);
    renderTable(filtered);
  }

  /* --------------------------------------------------------------------------
     CRUD Operations
     -------------------------------------------------------------------------- */

  function updateApplicationStatus(id, nextStatus) {
    if (!STATUSES.includes(nextStatus)) return;
    const target = state.applications.find((item) => item.id === id);
    if (!target || target.status === nextStatus) return;

    target.status = nextStatus;
    saveApplications(state.applications);
    render();
    showToast(`Moved ${target.company} to ${nextStatus}`);
  }

  function upsertApplication(payload) {
    if (state.editingId) {
      const idx = state.applications.findIndex((item) => item.id === state.editingId);
      if (idx !== -1) {
        state.applications[idx] = { ...payload, id: state.editingId };
        saveApplications(state.applications);
        render();
        showToast(`Updated ${payload.company}`);
        return;
      }
    }

    const newRecord = { ...payload, id: generateId() };
    state.applications.unshift(newRecord);
    saveApplications(state.applications);
    render();
    showToast(`Added ${newRecord.company} — ${newRecord.role}`);
  }

  function deleteApplication(id) {
    const idx = state.applications.findIndex((item) => item.id === id);
    if (idx === -1) return;

    const [removed] = state.applications.splice(idx, 1);
    state.lastDeleted = { record: removed, index: idx };
    saveApplications(state.applications);
    render();

    showToast(`Deleted ${removed.company}`, {
      undoLabel: 'Undo',
      onUndo: () => {
        if (!state.lastDeleted) return;
        const insertAt = Math.min(state.lastDeleted.index, state.applications.length);
        state.applications.splice(insertAt, 0, state.lastDeleted.record);
        const restoredName = state.lastDeleted.record.company;
        state.lastDeleted = null;
        saveApplications(state.applications);
        render();
        showToast(`Restored ${restoredName}`);
      },
    });
  }

  /* --------------------------------------------------------------------------
     Add / Edit Modal
     -------------------------------------------------------------------------- */

  function clearFormErrors() {
    dom.errorCompany.textContent = '';
    dom.errorRole.textContent = '';
    dom.errorDate.textContent = '';
    dom.errorLink.textContent = '';
    dom.fieldCompany.classList.remove('is-invalid');
    dom.fieldRole.classList.remove('is-invalid');
    dom.fieldDate.classList.remove('is-invalid');
    dom.fieldLink.classList.remove('is-invalid');
  }

  function openAddModal(triggerEl) {
    state.editingId = null;
    state.lastFocusEl = triggerEl || document.activeElement;
    clearFormErrors();

    dom.modalTitle.textContent = 'Add application';
    dom.modalSubmitBtn.textContent = 'Add application';
    dom.modalDeleteBtn.hidden = true;

    dom.fieldId.value = '';
    dom.fieldCompany.value = '';
    dom.fieldRole.value = '';
    dom.fieldLocation.value = '';
    dom.fieldDate.value = getTodayIso();
    dom.fieldStatus.value = state.statusFilter !== 'All' ? state.statusFilter : 'Applied';
    dom.fieldLink.value = '';
    dom.fieldNotes.value = '';

    dom.appModal.hidden = false;
    dom.fieldCompany.focus();
  }

  function openEditModal(id, triggerEl) {
    const app = state.applications.find((item) => item.id === id);
    if (!app) return;

    state.editingId = app.id;
    state.lastFocusEl = triggerEl || document.activeElement;
    clearFormErrors();

    dom.modalTitle.textContent = 'Edit application';
    dom.modalSubmitBtn.textContent = 'Save changes';
    dom.modalDeleteBtn.hidden = false;

    dom.fieldId.value = app.id;
    dom.fieldCompany.value = app.company;
    dom.fieldRole.value = app.role;
    dom.fieldLocation.value = app.location;
    dom.fieldDate.value = app.dateApplied;
    dom.fieldStatus.value = app.status;
    dom.fieldLink.value = app.jobLink;
    dom.fieldNotes.value = app.notes;

    dom.appModal.hidden = false;
    dom.fieldCompany.focus();
  }

  function closeAppModal() {
    dom.appModal.hidden = true;
    state.editingId = null;
    if (state.lastFocusEl && typeof state.lastFocusEl.focus === 'function') {
      state.lastFocusEl.focus();
    }
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    clearFormErrors();

    const company = dom.fieldCompany.value.trim();
    const role = dom.fieldRole.value.trim();
    const location = dom.fieldLocation.value.trim();
    const dateApplied = dom.fieldDate.value.trim();
    const status = STATUSES.includes(dom.fieldStatus.value) ? dom.fieldStatus.value : 'Applied';
    const rawLink = dom.fieldLink.value.trim();
    const notes = dom.fieldNotes.value.trim();

    let firstInvalid = null;

    if (!company) {
      dom.errorCompany.textContent = 'Enter a company name.';
      dom.fieldCompany.classList.add('is-invalid');
      firstInvalid = firstInvalid || dom.fieldCompany;
    }

    if (!role) {
      dom.errorRole.textContent = 'Enter a role or job title.';
      dom.fieldRole.classList.add('is-invalid');
      firstInvalid = firstInvalid || dom.fieldRole;
    }

    if (!isValidDateString(dateApplied)) {
      dom.errorDate.textContent = 'Select a valid date applied.';
      dom.fieldDate.classList.add('is-invalid');
      firstInvalid = firstInvalid || dom.fieldDate;
    }

    let safeLink = '';
    if (rawLink) {
      const validated = sanitizeUrl(rawLink);
      if (!validated) {
        dom.errorLink.textContent = 'Enter a valid http:// or https:// job URL.';
        dom.fieldLink.classList.add('is-invalid');
        firstInvalid = firstInvalid || dom.fieldLink;
      } else {
        safeLink = validated;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    upsertApplication({
      company,
      role,
      location,
      dateApplied,
      status,
      jobLink: safeLink,
      notes,
    });

    closeAppModal();
  }

  /* --------------------------------------------------------------------------
     Delete Confirmation Modal
     -------------------------------------------------------------------------- */

  function openDeleteModal(id, triggerEl) {
    const app = state.applications.find((item) => item.id === id);
    if (!app) return;

    state.pendingDeleteId = id;
    state.lastFocusEl = triggerEl || document.activeElement;
    dom.deleteModalDesc.textContent =
      `Remove your ${app.role} application at ${app.company}? You can undo right after deleting.`;

    dom.deleteModal.hidden = false;
    dom.deleteConfirmBtn.focus();
  }

  function closeDeleteModal() {
    dom.deleteModal.hidden = true;
    state.pendingDeleteId = null;
    if (state.lastFocusEl && typeof state.lastFocusEl.focus === 'function') {
      state.lastFocusEl.focus();
    }
  }

  /* --------------------------------------------------------------------------
     CSV Export
     -------------------------------------------------------------------------- */

  function escapeCsvCell(value) {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportCsv() {
    if (state.applications.length === 0) return;

    const headers = [
      'Company',
      'Role',
      'Location',
      'Date Applied',
      'Status',
      'Job Link',
      'Notes',
    ];
    const rows = state.applications.map((app) =>
      [
        app.company,
        app.role,
        app.location,
        app.dateApplied,
        app.status,
        app.jobLink,
        app.notes,
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `rolebook-applications-${getTodayIso()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${state.applications.length} applications to CSV`);
  }

  /* --------------------------------------------------------------------------
     Toast Notifications
     -------------------------------------------------------------------------- */

  let toastTimer = null;

  function showToast(message, options = {}) {
    if (toastTimer) {
      window.clearTimeout(toastTimer);
      toastTimer = null;
    }

    dom.toastRegion.textContent = '';

    const toast = document.createElement('div');
    toast.className = 'toast';

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (options.undoLabel && typeof options.onUndo === 'function') {
      const undoBtn = document.createElement('button');
      undoBtn.type = 'button';
      undoBtn.className = 'toast-undo-btn';
      undoBtn.textContent = options.undoLabel;
      undoBtn.addEventListener('click', () => {
        if (toastTimer) window.clearTimeout(toastTimer);
        dom.toastRegion.textContent = '';
        options.onUndo();
      });
      toast.appendChild(undoBtn);
    }

    dom.toastRegion.appendChild(toast);

    toastTimer = window.setTimeout(() => {
      dom.toastRegion.textContent = '';
      toastTimer = null;
    }, options.undoLabel ? 6000 : 3200);
  }

  /* --------------------------------------------------------------------------
     Event Wiring & Initialization
     -------------------------------------------------------------------------- */

  function bindEvents() {
    dom.openAddBtn.addEventListener('click', () => openAddModal(dom.openAddBtn));
    dom.emptyAddBtn.addEventListener('click', () => openAddModal(dom.emptyAddBtn));

    dom.loadSampleBtn.addEventListener('click', () => {
      state.applications = SAMPLE_APPLICATIONS.map(normalizeRecord);
      state.searchQuery = '';
      state.statusFilter = 'All';
      dom.searchInput.value = '';
      saveApplications(state.applications);
      render();
      showToast('Loaded sample applications');
    });

    // KPI Strip filter buttons
    dom.kpiCells.forEach((cell) => {
      cell.addEventListener('click', () => {
        const nextFilter = cell.getAttribute('data-status-filter') || 'All';
        if (nextFilter !== 'All' && state.statusFilter === nextFilter) {
          state.statusFilter = 'All';
        } else {
          state.statusFilter = nextFilter;
        }
        render();
      });
    });

    // Segmented status tabs
    dom.segmentBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.statusFilter = btn.getAttribute('data-filter') || 'All';
        render();
      });
    });

    dom.chartResetFilter.addEventListener('click', () => {
      state.statusFilter = 'All';
      render();
    });

    // Search & Sort
    dom.searchInput.addEventListener('input', (event) => {
      state.searchQuery = event.target.value;
      render();
    });

    dom.clearSearchBtn.addEventListener('click', () => {
      state.searchQuery = '';
      dom.searchInput.value = '';
      dom.searchInput.focus();
      render();
    });

    dom.sortSelect.addEventListener('change', (event) => {
      state.sortBy = event.target.value;
      render();
    });

    dom.resetFiltersBtn.addEventListener('click', () => {
      state.searchQuery = '';
      state.statusFilter = 'All';
      dom.searchInput.value = '';
      render();
    });

    dom.exportCsvBtn.addEventListener('click', exportCsv);

    // Add / Edit Modal handlers
    dom.form.addEventListener('submit', handleFormSubmit);
    dom.modalCloseBtn.addEventListener('click', closeAppModal);
    dom.modalCancelBtn.addEventListener('click', closeAppModal);

    dom.modalDeleteBtn.addEventListener('click', () => {
      const idToDelete = state.editingId;
      if (!idToDelete) return;
      dom.appModal.hidden = true;
      openDeleteModal(idToDelete, dom.openAddBtn);
    });

    dom.appModal.addEventListener('click', (event) => {
      if (event.target === dom.appModal) {
        closeAppModal();
      }
    });

    // Delete Confirmation Modal handlers
    dom.deleteCloseBtn.addEventListener('click', closeDeleteModal);
    dom.deleteCancelBtn.addEventListener('click', closeDeleteModal);
    dom.deleteConfirmBtn.addEventListener('click', () => {
      const idToDelete = state.pendingDeleteId;
      closeDeleteModal();
      if (idToDelete) {
        deleteApplication(idToDelete);
      }
    });

    dom.deleteModal.addEventListener('click', (event) => {
      if (event.target === dom.deleteModal) {
        closeDeleteModal();
      }
    });

    // Global Escape key closes active modal
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!dom.deleteModal.hidden) {
        closeDeleteModal();
      } else if (!dom.appModal.hidden) {
        closeAppModal();
      }
    });
  }

  function init() {
    state.applications = loadApplications();
    bindEvents();
    render();
  }

  init();
})();
