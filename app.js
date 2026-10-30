/* Objection-to-Insight v1.0.0
   Offline-first EdTech sales conversation practice and objection intelligence.
   All scoring and TruthGuard checks are deterministic, local JavaScript rules.
*/
(() => {
  'use strict';

  const APP_NAME = 'Objection-to-Insight';
  const APP_VERSION = '1.0.0';
  const STORAGE_KEY = 'objection-to-insight.workspace.v1';
  const CATEGORIES = [
    'Programme relevance',
    'Timing / readiness',
    'Existing arrangements',
    'Budget / value',
    'Decision / approval',
    'Trust / proof',
    'Other'
  ];
  const OUTCOMES = [
    { value: 'meeting_booked', label: 'Meeting booked' },
    { value: 'follow_up', label: 'Follow-up needed' },
    { value: 'information_shared', label: 'Information shared' },
    { value: 'converted', label: 'Converted' },
    { value: 'not_interested', label: 'Not interested' },
    { value: 'no_response', label: 'No response' }
  ];
  const CHANNELS = ['Call', 'Email', 'WhatsApp', 'Meeting', 'Social media', 'Other'];
  const SCENARIOS = [
    {
      id: 'existing-arrangement',
      title: 'We already have a training partner',
      persona: 'Placement Coordinator',
      category: 'Existing arrangements',
      context: 'The institution already works with another training provider. The coordinator is not rejecting a conversation, but does not see a clear reason to consider an additional option.',
      objection: '“We already have a training partner. Why should we spend time exploring another programme?”',
      intent: 'Understand what is working today and where, if anywhere, an additional option could add value.'
    },
    {
      id: 'student-relevance',
      title: 'Will this be relevant to our students?',
      persona: 'Department Head',
      category: 'Programme relevance',
      context: 'The department head wants to know whether the learning content fits the students’ current skill levels, academic schedule and career interests.',
      objection: '“Our students have different skill levels. How do we know this programme will be relevant to them?”',
      intent: 'Ask about the student cohort and offer to share verified curriculum or programme information.'
    },
    {
      id: 'internal-approval',
      title: 'We need internal approval first',
      persona: 'Institutional Decision-Maker',
      category: 'Decision / approval',
      context: 'The person you contacted is interested but cannot make the decision alone. Other stakeholders will need context before they can review the proposal.',
      objection: '“I need to discuss this with our principal and department team before we can take it forward.”',
      intent: 'Respect the approval process and agree on useful information or a suitable follow-up.'
    },
    {
      id: 'budget-value',
      title: 'We need to understand the cost',
      persona: 'Institution Administrator',
      category: 'Budget / value',
      context: 'The administrator is evaluating the time and financial commitment. You do not have permission to invent or negotiate unapproved pricing.',
      objection: '“We have a limited budget. What value would make this worth considering?”',
      intent: 'Clarify priorities and offer approved pricing and scope information for review.'
    },
    {
      id: 'send-details',
      title: 'Please send details first',
      persona: 'Prospective Institutional Client',
      category: 'Timing / readiness',
      context: 'The prospect is willing to receive information but has not committed to a meeting. A concise, relevant follow-up is more useful than sending a generic brochure.',
      objection: '“Please email the details. We will look at them when we get time.”',
      intent: 'Ask which details would be most useful and agree on a respectful follow-up.'
    },
    {
      id: 'not-right-time',
      title: 'This is not the right time',
      persona: 'Placement Coordinator',
      category: 'Timing / readiness',
      context: 'The institution may be busy with exams, placement activities or another internal priority. You need to understand the timing rather than push for an immediate decision.',
      objection: '“We are occupied with other priorities right now. Please contact us later.”',
      intent: 'Ask for a more appropriate time window and confirm permission to follow up.'
    },
    {
      id: 'proof-outcomes',
      title: 'Can you show evidence of outcomes?',
      persona: 'Department Head',
      category: 'Trust / proof',
      context: 'The prospect wants credible details about the programme, its delivery and any outcomes that can be substantiated. Avoid implying guaranteed placements or salaries.',
      objection: '“Before we consider this, what evidence can you share about programme quality and student outcomes?”',
      intent: 'Offer only approved, verifiable programme information and clarify what evidence the prospect needs.'
    },
    {
      id: 'right-contact',
      title: 'I am not the decision-maker',
      persona: 'Faculty / Department Coordinator',
      category: 'Decision / approval',
      context: 'The person you reached may help you identify the appropriate colleague, but their role and contact information should be handled respectfully.',
      objection: '“I do not handle these decisions. You should speak with someone from the placement office.”',
      intent: 'Thank them, ask for the right process or role, and avoid pressuring them to share private details.'
    }
  ];
  const CARE_RULES = {
    confirm: /\b(understand|appreciate|fair concern|valid concern|thanks for sharing|thank you for sharing|i see|that makes sense|you mentioned|recognise|recognize)\b/i,
    ask: /\?|\b(could you|may i ask|can you share|what would|what is|what are|which|how would|how do|would you be able|help me understand)\b/i,
    relate: /\b(relevant|programme|program|training|students|skills|curriculum|institution|based on|align|learning|career|requirement|your team|your students|we can share|we could share)\b/i,
    establish: /\b(next step|schedule|meeting|follow up|follow-up|call back|send|share|tomorrow|next week|by [a-z]+day|shall we|would it help|i will|i'll|we can arrange|let us|let's)\b/i
  };
  const CARE_LABELS = { confirm: 'Confirm', ask: 'Ask', relate: 'Relate', establish: 'Establish' };
  const TRUTH_GUARD_PHRASES = [
    'guaranteed placement', '100% placement', '100 percent placement', 'assured placement',
    'guaranteed job', 'job guaranteed', 'guaranteed employment', 'assured job',
    'guaranteed salary', 'assured salary', '100% job', '100 percent job',
    'guaranteed internship', '100% internship', '100 percent internship'
  ];
  const TERMINAL_OUTCOMES = new Set(['converted', 'not_interested']);
  const state = { records: [], practiceSessions: [], settings: { demoMode: false } };
  let lastSavedPracticeId = null;
  let editingRecordId = null;
  let toastTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function localISODate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function dateOffset(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return localISODate(date);
  }

  function makeId(prefix = 'item') {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function safeString(value, max = 1000) {
    return String(value ?? '').trim().slice(0, max);
  }

  function formatDate(value, options = {}) {
    if (!value) return '—';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  }

  function formatTimestamp(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
  }

  function outcomeLabel(value) {
    return OUTCOMES.find(item => item.value === value)?.label || 'Follow-up needed';
  }

  function outcomeClass(value) {
    if (value === 'meeting_booked' || value === 'converted') return 'positive';
    if (value === 'follow_up' || value === 'information_shared') return 'pending';
    if (value === 'not_interested' || value === 'no_response') return 'negative';
    return '';
  }

  function truthGuardMatches(text) {
    const lower = String(text || '').toLowerCase();
    return TRUTH_GUARD_PHRASES.filter(phrase => lower.includes(phrase));
  }

  function showToast(message) {
    const region = $('#toastRegion');
    if (!region) return;
    region.innerHTML = `<div class="toast">${escapeHTML(message)}</div>`;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { region.innerHTML = ''; }, 3200);
  }

  function setMessage(selector, message, isError = false) {
    const element = $(selector);
    if (!element) return;
    element.textContent = message;
    element.style.color = isError ? '#ad5748' : '';
  }

  function persist() {
    try {
      const payload = {
        app: APP_NAME,
        version: APP_VERSION,
        savedAt: new Date().toISOString(),
        records: state.records,
        practiceSessions: state.practiceSessions,
        settings: state.settings
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Unable to save workspace:', error);
      showToast('Could not save. Export a backup or remove some browser data.');
      return false;
    }
  }

  function normaliseRecord(item) {
    if (!item || typeof item !== 'object') return null;
    const category = CATEGORIES.includes(item.category) ? item.category : 'Other';
    const channel = CHANNELS.includes(item.channel) ? item.channel : 'Other';
    const validOutcome = OUTCOMES.some(outcome => outcome.value === item.outcome) ? item.outcome : 'follow_up';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || '')) ? item.date : localISODate();
    const followUp = /^\d{4}-\d{2}-\d{2}$/.test(String(item.followUp || '')) ? item.followUp : '';
    return {
      id: safeString(item.id, 100) || makeId('record'),
      prospect: safeString(item.prospect, 100) || 'Unnamed prospect',
      persona: safeString(item.persona, 80),
      category,
      channel,
      objection: safeString(item.objection, 700),
      response: safeString(item.response, 900),
      outcome: validOutcome,
      date,
      followUp,
      nextAction: safeString(item.nextAction, 140),
      createdAt: item.createdAt && !Number.isNaN(new Date(item.createdAt).getTime()) ? item.createdAt : new Date().toISOString(),
      updatedAt: item.updatedAt && !Number.isNaN(new Date(item.updatedAt).getTime()) ? item.updatedAt : new Date().toISOString(),
      source: item.source === 'demo' ? 'demo' : 'user'
    };
  }

  function normalisePractice(item) {
    if (!item || typeof item !== 'object') return null;
    const checked = Array.isArray(item.checked) ? item.checked.filter(key => Object.prototype.hasOwnProperty.call(CARE_LABELS, key)) : [];
    return {
      id: safeString(item.id, 100) || makeId('practice'),
      scenarioTitle: safeString(item.scenarioTitle, 120) || 'Custom scenario',
      persona: safeString(item.persona, 80),
      category: CATEGORIES.includes(item.category) ? item.category : 'Other',
      response: safeString(item.response, 1800),
      checked,
      score: Math.round((checked.length / 4) * 100),
      createdAt: item.createdAt && !Number.isNaN(new Date(item.createdAt).getTime()) ? item.createdAt : new Date().toISOString()
    };
  }

  function loadWorkspace() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.records) || !Array.isArray(parsed.practiceSessions)) return false;
      state.records = parsed.records.map(normaliseRecord).filter(Boolean);
      state.practiceSessions = parsed.practiceSessions.map(normalisePractice).filter(Boolean);
      state.settings = { demoMode: Boolean(parsed.settings && parsed.settings.demoMode) };
      return true;
    } catch (error) {
      console.error('Unable to load workspace:', error);
      return false;
    }
  }

  function makeDemoRecords() {
    const now = new Date().toISOString();
    return [
      { id: 'demo-r1', prospect: 'Northview Institute', persona: 'Placement Coordinator', category: 'Existing arrangements', channel: 'Call', objection: 'We already work with a training partner and need to understand what would be different.', response: 'Acknowledged the existing relationship and offered to understand their current programme priorities before sharing relevant information.', outcome: 'follow_up', date: dateOffset(-2), followUp: dateOffset(0), nextAction: 'Share approved programme overview', createdAt: now, updatedAt: now, source: 'demo' },
      { id: 'demo-r2', prospect: 'Meridian College', persona: 'Department Head', category: 'Programme relevance', channel: 'Email', objection: 'Please explain how the content can fit students with different skill levels.', response: 'Offered to share the official curriculum and asked which student groups they would like to prioritise.', outcome: 'information_shared', date: dateOffset(-4), followUp: dateOffset(2), nextAction: 'Check whether curriculum details were useful', createdAt: now, updatedAt: now, source: 'demo' },
      { id: 'demo-r3', prospect: 'Riverbend Technical Campus', persona: 'Institution Administrator', category: 'Budget / value', channel: 'Meeting', objection: 'We need a clearer view of scope and cost before deciding whether to proceed.', response: 'Confirmed that budget clarity is important and agreed to share only the approved scope and pricing information.', outcome: 'meeting_booked', date: dateOffset(-1), followUp: dateOffset(4), nextAction: 'Prepare an approved scope discussion', createdAt: now, updatedAt: now, source: 'demo' },
      { id: 'demo-r4', prospect: 'Pioneer Skills Centre', persona: 'Faculty Coordinator', category: 'Timing / readiness', channel: 'WhatsApp', objection: 'Our current academic schedule is full. Please contact us after the examination period.', response: 'Thanked them for clarifying the timing and asked permission to reconnect during the next planning window.', outcome: 'follow_up', date: dateOffset(-7), followUp: dateOffset(-1), nextAction: 'Reconnect in the agreed planning window', createdAt: now, updatedAt: now, source: 'demo' },
      { id: 'demo-r5', prospect: 'Eastgate Learning Hub', persona: 'Department Head', category: 'Trust / proof', channel: 'Call', objection: 'What verified programme information can we review before discussing outcomes?', response: 'Offered to send official programme information and clarify which approved evidence is available for review.', outcome: 'no_response', date: dateOffset(-9), followUp: '', nextAction: 'Wait for the prospect to review information', createdAt: now, updatedAt: now, source: 'demo' },
      { id: 'demo-r6', prospect: 'Summit Institute', persona: 'Placement Coordinator', category: 'Decision / approval', channel: 'Social media', objection: 'The proposal needs to be reviewed by our internal committee first.', response: 'Asked which stakeholders should be included and offered a concise summary for the committee.', outcome: 'converted', date: dateOffset(-12), followUp: '', nextAction: 'Record the agreed institutional next step', createdAt: now, updatedAt: now, source: 'demo' }
    ].map(normaliseRecord);
  }

  function makeDemoPractice() {
    const now = Date.now();
    return [
      { id: 'demo-p1', scenarioTitle: 'We already have a training partner', persona: 'Placement Coordinator', category: 'Existing arrangements', response: 'I understand you already have a partner. What is working well today, and where do you see any gaps? Based on your priorities, I can share relevant approved programme information. Would a short review next week help?', checked: ['confirm', 'ask', 'relate', 'establish'], createdAt: new Date(now - 86400000).toISOString() },
      { id: 'demo-p2', scenarioTitle: 'Will this be relevant to our students?', persona: 'Department Head', category: 'Programme relevance', response: 'That is a fair concern. Could you share which student groups and skills you are focusing on? I can relate those needs to the official curriculum and send the relevant details for your review.', checked: ['confirm', 'ask', 'relate'], createdAt: new Date(now - 2 * 86400000).toISOString() },
      { id: 'demo-p3', scenarioTitle: 'We need internal approval first', persona: 'Institutional Decision-Maker', category: 'Decision / approval', response: 'I understand that the team needs to review this. Which colleagues should have the information? I can share a concise, approved overview and follow up after you have had time to discuss it.', checked: ['confirm', 'ask', 'relate', 'establish'], createdAt: new Date(now - 3 * 86400000).toISOString() }
    ].map(normalisePractice);
  }

  function loadDemoWorkspace() {
    state.records = makeDemoRecords();
    state.practiceSessions = makeDemoPractice();
    state.settings = { demoMode: true };
    persist();
    $('#demoBanner').hidden = false;
    renderAll();
    showToast('Fictional demonstration workspace loaded.');
  }

  function clearWorkspace() {
    state.records = [];
    state.practiceSessions = [];
    state.settings = { demoMode: false };
    persist();
    $('#demoBanner').hidden = true;
    renderAll();
    showToast('Workspace data cleared.');
  }

  function navigate(viewName) {
    const allowed = ['overview', 'practice', 'intelligence', 'records', 'settings'];
    const target = allowed.includes(viewName) ? viewName : 'overview';
    $$('.view').forEach(section => {
      const active = section.id === `view-${target}`;
      section.classList.toggle('is-visible', active);
      section.hidden = !active;
    });
    $$('.nav-item[data-nav]').forEach(button => button.classList.toggle('is-active', button.dataset.nav === target));
    $('#pageCrumb').textContent = ({ overview: 'Overview', practice: 'Sales practice', intelligence: 'Objection insights', records: 'Conversation records', settings: 'Settings & data' })[target];
    if (target === 'records') renderRecords();
    if (target === 'intelligence') renderIntelligence();
    if (target === 'practice') renderPracticeHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function unresolved(record) {
    return Boolean(record.followUp) && !TERMINAL_OUTCOMES.has(record.outcome);
  }

  function dueRecords() {
    const today = localISODate();
    return state.records.filter(record => unresolved(record) && record.followUp <= today)
      .sort((a, b) => a.followUp.localeCompare(b.followUp));
  }

  function renderMiniBars(container, entries, emptyText) {
    if (!entries.length) {
      container.innerHTML = `<div class="empty-hint">${escapeHTML(emptyText)}</div>`;
      return;
    }
    const max = Math.max(...entries.map(item => item.count), 1);
    container.innerHTML = entries.slice(0, 5).map(item => `
      <div class="mini-bar-row"><span class="mini-bar-label" title="${escapeHTML(item.label)}">${escapeHTML(item.label)}</span><div class="mini-track"><div class="mini-fill" style="width:${Math.max(4, (item.count / max) * 100)}%"></div></div><span class="mini-count">${item.count}</span></div>
    `).join('');
  }

  function countBy(key, source = state.records) {
    const counts = new Map();
    source.forEach(record => {
      const value = record[key] || 'Other';
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }

  function renderOverview() {
    const total = state.records.length;
    const practices = state.practiceSessions;
    const average = practices.length ? Math.round(practices.reduce((sum, item) => sum + item.score, 0) / practices.length) : null;
    const due = dueRecords();
    const positive = state.records.filter(record => ['meeting_booked', 'converted'].includes(record.outcome)).length;
    $('#kpiObjections').textContent = String(total);
    $('#kpiPractice').innerHTML = average === null ? '—<small>/100</small>' : `${average}<small>/100</small>`;
    $('#kpiPracticeFoot').textContent = practices.length ? `${practices.length} self-reviewed practice round${practices.length === 1 ? '' : 's'}` : 'Complete a practice round to begin';
    $('#kpiFollowups').textContent = String(due.length);
    $('#kpiFollowupsFoot').textContent = `${due.filter(record => record.followUp < localISODate()).length} overdue · ${due.filter(record => record.followUp === localISODate()).length} due today`;
    $('#kpiPositive').textContent = String(positive);

    renderMiniBars($('#overviewCategories'), countBy('category'), 'No objections logged yet. Add a conversation to see themes.');

    const watchlist = state.records.filter(unresolved).sort((a, b) => a.followUp.localeCompare(b.followUp)).slice(0, 4);
    $('#overviewFollowups').innerHTML = watchlist.length ? watchlist.map(record => {
      const date = new Date(`${record.followUp}T12:00:00`);
      const diff = Math.round((date - new Date(`${localISODate()}T12:00:00`)) / 86400000);
      const tag = diff < 0 ? `<span class="due-tag">${Math.abs(diff)}d overdue</span>` : diff === 0 ? '<span class="due-tag today">Today</span>' : `<span class="due-tag">${diff}d left</span>`;
      return `<div class="followup-item"><div class="followup-date"><strong>${escapeHTML(formatDate(record.followUp, { day: 'numeric' }))}</strong><small>${escapeHTML(formatDate(record.followUp, { month: 'short' }))}</small></div><div class="followup-copy"><strong>${escapeHTML(record.prospect)}</strong><small>${escapeHTML(record.nextAction || outcomeLabel(record.outcome))}</small></div>${tag}</div>`;
    }).join('') : '<div class="empty-hint">No follow-ups are scheduled. Add one to keep the conversation moving.</div>';

    const recent = [...state.records].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    $('#overviewRecent').innerHTML = recent.length ? recent.map(record => `
      <tr><td class="prospect-cell"><strong>${escapeHTML(record.prospect)}</strong><small>${escapeHTML(record.persona || 'Prospect')}</small></td><td class="theme-cell">${escapeHTML(record.category)}</td><td><span class="outcome-badge ${outcomeClass(record.outcome)}">${escapeHTML(outcomeLabel(record.outcome))}</span></td><td>${escapeHTML(formatDate(record.date, { day: 'numeric', month: 'short' }))}</td></tr>
    `).join('') : '<tr><td colspan="4" class="empty-hint">No conversations yet. Start by logging one.</td></tr>';
  }

  function populateScenarioSelect() {
    $('#scenarioSelect').innerHTML = SCENARIOS.map((scenario, index) => `<option value="${escapeHTML(scenario.id)}">${String(index + 1).padStart(2, '0')} · ${escapeHTML(scenario.title)}</option>`).join('');
    renderScenario(SCENARIOS[0].id);
  }

  function currentScenario() {
    return SCENARIOS.find(item => item.id === $('#scenarioSelect').value) || SCENARIOS[0];
  }

  function renderScenario(id) {
    const scenario = SCENARIOS.find(item => item.id === id) || SCENARIOS[0];
    $('#scenarioSelect').value = scenario.id;
    $('#scenarioCard').innerHTML = `
      <div class="scenario-kicker">${escapeHTML(scenario.persona.toUpperCase())} · ${escapeHTML(scenario.category.toUpperCase())}</div>
      <h3>${escapeHTML(scenario.title)}</h3>
      <blockquote>${escapeHTML(scenario.objection)}</blockquote>
      <p class="scenario-context">${escapeHTML(scenario.context)}</p>
      <div class="scenario-intent">✦ Focus: ${escapeHTML(scenario.intent)}</div>
    `;
    resetPractice(false);
  }

  function analyseCare(text) {
    const result = {};
    Object.entries(CARE_RULES).forEach(([key, pattern]) => { result[key] = pattern.test(text); });
    return result;
  }

  function updatePracticeDraft() {
    const text = $('#practiceResponse').value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    $('#responseWordCount').textContent = `${words} word${words === 1 ? '' : 's'}`;
    $('#responseCharCount').textContent = `${text.length} / 1800`;
    const matches = truthGuardMatches(text);
    const guard = $('#practiceTruthGuard');
    if (matches.length) {
      guard.className = 'truth-guard has-warning';
      guard.innerHTML = `<span class="guard-icon">!</span><div><strong>Review this wording before use</strong><small>Configured phrase${matches.length > 1 ? 's' : ''} detected: ${matches.map(escapeHTML).join(', ')}. Verify any absolute claim against approved official material; do not imply a guarantee.</small></div>`;
    } else {
      guard.className = 'truth-guard is-quiet';
      guard.innerHTML = '<span class="guard-icon">✓</span><div><strong>TruthGuard is clear</strong><small>No configured absolute-claim phrases detected in this draft. This is not a fact-check.</small></div>';
    }
    const signals = analyseCare(text);
    Object.keys(CARE_LABELS).forEach(key => {
      const hint = $(`#careHint${key.charAt(0).toUpperCase()}${key.slice(1)}`);
      if (!text.trim()) hint.textContent = 'Not reviewed';
      else hint.textContent = signals[key] ? 'Possible signal in draft' : 'Consider adding this';
    });
    lastSavedPracticeId = null;
    $('#logPracticeInsight').disabled = true;
    updateCareScore();
  }

  function checkedCareItems() {
    return $$('[data-care]:checked').map(input => input.dataset.care);
  }

  function updateCareScore() {
    const checked = checkedCareItems();
    const score = checked.length * 25;
    $('#careScore').textContent = String(score);
    $('#careFeedback').textContent = score === 100 ? 'All four CARE principles reviewed.' : score >= 50 ? `${checked.length} of 4 principles included. Consider the remaining moves.` : 'Build a balanced response by reviewing all four moves.';
  }

  function resetPractice(clearMessage = true) {
    $('#practiceResponse').value = '';
    $$('[data-care]').forEach(input => { input.checked = false; });
    lastSavedPracticeId = null;
    $('#logPracticeInsight').disabled = true;
    updatePracticeDraft();
    if (clearMessage) setMessage('#practiceMessage', '');
  }

  function savePracticeRound() {
    const response = $('#practiceResponse').value.trim();
    if (response.length < 8) {
      setMessage('#practiceMessage', 'Write a little more of your response before saving.', true);
      $('#practiceResponse').focus();
      return;
    }
    const scenario = currentScenario();
    const checked = checkedCareItems();
    const entry = normalisePractice({
      id: makeId('practice'), scenarioTitle: scenario.title, persona: scenario.persona,
      category: scenario.category, response, checked, createdAt: new Date().toISOString()
    });
    state.practiceSessions.unshift(entry);
    state.practiceSessions = state.practiceSessions.slice(0, 100);
    persist();
    lastSavedPracticeId = entry.id;
    $('#logPracticeInsight').disabled = false;
    setMessage('#practiceMessage', `Practice round saved · self-review score ${entry.score}/100.`);
    renderPracticeHistory();
    renderOverview();
    showToast('Practice round saved.');
  }

  function renderPracticeHistory() {
    const sessions = state.practiceSessions.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    $('#practiceCount').textContent = `${state.practiceSessions.length} round${state.practiceSessions.length === 1 ? '' : 's'}`;
    $('#practiceHistory').innerHTML = sessions.length ? sessions.map(item => `
      <div class="history-item"><div><strong>${escapeHTML(item.scenarioTitle)}</strong><small>${escapeHTML(formatTimestamp(item.createdAt))} · ${item.checked.length}/4 CARE moves</small></div><span class="history-score">${item.score}</span></div>
    `).join('') : '<div class="empty-hint">Your saved practice rounds will appear here.</div>';
  }

  function populateSelects() {
    const categoryOptions = CATEGORIES.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join('');
    $('#recordCategory').innerHTML = categoryOptions;
    $('#categoryFilter').innerHTML = '<option value="all">All themes</option>' + categoryOptions;
    $('#recordOutcome').innerHTML = OUTCOMES.map(item => `<option value="${item.value}">${escapeHTML(item.label)}</option>`).join('');
    $('#outcomeFilter').innerHTML = '<option value="all">All outcomes</option>' + OUTCOMES.map(item => `<option value="${item.value}">${escapeHTML(item.label)}</option>`).join('');
  }

  function openRecordModal(prefill = null) {
    editingRecordId = prefill && prefill.id ? prefill.id : null;
    $('#modalTitle').textContent = editingRecordId ? 'Edit conversation' : 'Add a conversation';
    $('#recordId').value = editingRecordId || '';
    $('#recordProspect').value = prefill?.prospect || '';
    $('#recordPersona').value = prefill?.persona || '';
    $('#recordCategory').value = CATEGORIES.includes(prefill?.category) ? prefill.category : 'Other';
    $('#recordChannel').value = CHANNELS.includes(prefill?.channel) ? prefill.channel : 'Call';
    $('#recordObjection').value = prefill?.objection || '';
    $('#recordResponse').value = prefill?.response || '';
    $('#recordOutcome').value = OUTCOMES.some(item => item.value === prefill?.outcome) ? prefill.outcome : 'follow_up';
    $('#recordDate').value = prefill?.date || localISODate();
    $('#recordFollowup').value = prefill?.followUp || '';
    $('#recordNextAction').value = prefill?.nextAction || '';
    $('#recordTruthWarning').hidden = true;
    $('#recordTruthWarning').textContent = '';
    $('#recordFormMessage').textContent = '';
    $('#recordModal').hidden = false;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => $('#recordProspect').focus(), 50);
  }

  function closeRecordModal() {
    $('#recordModal').hidden = true;
    document.body.style.overflow = '';
    editingRecordId = null;
  }

  function submitRecord(event) {
    event.preventDefault();
    const prospect = $('#recordProspect').value.trim();
    const objection = $('#recordObjection').value.trim();
    const date = $('#recordDate').value;
    if (!prospect || !objection || !date) {
      $('#recordFormMessage').textContent = 'Please complete the required fields.';
      return;
    }
    const response = $('#recordResponse').value.trim();
    const warningMatches = truthGuardMatches(response);
    if (warningMatches.length) {
      const accepted = window.confirm(`TruthGuard detected: ${warningMatches.join(', ')}. Save only if this wording has been checked against approved official material. Continue?`);
      if (!accepted) return;
    }
    const existing = editingRecordId ? state.records.find(item => item.id === editingRecordId) : null;
    const record = normaliseRecord({
      id: editingRecordId || makeId('record'),
      prospect,
      persona: $('#recordPersona').value,
      category: $('#recordCategory').value,
      channel: $('#recordChannel').value,
      objection,
      response,
      outcome: $('#recordOutcome').value,
      date,
      followUp: $('#recordFollowup').value,
      nextAction: $('#recordNextAction').value,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'user'
    });
    if (existing) {
      const index = state.records.findIndex(item => item.id === editingRecordId);
      state.records[index] = record;
    } else {
      state.records.unshift(record);
    }
    state.settings.demoMode = state.records.some(item => item.source === 'demo');
    if (persist()) {
      closeRecordModal();
      renderAll();
      showToast(existing ? 'Conversation updated.' : 'Conversation saved.');
    }
  }

  function editRecord(id) {
    const record = state.records.find(item => item.id === id);
    if (record) openRecordModal(record);
  }

  function deleteRecord(id) {
    const record = state.records.find(item => item.id === id);
    if (!record) return;
    if (!window.confirm(`Delete the conversation record for “${record.prospect}”?`)) return;
    state.records = state.records.filter(item => item.id !== id);
    persist();
    renderAll();
    showToast('Conversation deleted.');
  }

  function renderRecords() {
    const search = $('#recordSearch').value.trim().toLowerCase();
    const category = $('#categoryFilter').value;
    const outcome = $('#outcomeFilter').value;
    const records = state.records.filter(record => {
      const content = [record.prospect, record.persona, record.objection, record.response, record.nextAction, record.category].join(' ').toLowerCase();
      return (!search || content.includes(search)) && (category === 'all' || record.category === category) && (outcome === 'all' || record.outcome === outcome);
    }).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
    $('#recordCountLabel').textContent = `${records.length} of ${state.records.length} record${state.records.length === 1 ? '' : 's'}`;
    $('#recordsTableBody').innerHTML = records.map(record => {
      const isOverdue = unresolved(record) && record.followUp < localISODate();
      return `<tr>
        <td class="prospect-cell"><strong>${escapeHTML(record.prospect)}</strong><small>${escapeHTML(record.persona || 'Prospect')}</small></td>
        <td class="theme-cell"><strong>${escapeHTML(record.category)}</strong><small>${escapeHTML(record.objection.slice(0, 76))}${record.objection.length > 76 ? '…' : ''}</small></td>
        <td>${escapeHTML(record.channel)}</td>
        <td><span class="outcome-badge ${outcomeClass(record.outcome)}">${escapeHTML(outcomeLabel(record.outcome))}</span></td>
        <td class="followup-cell ${isOverdue ? 'overdue' : ''}">${escapeHTML(formatDate(record.followUp))}${isOverdue ? ' · overdue' : ''}</td>
        <td><div class="record-actions"><button class="icon-button" type="button" data-action="edit" data-id="${escapeHTML(record.id)}" aria-label="Edit ${escapeHTML(record.prospect)}">✎</button><button class="icon-button" type="button" data-action="delete" data-id="${escapeHTML(record.id)}" aria-label="Delete ${escapeHTML(record.prospect)}">×</button></div></td>
      </tr>`;
    }).join('');
    $('#recordsEmpty').hidden = records.length !== 0;
  }

  function renderChart(container, entries, emptyText) {
    if (!entries.length) {
      container.innerHTML = `<div class="empty-hint">${escapeHTML(emptyText)}</div>`;
      return;
    }
    const max = Math.max(...entries.map(item => item.count), 1);
    container.innerHTML = entries.map(item => `<div class="chart-row"><span class="chart-label" title="${escapeHTML(item.label)}">${escapeHTML(item.label)}</span><div class="chart-track"><div class="chart-fill" style="width:${Math.max(3, item.count / max * 100)}%"></div></div><span class="chart-value">${item.count}</span></div>`).join('');
  }

  const MARKETING_SUGGESTIONS = {
    'Programme relevance': 'Create a concise, approved programme-to-skill overview and a discovery-question guide by student cohort.',
    'Timing / readiness': 'Prepare a flexible follow-up sequence with permission-based timing and a short information summary.',
    'Existing arrangements': 'Create a discovery checklist that helps sales understand a prospect’s current training arrangement before positioning an alternative.',
    'Budget / value': 'Make approved scope, pricing and deliverables easy to compare. Avoid implying unapproved discounts or guaranteed returns.',
    'Decision / approval': 'Prepare a one-page decision brief that a contact can share with the relevant internal stakeholders.',
    'Trust / proof': 'Maintain a central set of approved programme details, credentials and substantiated evidence for consistent communication.',
    'Other': 'Review the raw notes for a recurring theme and decide whether a new objection category or FAQ is needed.'
  };

  function renderIntelligence() {
    const categoryCounts = countBy('category');
    const channelCounts = countBy('channel');
    const outcomeCounts = countBy('outcome').map(item => ({ label: outcomeLabel(item.label), count: item.count }));
    const topCategory = categoryCounts[0];
    const topChannel = channelCounts[0];
    $('#topTheme').textContent = topCategory?.label || 'Not enough data';
    $('#topThemeCount').textContent = topCategory ? `${topCategory.count} of ${state.records.length} recorded conversations` : 'Log conversations to identify a pattern.';
    $('#topChannel').textContent = topChannel?.label || '—';
    $('#topChannelCount').textContent = topChannel ? `${topChannel.count} recorded conversation${topChannel.count === 1 ? '' : 's'}` : 'Based on saved records.';
    const withFollowup = state.records.filter(record => Boolean(record.followUp)).length;
    $('#followupRate').textContent = state.records.length ? `${Math.round(withFollowup / state.records.length * 100)}%` : '0%';
    $('#categoryChart').innerHTML = '';
    $('#outcomeChart').innerHTML = '';
    renderChart($('#categoryChart'), categoryCounts, 'No category data yet. Log a conversation to build this chart.');
    renderChart($('#outcomeChart'), outcomeCounts, 'No outcomes yet. Save a conversation to see what happened next.');

    if (!categoryCounts.length) {
      $('#marketingIdeas').innerHTML = '<div class="empty-hint">Your first recorded objection will generate a relevant team-learning suggestion.</div>';
    } else {
      $('#marketingIdeas').innerHTML = categoryCounts.slice(0, 4).map((item, index) => `
        <div class="marketing-idea"><span class="idea-number">0${index + 1}</span><div><strong>${escapeHTML(item.label)} · ${item.count} record${item.count === 1 ? '' : 's'}</strong><p>${escapeHTML(MARKETING_SUGGESTIONS[item.label] || MARKETING_SUGGESTIONS.Other)}</p></div></div>
      `).join('');
    }
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportRecordsCSV() {
    const headers = ['Prospect', 'Persona', 'Objection theme', 'Channel', 'Objection', 'Response provided', 'Outcome', 'Conversation date', 'Follow-up date', 'Next action'];
    const rows = state.records.map(record => [record.prospect, record.persona, record.category, record.channel, record.objection, record.response, outcomeLabel(record.outcome), record.date, record.followUp, record.nextAction]);
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    downloadFile('objection-to-insight-conversations.csv', csv, 'text/csv;charset=utf-8');
    showToast('Conversation CSV exported.');
  }

  function exportBackup() {
    const backup = {
      app: APP_NAME,
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      note: 'This file contains local workspace records. Treat it as confidential if it contains real information.',
      data: { records: state.records, practiceSessions: state.practiceSessions, settings: state.settings }
    };
    downloadFile('objection-to-insight-backup.json', JSON.stringify(backup, null, 2), 'application/json');
    showToast('Full JSON backup downloaded.');
  }

  function exportInsightBrief() {
    const categories = countBy('category');
    const outcomes = countBy('outcome').map(item => ({ label: outcomeLabel(item.label), count: item.count }));
    const channels = countBy('channel');
    const lines = [
      `${APP_NAME.toUpperCase()} — CONVERSATION INSIGHT BRIEF`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      `Workspace records: ${state.records.length}`,
      '',
      'OBJECTION THEMES',
      ...(categories.length ? categories.map((item, index) => `${index + 1}. ${item.label}: ${item.count}`) : ['No objection records yet.']),
      '',
      'CONVERSATION OUTCOMES',
      ...(outcomes.length ? outcomes.map(item => `${item.label}: ${item.count}`) : ['No outcome records yet.']),
      '',
      'CHANNELS',
      ...(channels.length ? channels.map(item => `${item.label}: ${item.count}`) : ['No channel records yet.']),
      '',
      'SUGGESTED SALES & MARKETING ACTIONS',
      ...(categories.length ? categories.slice(0, 5).map(item => `• ${item.label}: ${MARKETING_SUGGESTIONS[item.label] || MARKETING_SUGGESTIONS.Other}`) : ['• Record prospect concerns before drawing conclusions.']),
      '',
      'INTERPRETATION NOTE',
      'These counts describe only records entered in this browser. They are descriptive workspace data, not statistically representative market research or evidence of programme performance.',
      'Review and remove personal details before sharing this brief.'
    ];
    downloadFile('objection-to-insight-brief.txt', lines.join('\n'), 'text/plain;charset=utf-8');
    showToast('Insight brief exported.');
  }

  function restoreBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        const source = parsed && parsed.data ? parsed.data : parsed;
        if (!source || !Array.isArray(source.records) || !Array.isArray(source.practiceSessions)) {
          throw new Error('This file does not contain a valid Objection-to-Insight workspace backup.');
        }
        const records = source.records.map(normaliseRecord).filter(Boolean);
        const practices = source.practiceSessions.map(normalisePractice).filter(Boolean);
        if (!window.confirm(`Restore ${records.length} conversation record(s) and ${practices.length} practice round(s)? This replaces the current workspace.`)) return;
        state.records = records;
        state.practiceSessions = practices;
        state.settings = { demoMode: Boolean(source.settings && source.settings.demoMode) };
        persist();
        $('#demoBanner').hidden = !state.settings.demoMode;
        renderAll();
        setMessage('#settingsMessage', 'Backup restored successfully.');
        showToast('Workspace backup restored.');
      } catch (error) {
        console.error('Backup restore failed:', error);
        setMessage('#settingsMessage', error.message || 'Could not read this backup file.', true);
      } finally {
        $('#restoreFile').value = '';
      }
    };
    reader.onerror = () => setMessage('#settingsMessage', 'The selected file could not be read.', true);
    reader.readAsText(file);
  }

  function logPracticeAsInsight() {
    const entry = state.practiceSessions.find(item => item.id === lastSavedPracticeId);
    if (!entry) return;
    const scenario = SCENARIOS.find(item => item.title === entry.scenarioTitle);
    openRecordModal({
      prospect: '', persona: entry.persona, category: entry.category,
      channel: 'Call', objection: scenario?.objection || '', response: entry.response,
      outcome: 'follow_up', date: localISODate(), followUp: '',
      nextAction: 'Review the prospect’s response and agree on a suitable next step'
    });
  }

  function renderAll() {
    renderOverview();
    renderPracticeHistory();
    renderRecords();
    renderIntelligence();
  }

  function wireEvents() {
    document.addEventListener('click', event => {
      const nav = event.target.closest('[data-nav]');
      if (nav) {
        event.preventDefault();
        navigate(nav.dataset.nav);
        return;
      }
      const action = event.target.closest('[data-action]');
      if (action) {
        const id = action.dataset.id;
        if (action.dataset.action === 'edit') editRecord(id);
        if (action.dataset.action === 'delete') deleteRecord(id);
      }
    });

    $('#dismissBanner').addEventListener('click', () => { $('#demoBanner').hidden = true; });
    $('#scenarioSelect').addEventListener('change', event => renderScenario(event.target.value));
    $('#randomScenario').addEventListener('click', () => {
      const options = SCENARIOS.filter(item => item.id !== currentScenario().id);
      const next = options[Math.floor(Math.random() * options.length)];
      renderScenario(next.id);
    });
    $('#practiceResponse').addEventListener('input', updatePracticeDraft);
    $$('[data-care]').forEach(input => input.addEventListener('change', () => {
      lastSavedPracticeId = null;
      $('#logPracticeInsight').disabled = true;
      updateCareScore();
    }));
    $('#savePractice').addEventListener('click', savePracticeRound);
    $('#resetPractice').addEventListener('click', () => resetPractice(true));
    $('#logPracticeInsight').addEventListener('click', logPracticeAsInsight);

    $('#addRecordTop').addEventListener('click', () => openRecordModal());
    $('#addRecordEmpty').addEventListener('click', () => openRecordModal());
    $('#closeRecordModal').addEventListener('click', closeRecordModal);
    $('#cancelRecord').addEventListener('click', closeRecordModal);
    $('#recordModal').addEventListener('click', event => { if (event.target === $('#recordModal')) closeRecordModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#recordModal').hidden) closeRecordModal(); });
    $('#recordForm').addEventListener('submit', submitRecord);
    $('#recordResponse').addEventListener('input', () => {
      const matches = truthGuardMatches($('#recordResponse').value);
      const warning = $('#recordTruthWarning');
      warning.hidden = matches.length === 0;
      warning.textContent = matches.length ? `TruthGuard review: ${matches.join(', ')}. Verify these absolute claims against approved official material before saving.` : '';
    });

    ['recordSearch', 'categoryFilter', 'outcomeFilter'].forEach(id => {
      $(`#${id}`).addEventListener(id === 'recordSearch' ? 'input' : 'change', renderRecords);
    });
    $('#clearFilters').addEventListener('click', () => {
      $('#recordSearch').value = '';
      $('#categoryFilter').value = 'all';
      $('#outcomeFilter').value = 'all';
      renderRecords();
    });

    $('#exportRecords').addEventListener('click', exportRecordsCSV);
    $('#exportRecordsSettings').addEventListener('click', exportRecordsCSV);
    $('#exportBackup').addEventListener('click', exportBackup);
    $('#restoreBackup').addEventListener('click', () => $('#restoreFile').click());
    $('#restoreFile').addEventListener('change', event => restoreBackup(event.target.files?.[0]));
    $('#loadDemo').addEventListener('click', () => {
      if (window.confirm('Replace all current records with fictional demonstration data? Export a backup first if you need to keep your current workspace.')) loadDemoWorkspace();
    });
    $('#clearWorkspace').addEventListener('click', () => {
      if (window.confirm('Permanently clear all conversation records and practice history from this browser? Export a backup first if needed.')) clearWorkspace();
    });
    $('#exportInsights').addEventListener('click', exportInsightBrief);
    $('#exportInsightsBottom').addEventListener('click', exportInsightBrief);
  }

  function initialise() {
    populateSelects();
    populateScenarioSelect();
    const loaded = loadWorkspace();
    if (!loaded) {
      // Start with a clearly labelled fictional dataset so the first launch is presentation-ready.
      state.records = makeDemoRecords();
      state.practiceSessions = makeDemoPractice();
      state.settings = { demoMode: true };
      persist();
    }
    $('#demoBanner').hidden = !state.settings.demoMode;
    wireEvents();
    updatePracticeDraft();
    renderAll();
    navigate('overview');
  }

  document.addEventListener('DOMContentLoaded', initialise);
})();
