export const SUPABASE_URL = 'https://cbfblvsasamxuwgcpmtj.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_EEGLPPMa3fIX1aRR6GA3Xw_mF4mh5X0';
export const CLIENT_OPTIONS = { auth: {
  storageKey: 'crs-parent-auth', flowType: 'pkce', detectSessionInUrl: true, persistSession: true,
} };
export const INSTALL_DISMISSED_KEY = 'crs-parent-install-dismissed';
export const MONEY_MODULE_URL = 'https://nonpatan.github.io/CRS_Score/shared/money.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

// Keep characters outside the invite alphabet: the server decides validity.
export function inviteCharacters(value) { return String(value).replace(/[\s-]/g, '').toUpperCase(); }
export function formatInvite(value) {
  const code = inviteCharacters(value);
  return code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

export function routeFor({ session, loaded, loading, loadError, children }, hash) {
  if (!session) return 'login';
  if (loading || (!loaded && !loadError)) return 'loading';
  if (loadError) return 'error';
  if (!children.length) return 'redeem';
  if (/^#child\/[^/]+$/.test(hash)) return 'child';
  if (/^#leave\/[^/]+$/.test(hash)) return 'leave';
  return ['#redeem', '#calendar', '#notifications', '#account'].includes(hash) ? hash.slice(1) : 'home';
}

export function authErrorMessage(error) {
  const text = typeof error === 'string' ? error : `${error?.code ?? ''} ${error?.message ?? ''}`;
  if (/sign.?ups?.*(not.allowed|disabled|closed)|signup_disabled/i.test(text)) {
    return 'ระบบยังไม่เปิดรับบัญชีใหม่ โปรดติดต่อโรงเรียน';
  }
  if (/disallowed_useragent/i.test(text)) return 'กรุณาเปิดลิงก์ใน Safari หรือ Chrome แล้วเข้าสู่ระบบอีกครั้ง';
  if (/access_denied|cancel/i.test(text)) return 'ยังไม่ได้เข้าสู่ระบบ กดเข้าสู่ระบบด้วย Google เพื่อลองอีกครั้ง';
  return 'เข้าสู่ระบบไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง';
}

export function redeemErrorMessage(result) {
  if (result?.error === 'invalid_code') {
    const remaining = Number.isInteger(result.remaining) && result.remaining >= 0
      ? ` · กรอกได้อีก ${result.remaining} ครั้งในชั่วโมงนี้` : '';
    return `รหัสไม่ถูกต้องหรือหมดอายุ${remaining} · ถ้าไม่แน่ใจ ขอรหัสใหม่จากครูประจำชั้น`;
  }
  if (result?.error === 'too_many_attempts') return 'กรอกผิดหลายครั้ง โปรดลองใหม่ในอีก 1 ชั่วโมง';
  if (result?.error === 'not_signed_in') return 'กรุณาเข้าสู่ระบบอีกครั้ง แล้วกรอกรหัสจากครูประจำชั้น';
  return 'ส่งไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง';
}

export function embeddedBrowser(userAgent, href) {
  if (/Line\//i.test(userAgent)) {
    const url = new URL(href);
    if (url.searchParams.get('openExternalBrowser') !== '1') {
      url.searchParams.set('openExternalBrowser', '1');
      return { blocked: true, redirect: url.href };
    }
    return { blocked: true, redirect: null };
  }
  return { blocked: /FBAN|FBAV|Instagram/i.test(userAgent), redirect: null };
}

export function oauthErrorFromUrl(href) {
  const url = new URL(href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  return url.searchParams.get('error_description') || fragment.get('error_description') ||
    url.searchParams.get('error') || fragment.get('error') || '';
}

export function installKind({ userAgent, platform = '', maxTouchPoints = 0, standalone, dismissed, prompt }) {
  if (standalone || dismissed) return null;
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
  if (ios && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)) return 'ios';
  return prompt ? 'prompt' : null;
}

export function classLabel(student) {
  return [student.grade_level, student.classroom].filter(value => value !== null && value !== undefined && value !== '').join('/');
}

export function bangkokDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function shiftDate(day, days) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function thaiDate(day, options = {}) {
  return new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', ...options })
    .format(new Date(day.length === 10 ? `${day}T12:00:00+07:00` : day));
}
export function baht(amount) { return `${Number(amount).toLocaleString('th-TH')} บาท`; }
const resource = () => ({ rows: [], loading: true, error: '' });
function validSchoolDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export const LEAVE_ERRORS = {
  not_my_child: 'บัญชีนี้ยังยื่นใบลาให้นักเรียนคนนี้ไม่ได้ กรุณาตรวจบัญชีหรือขอให้ครูตรวจการผูกบัญชี',
  bad_type: 'กรุณาเลือกประเภท ลาป่วย หรือ ลากิจ',
  bad_range: 'กรุณาเลือกวันสิ้นสุดไม่ก่อนวันเริ่มต้น และลาได้ครั้งละไม่เกิน 14 วัน',
  out_of_window: 'กรุณาเลือกวันที่ย้อนหลังไม่เกิน 7 วัน หรือล่วงหน้าไม่เกิน 30 วัน',
  bad_reason: 'กรุณากรอกเหตุผล 1–500 ตัวอักษร',
  overlap: 'ช่วงวันนี้มีใบลาที่รออนุมัติหรืออนุมัติแล้ว กรุณาตรวจรายการใบลาและเลือกช่วงวันใหม่',
  too_many_pending: 'มีใบลารออนุมัติครบ 5 ใบแล้ว กรุณารอครูพิจารณาหรือยกเลิกใบที่ไม่ใช้',
  cannot_cancel: 'ยกเลิกไม่ได้ ใบลานี้อาจได้รับการพิจารณาแล้ว กรุณาโหลดรายการอีกครั้ง',
};
export function leaveErrorMessage(error) {
  const code = typeof error === 'string' ? error : error?.message;
  return LEAVE_ERRORS[code] || 'ทำรายการไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง';
}
export function leaveDateLimits(today = bangkokDate()) {
  return { min: shiftDate(today, -7), max: shiftDate(today, 30) };
}
export function newLeaveDraft(studentId, today = bangkokDate()) {
  return { studentId: String(studentId), leave_type: '', start_date: today, end_date: today, reason: '', dirty: false, errors: {} };
}
export function validateLeave(draft, today = bangkokDate()) {
  const errors = {}, { min, max } = leaveDateLimits(today);
  if (!['ลาป่วย', 'ลากิจ'].includes(draft.leave_type)) errors.leave_type = LEAVE_ERRORS.bad_type;
  if (!validSchoolDate(draft.start_date)) errors.start_date = 'กรุณาเลือกวันที่เริ่มลา';
  else if (draft.start_date < min || draft.start_date > max) errors.start_date = LEAVE_ERRORS.out_of_window;
  if (!validSchoolDate(draft.end_date)) errors.end_date = 'กรุณาเลือกวันที่สิ้นสุด';
  else if (draft.end_date < min || draft.end_date > max) errors.end_date = LEAVE_ERRORS.out_of_window;
  else if (validSchoolDate(draft.start_date) && (draft.end_date < draft.start_date || draft.end_date > shiftDate(draft.start_date, 13))) errors.end_date = LEAVE_ERRORS.bad_range;
  if (!draft.reason.trim() || Array.from(draft.reason.trim()).length > 500) errors.reason = LEAVE_ERRORS.bad_reason;
  return errors;
}
export function leaveSchoolDayCount(start, end, metadata) {
  if (!validSchoolDate(start) || !validSchoolDate(end) || end < start || end > shiftDate(start, 13)) return null;
  const holidays = new Set((metadata?.holidays || []).map(row => row.date));
  let count = 0;
  for (let day = start; day <= end; day = shiftDate(day, 1)) {
    const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !holidays.has(day)) count++;
  }
  return count;
}
export function leaveListMarkup(data, busyId = '') {
  const status = resourceMarkup(data);
  if (status) return status;
  if (!data.rows.length) return '<p class="data-status">ยังไม่มีใบลา</p>';
  const tones = { 'รออนุมัติ': 'pending', 'อนุมัติ': 'approved', 'ไม่อนุมัติ': 'rejected', 'ยกเลิก': 'cancelled' };
  return `<ul class="leave-list">${data.rows.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(row => `<li>
    <div class="leave-row"><strong>${escapeHtml(row.leave_type)}</strong><span class="leave-status ${tones[row.status] || 'cancelled'}">${escapeHtml(row.status)}</span></div>
    <p>${escapeHtml(thaiDate(row.start_date))}${row.end_date !== row.start_date ? ` – ${escapeHtml(thaiDate(row.end_date))}` : ''}</p>
    <p class="leave-reason">${escapeHtml(row.reason)}</p>
    ${row.decision_note ? `<p class="teacher-note">ข้อความจากครู: ${escapeHtml(row.decision_note)}</p>` : ''}
    ${row.status === 'รออนุมัติ' ? `<button type="button" class="button danger cancel-leave" id="cancel-${escapeHtml(row.id)}" data-id="${escapeHtml(row.id)}" ${busyId ? 'disabled' : ''}>${busyId === row.id ? 'กำลังยกเลิก…' : 'ยกเลิกใบลา'}</button>` : ''}</li>`).join('')}</ul>`;
}
export function leaveFormMarkup(draft, metadata, busy = false, error = '', today = bangkokDate()) {
  const { min, max } = leaveDateLimits(today), errors = draft.errors;
  const count = leaveSchoolDayCount(draft.start_date, draft.end_date, metadata);
  const attrs = field => `aria-invalid="${!!errors[field]}" aria-describedby="${field}-error${field === 'reason' ? ' reason-helper reason-count' : ''}"`;
  const fieldError = field => `<p class="field-error" id="${field}-error">${escapeHtml(errors[field])}</p>`;
  return `<form id="leave-form" novalidate aria-busy="${busy}">
    ${Object.keys(errors).length ? `<div class="notice error" id="leave-errors" role="alert" tabindex="-1"><h2>กรุณาตรวจข้อมูลใบลา</h2><ul>${Object.entries(errors).map(([field, message]) => `<li data-field="${field}"><a href="#leave-${field}">${escapeHtml(message)}</a></li>`).join('')}</ul></div>` : ''}
    <fieldset class="field leave-types" ${busy ? 'disabled' : ''}><legend>ประเภท (จำเป็น)</legend><div class="leave-type-options">${['ลาป่วย', 'ลากิจ'].map((type, index) => `<label><input id="leave-${index ? 'personal' : 'leave_type'}" type="radio" name="leave_type" value="${type}" required ${draft.leave_type === type ? 'checked' : ''} ${attrs('leave_type')}>${type}</label>`).join('')}</div>${fieldError('leave_type')}</fieldset>
    <div class="leave-dates"><div class="field"><label for="leave-start_date">ตั้งแต่ (จำเป็น)</label><input id="leave-start_date" name="start_date" type="date" required min="${min}" max="${max}" value="${escapeHtml(draft.start_date)}" ${attrs('start_date')} ${busy ? 'disabled' : ''}>${fieldError('start_date')}</div>
    <div class="field"><label for="leave-end_date">ถึง (จำเป็น)</label><input id="leave-end_date" name="end_date" type="date" required min="${validSchoolDate(draft.start_date) && draft.start_date > min ? draft.start_date : min}" max="${validSchoolDate(draft.start_date) && shiftDate(draft.start_date, 13) < max ? shiftDate(draft.start_date, 13) : max}" value="${escapeHtml(draft.end_date)}" ${attrs('end_date')} ${busy ? 'disabled' : ''}>${fieldError('end_date')}</div></div>
    <p id="leave-day-count" class="helper" role="status">${count === null ? 'เลือกช่วงวันลาไม่เกิน 14 วันเพื่อดูจำนวนวันเรียน' : `รวม ${count} วันเรียน${metadata ? '' : ' (ยังไม่หักวันหยุดโรงเรียน เพราะยังโหลดข้อมูลวันหยุดไม่ได้)'}`}</p>
    ${count === 0 ? '<p class="leave-warning" role="status">ช่วงนี้มีแต่วันหยุด กรุณาตรวจวันที่ก่อนส่งใบลา</p>' : ''}
    <div class="field"><label for="leave-reason">เหตุผล (จำเป็น)</label><textarea id="leave-reason" name="reason" rows="4" maxlength="500" required ${attrs('reason')} ${busy ? 'disabled' : ''}>${escapeHtml(draft.reason)}</textarea><p id="reason-helper" class="helper">เช่น มีไข้ ไปพบแพทย์</p><p id="reason-count" class="helper">${Array.from(draft.reason).length}/500 ตัวอักษร</p>${fieldError('reason')}</div>
    <button id="submit-leave" class="button primary full" ${busy ? 'disabled' : ''}>${busy ? 'กำลังส่ง…' : 'ส่งใบลา'}</button>
    <p id="leave-error" class="field-error" role="alert">${escapeHtml(error)}</p>
    <p class="helper">ถ้าเร่งด่วน โทรแจ้งครูประจำชั้นได้ตามเดิม</p></form>`;
}
export function schoolDaysMetadata(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.holidays) ||
      (data.year_start != null && !validSchoolDate(data.year_start)) ||
      (data.year_end != null && !validSchoolDate(data.year_end)) ||
      (data.year_start && data.year_end && data.year_end < data.year_start)) return null;
  return { year: data.year, year_start: data.year_start || null, year_end: data.year_end || null,
    holidays: data.holidays.filter(row => validSchoolDate(row?.date)).map(row => ({
      date: row.date, name: typeof row.name === 'string' ? row.name.trim() : '',
    })) };
}
export function schoolYearAttendance(rows, schoolDays) {
  return rows.filter(row => (!schoolDays?.year_start || row.attend_date >= schoolDays.year_start) &&
    (!schoolDays?.year_end || row.attend_date <= schoolDays.year_end));
}

// The same reset points as the session controller invalidate every S3 request.
// No data, module response, or derived amount is written to persistent storage.
export function createReadController(sb, { changed = () => {}, leavesChanged = () => {}, now = () => new Date(),
  loadMoney = () => import(MONEY_MODULE_URL) } = {}) {
  const state = { children: {}, feed: resource(), calendar: resource(), schoolDays: null,
    money: null, moneyLoading: false, today: bangkokDate(now()), loading: false, loadedAt: {} };
  let version = 0;
  const revisions = new WeakMap();
  function reset() {
    version++;
    state.children = {}; state.feed = resource(); state.calendar = resource();
    state.money = null; state.moneyLoading = false;
    state.schoolDays = null;
    state.loading = false; state.loadedAt = {};
  }
  async function load(children, { quiet = false, page = 'all', studentId = '' } = {}) {
    const knownYearStart = state.schoolDays?.year_start;
    if (!quiet) reset();
    const ownVersion = version;
    const notices = [];
    state.today = bangkokDate(now()); state.loading = true;
    if (!quiet) {
      state.moneyLoading = true;
      for (const child of children) state.children[child.student_id] = { attendance: resource(), savings: resource(), payments: resource(), leaves: resource() };
      changed();
    }
    async function fetchRows(target, name, args, selectRows = rows => rows) {
      const revision = (revisions.get(target) || 0) + 1;
      revisions.set(target, revision);
      try {
        const { data, error } = await sb.rpc(name, args);
        if (version !== ownVersion || revisions.get(target) !== revision) return;
        if (error || !Array.isArray(data)) throw new Error('Invalid response');
        if (quiet && name === 'my_leave_requests') {
          for (const row of data) {
            const previous = target.rows.find(old => old.id === row.id);
            if (previous && previous.status !== row.status && ['รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].includes(row.status)) {
              const date = thaiDate(row.start_date, { year: undefined });
              notices.push(`ใบลาวันที่ ${date} ${row.status === 'อนุมัติ' ? 'อนุมัติแล้ว' : row.status === 'ยกเลิก' ? 'ยกเลิกแล้ว' : row.status}`);
            }
          }
        }
        target.rows = selectRows(data);
        target.error = '';
      } catch {
        if (version !== ownVersion || revisions.get(target) !== revision) return;
        if (!quiet) target.error = 'โหลดข้อมูลไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
      } finally {
        if (version === ownVersion && revisions.get(target) === revision) { target.loading = false; changed(); }
      }
    }
    const money = !quiet || (!state.money && page !== 'calendar') ? (async () => {
      try {
        const module = await loadMoney();
        if (version === ownVersion && typeof module.computeSavingsBalance === 'function') state.money = module.computeSavingsBalance;
      } catch { /* Keep raw transactions visible; never substitute a local formula. */ }
      finally { if (version === ownVersion) { state.moneyLoading = false; changed(); } }
    })() : Promise.resolve();
    const schoolDays = page !== 'calendar' ? (async () => {
      const to = shiftDate(state.today, 120);
      // A known start is useful on refresh, provided the RPC's 400-day cap allows it.
      const from = knownYearStart && knownYearStart >= shiftDate(to, -400) && knownYearStart <= to
        ? knownYearStart : shiftDate(state.today, -40);
      try {
        const { data, error } = await sb.rpc('parent_school_days', { p_from: from, p_to: to });
        if (version !== ownVersion) return null;
        if (!error) {
          const metadata = schoolDaysMetadata(data);
          if (metadata || !quiet) state.schoolDays = metadata;
        }
      } catch { /* Optional metadata: keep the original attendance behaviour on failure. */ }
      if (version === ownVersion) { changed(); return state.schoolDays; }
      return null;
    })() : Promise.resolve(state.schoolDays);
    const jobs = [money, schoolDays];
    if (page === 'all' || page === 'home') jobs.push(fetchRows(state.feed, 'parent_feed', { p_days: 14 }));
    if (page === 'all' || page === 'calendar') jobs.push(fetchRows(state.calendar, 'public_calendar', { p_from: shiftDate(state.today, -7), p_to: shiftDate(state.today, 120) }));
    for (const child of children) {
      if (page === 'calendar' || (page === 'child' && String(child.student_id) !== studentId)) continue;
      const target = state.children[child.student_id], args = { p_student_id: child.student_id };
      jobs.push(schoolDays.then(metadata => {
        if (version !== ownVersion) return;
        return fetchRows(target.attendance, 'child_attendance', { ...args,
          p_from: metadata?.year_start || shiftDate(state.today, -400), p_to: state.today },
        rows => schoolYearAttendance(rows, metadata));
      }),
        fetchRows(target.leaves, 'my_leave_requests', args), fetchRows(target.savings, 'child_savings', args));
      if (page === 'all' || page === 'child') jobs.push(fetchRows(target.payments, 'child_payments', { ...args, p_limit: 50 }));
    }
    await Promise.allSettled(jobs);
    if (version !== ownVersion) return;
    const scopes = page === 'all' ? ['home', 'calendar', ...children.map(child => `child/${child.student_id}`)]
      : [page === 'child' ? `child/${studentId}` : page];
    for (const scope of scopes) state.loadedAt[scope] = now().getTime();
    state.loading = false;
    if (notices.length) leavesChanged(notices);
    changed();
  }
  async function loadLeaves(studentId) {
    const ownVersion = version, target = state.children[studentId]?.leaves;
    if (!target) return;
    const revision = (revisions.get(target) || 0) + 1;
    revisions.set(target, revision);
    target.loading = true; target.error = ''; changed();
    try {
      const { data, error } = await sb.rpc('my_leave_requests', { p_student_id: studentId });
      if (version !== ownVersion || revisions.get(target) !== revision) return;
      if (error || !Array.isArray(data)) throw Error('Invalid leaves');
      target.rows = data;
    } catch {
      if (version === ownVersion && revisions.get(target) === revision) target.error = 'โหลดใบลาไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
    } finally { if (version === ownVersion && revisions.get(target) === revision) { target.loading = false; changed(); } }
  }
  return { state, load, reset, loadLeaves };
}

export function savingsBalance(data, money) {
  if (!data || data.loading || data.error || !money) return null;
  try { const value = money(data.rows); return Number.isFinite(value) ? value : null; }
  catch { return null; }
}
export function homeSummary(children, read) {
  const records = children.map(child => read.children[child.student_id]);
  const attendance = records.map(record => record?.attendance);
  const rows = attendance.flatMap(data => data?.rows.filter(row => row.attend_date === read.today) || []);
  const weekend = [0, 6].includes(new Date(`${read.today}T12:00:00+07:00`).getUTCDay());
  const holiday = read.schoolDays?.holidays.find(row => row.date === read.today);
  const holidayLabel = holiday ? `วันหยุด${holiday.name ? ` · ${holiday.name}` : ''}` : '';
  const pending = attendance.some(data => !data || data.loading);
  const failed = attendance.some(data => data?.error);
  const present = rows.filter(row => ['มา', 'มาสาย'].includes(row.status)).length;
  const amounts = records.map(record => savingsBalance(record?.savings, read.money));
  const savingsPending = read.moneyLoading || records.some(record => !record || record.savings.loading);
  return { attendanceBusy: pending, savingsBusy: savingsPending,
  attendance: pending ? 'กำลังโหลด…' : failed ? 'ยังแสดงข้อมูลไม่ได้' : !rows.length
    ? (holidayLabel || (weekend ? '—' : 'ยังไม่เช็คชื่อ')) : `${present} / ${children.length} คน`,
  attendanceDetail: pending || failed ? 'ตรวจข้อมูลการมาเรียน' : holiday && rows.length < children.length
    ? (rows.length ? 'ไม่มีรายการเช็คชื่อของลูกบางคนในวันหยุด' : 'วันหยุดโรงเรียน') : rows.length < children.length && rows.length
    ? `ยังไม่เช็คชื่อ ${children.length - rows.length} คน` : weekend && !rows.length ? 'ไม่มีรายการเช็คชื่อในวันหยุด' : !rows.length ? 'รอครูบันทึกการมาเรียน' : 'มาเรียน รวมมาสาย',
  savings: savingsPending ? 'กำลังโหลด…' : amounts.some(value => value === null) ? 'ยังแสดงยอดไม่ได้' : baht(amounts.reduce((sum, value) => sum + value, 0)) };
}

export function splitFeed(rows, children, selectedId, today) {
  const ids = new Set(filterChildren(children, selectedId).map(child => String(child.student_id)));
  const filtered = rows.filter(row => ids.has(String(row.student_id))).slice().sort((a, b) => new Date(b.happened_at) - new Date(a.happened_at));
  return { today: filtered.filter(row => bangkokDate(new Date(row.happened_at)) === today),
    earlier: filtered.filter(row => bangkokDate(new Date(row.happened_at)) !== today) };
}
export function feedText(row, child) {
  const name = firstName(child.nickname || child.name) || 'ลูกของฉัน';
  if (row.kind === 'attendance') return `${name} ${{ มา: 'มาเรียนแล้ว', มาสาย: 'มาสาย', ขาด: 'ขาดเรียน', ลาป่วย: 'ลาป่วย', ลากิจ: 'ลากิจ' }[row.label] || row.label}`;
  if (row.kind === 'savings') return `${name} ${row.label === 'ฝาก' ? 'ฝากเงินออม' : row.label === 'ถอน' ? 'ถอนเงินออม' : row.label === 'หักค่ารถ' ? 'หักค่ารถจากเงินออม' : row.label === 'หักค่าใช้จ่าย' ? 'หักค่าใช้จ่ายจากเงินออม' : row.label} ${baht(row.amount)}`;
  return `${name} ชำระ${row.kind === 'fee' ? 'ค่าธรรมเนียม' : 'ค่ารถ'} ${baht(row.amount)}${row.kind === 'fee' && row.ref ? ` · ใบเสร็จ ${row.ref}` : ''}`;
}

export function feedMarkup(rows, children, today) {
  return rows.map(row => {
    const index = children.findIndex(child => String(child.student_id) === String(row.student_id));
    if (index < 0) return '';
    const day = bangkokDate(new Date(row.happened_at));
    const date = day === today ? 'วันนี้' : day === shiftDate(today, -1) ? 'เมื่อวาน' : thaiDate(day);
    const time = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }).format(new Date(row.happened_at));
    return `<li class="feed-item"><span class="feed-icon tone-${childTone(index)}">${icon(row.kind === 'attendance' ? 'attendance' : row.kind === 'savings' ? 'wallet' : row.kind === 'fee' ? 'receipt' : 'bus')}</span><div><p class="${row.kind === 'attendance' && row.label === 'ขาด' ? 'absence' : ''}">${escapeHtml(feedText(row, children[index]))}</p><time datetime="${escapeHtml(row.happened_at)}">${escapeHtml(date)} · ${escapeHtml(time)} น.</time></div></li>`;
  }).join('');
}

const attendanceStates = { มา: ['ม', 'present'], มาสาย: ['ส', 'late'], ขาด: ['ข', 'absent'], ลาป่วย: ['ป', 'leave'], ลากิจ: ['ก', 'leave'] };
export function monthShift(month, offset) {
  const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function attendanceMonth(rows, month, schoolDays = null) {
  rows = schoolYearAttendance(rows, schoolDays);
  const days = [], lookup = new Map(rows.map(row => [row.attend_date, row.status]));
  const holidays = new Map((schoolDays?.holidays || []).map(row => [row.date, row]));
  const first = new Date(`${month}-01T12:00:00Z`), last = new Date(first); last.setUTCMonth(last.getUTCMonth() + 1, 0);
  // Five school-day columns, preserving blanks at the beginning/end of a week.
  const monday = new Date(first), offset = (first.getUTCDay() + 6) % 7;
  monday.setUTCDate(first.getUTCDate() + (offset > 4 ? 7 - offset : -offset));
  for (let date = monday; date <= last; date.setUTCDate(date.getUTCDate() + 1)) {
    if ([0, 6].includes(date.getUTCDay())) continue;
    const day = date.toISOString().slice(0, 10);
    days.push({ date: day, number: date.getUTCDate(), inMonth: day.startsWith(month),
      status: lookup.get(day) || '', holiday: holidays.get(day) });
  }
  const summary = { มา: 0, มาสาย: 0, ขาด: 0, ลา: 0 };
  for (const row of rows.filter(row => row.attend_date.startsWith(month))) {
    if (['ลาป่วย', 'ลากิจ'].includes(row.status)) summary.ลา++;
    else if (row.status in summary) summary[row.status]++;
  }
  return { days, summary };
}
export function attendanceMarkup(rows, month, today, schoolDays = null) {
  rows = schoolYearAttendance(rows, schoolDays);
  const { days, summary } = attendanceMonth(rows, month, schoolDays);
  const earliest = schoolDays?.year_start?.slice(0, 7) || rows.map(row => row.attend_date).sort()[0]?.slice(0, 7) || today.slice(0, 7);
  return `<div class="month-controls"><button id="previous-month" class="button quiet" aria-label="เดือนก่อน" ${month <= earliest ? 'disabled' : ''}>${icon('back')}</button><h3 id="attendance-month" tabindex="-1">${escapeHtml(thaiDate(`${month}-01`, { day: undefined, month: 'long' }))}</h3><button id="next-month" class="button quiet" aria-label="เดือนถัดไป" ${month >= today.slice(0, 7) ? 'disabled' : ''}>${icon('forward')}</button></div>
    <div class="attendance-grid" role="list" aria-label="การมาเรียน จันทร์ถึงศุกร์">${['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.'].map(day => `<span class="weekday" aria-hidden="true">${day}</span>`).join('')}${days.map(day => {
      const future = day.date > today && !day.status;
      const holidayName = day.holiday?.name || 'วันหยุดโรงเรียน';
      const [abbr, tone] = attendanceStates[day.status] || (future ? ['', 'future'] : day.holiday ? ['หยุด', 'holiday'] : ['—', 'unrecorded']);
      const label = day.status || (future ? 'ยังไม่ถึงวัน' : day.holiday ? holidayName : 'ไม่มีรายการเช็คชื่อ');
      return day.inMonth ? `<div role="listitem" class="attendance-day ${tone}"${day.holiday ? ` title="${escapeHtml(holidayName)}"` : ''} aria-label="${escapeHtml(thaiDate(day.date))} ${escapeHtml(label)}"><span>${day.number}</span>${abbr ? `<strong>${abbr}</strong>` : ''}</div>` : '<span aria-hidden="true"></span>';
    }).join('')}</div><ul class="attendance-legend">${Object.entries(attendanceStates).map(([label, [abbr, tone]]) => `<li><span class="${tone}">${abbr}</span> ${label}</li>`).join('')}<li><span class="holiday">หยุด</span> = วันหยุดโรงเรียน</li><li>— ไม่มีรายการ</li></ul>
    <p class="month-summary">มา ${summary.มา} · สาย ${summary.มาสาย} · ขาด ${summary.ขาด} · ลา ${summary.ลา}</p>${!rows.some(row => row.attend_date.startsWith(month)) ? '<p class="muted">ยังไม่มีรายการเช็คชื่อในเดือนนี้</p>' : ''}`;
}

function resourceMarkup(data) {
  if (!data || data.loading) return '<p class="data-status" role="status">กำลังโหลดข้อมูล…</p>';
  if (data.error) return `<p class="field-error" role="alert">${escapeHtml(data.error)}</p><button class="button quiet retry-data">ลองใหม่</button>`;
  return '';
}
export function savingsMarkup(data, money, expanded = false, moneyLoading = false) {
  const unavailable = resourceMarkup(data);
  if (unavailable) return unavailable;
  const balance = savingsBalance(data, money);
  const rows = data.rows.slice().reverse();
  return `<p class="savings-balance">${moneyLoading ? 'กำลังโหลด…' : balance === null ? 'ยังแสดงยอดไม่ได้' : escapeHtml(baht(balance))}</p>${balance === null && !moneyLoading ? '<p class="muted">ยอดคงเหลือยังไม่พร้อมแสดง คุณยังดูรายการเงินออมได้</p><button class="button quiet retry-data">ลองใหม่</button>' : ''}
    ${rows.length ? `<ol class="transaction-list">${(expanded ? rows : rows.slice(0, 10)).map(row => `<li><div><strong>${escapeHtml(row.kind)}</strong><time datetime="${escapeHtml(row.txn_date)}">${escapeHtml(thaiDate(row.txn_date))}</time></div><strong>${escapeHtml(baht(row.amount))}</strong></li>`).join('')}</ol>${rows.length > 10 ? `<button id="expand-savings" class="button quiet full" aria-expanded="${expanded}">${expanded ? 'แสดงล่าสุด 10 รายการ' : 'ดูทั้งหมด'}</button>` : ''}` : '<p class="muted">ยังไม่มีรายการเงินออม</p>'}`;
}
export function paymentsMarkup(data) {
  return resourceMarkup(data) || (data.rows.length ? `<ol class="transaction-list">${data.rows.map(row => `<li><div><strong>${escapeHtml(row.source)}</strong><time datetime="${escapeHtml(row.paid_on)}">${escapeHtml(thaiDate(row.paid_on))}</time>${row.receipt_no ? `<p>ใบเสร็จ ${escapeHtml(row.receipt_no)}</p>` : ''}${row.method ? `<p>${escapeHtml(row.method)}</p>` : ''}${row.items?.length ? `<details><summary>รายการชำระ</summary><ul>${row.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>` : ''}</div><strong>${escapeHtml(baht(row.amount))}</strong></li>`).join('')}</ol><p class="helper">แสดงประวัติล่าสุดไม่เกิน 50 รายการ</p>` : '<p class="muted">ยังไม่มีประวัติการชำระ</p>');
}
export function calendarMarkup(data) {
  const unavailable = resourceMarkup(data);
  if (unavailable) return unavailable;
  if (!data.rows.length) return '<div class="empty-page"><span class="empty-icon">' + icon('calendar') + '</span><h2>ยังไม่มีกิจกรรมที่โรงเรียนประกาศ</h2><p>กิจกรรมที่โรงเรียนเผยแพร่จะแสดงที่นี่</p></div>';
  const groups = new Map();
  for (const row of data.rows.slice().sort((a, b) => a.start_date.localeCompare(b.start_date))) {
    const month = row.start_date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(row);
  }
  return [...groups].map(([month, rows]) => `<section class="calendar-month"><h2>${escapeHtml(thaiDate(`${month}-01`, { day: undefined, month: 'long' }))}</h2>${rows.map(row => `<article class="calendar-card"><p class="calendar-date">${escapeHtml(thaiDate(row.start_date))}${row.end_date !== row.start_date ? ` – ${escapeHtml(thaiDate(row.end_date))}` : ''}</p><h3>${escapeHtml(row.title)}</h3><span class="grade-chip">${escapeHtml(row.category)}</span>${row.detail ? `<details><summary>รายละเอียด</summary><p class="event-detail">${escapeHtml(row.detail)}</p></details>` : ''}</article>`).join('')}</section>`).join('');
}

// All student data stays in this controller's memory. Epochs discard responses
// from a previous account/sign-out, including an invite redeemed in another tab.
export function createController(sb, { changed = () => {}, hash = () => '', redirectTo = '', defer = fn => setTimeout(fn, 0),
  now = () => new Date(), loadMoney, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  const state = {
    session: null, children: [], loaded: false, loading: false, loadError: '',
    code: '', redeemError: '', redeemBusy: false, lockedUntil: 0,
    loginError: '', loginBusy: false, signoutBusy: false, success: '', resumeNotice: '',
    leaveDraft: null, leaveBusy: false, leaveError: '', cancelBusyId: '', cancelError: '',
  };
  let epoch = 0, request = 0, mutation = 0, authRevision = 0, subscription, stopped = false;
  const notify = () => { if (!stopped) changed(state, routeFor(state, hash())); };
  let noticeTimer;
  function clearResumeNotice() { clearTimer(noticeTimer); state.resumeNotice = ''; }
  const reads = createReadController(sb, { changed: notify, now, loadMoney, leavesChanged(messages) {
    if (stopped || !state.session || state.signoutBusy || routeFor(state, hash()) === 'leave') return;
    clearResumeNotice(); state.success = ''; state.resumeNotice = messages.join(' · ');
    noticeTimer = setTimer(() => { state.resumeNotice = ''; notify(); }, 5000);
    noticeTimer?.unref?.();
  } });
  state.read = reads.state;
  const clearPrivateState = () => {
    reads.reset(); resetLeave(); clearResumeNotice();
    state.children = []; state.loaded = false; state.loading = false; state.loadError = '';
    state.code = ''; state.redeemError = ''; state.redeemBusy = false; state.lockedUntil = 0;
    state.success = ''; state.loginBusy = false; state.signoutBusy = false;
  };
  function acceptSession(session) {
    if (stopped) return;
    if (state.session?.user?.id === session?.user?.id && !!state.session === !!session) {
      state.session = session;
      notify();
      return;
    }
    epoch++; request++; clearPrivateState(); state.loginError = ''; state.session = session;
    notify();
    if (session) defer(() => loadChildren()); // Outside Supabase's auth callback.
  }
  async function loadChildren() {
    if (!state.session || state.signoutBusy) return;
    const ownEpoch = epoch, ownRequest = ++request;
    reads.reset(); resetLeave();
    state.children = []; state.loaded = false; state.loading = true; state.loadError = ''; notify();
    try {
      const { data, error } = await sb.rpc('my_children');
      if (ownEpoch !== epoch || ownRequest !== request) return;
      if (error || !Array.isArray(data)) throw error || new Error('Invalid children response');
      state.children = data; state.loaded = true;
      if (data.length) void reads.load(data);
    } catch {
      if (ownEpoch !== epoch || ownRequest !== request) return;
      state.loadError = 'โหลดรายชื่อลูกไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วกดลองใหม่';
    } finally {
      if (ownEpoch === epoch && ownRequest === request) { state.loading = false; notify(); }
    }
  }
  async function start() {
    let revision;
    try {
      const listener = sb.auth.onAuthStateChange((_event, session) => {
        authRevision++; acceptSession(session);
      });
      subscription = listener.data.subscription;
      revision = authRevision;
      const { data, error } = await sb.auth.getSession();
      if (revision !== authRevision) return;
      if (error) throw error;
      acceptSession(data.session);
    } catch (error) {
      if (revision !== undefined && revision !== authRevision) return;
      state.loginError = authErrorMessage(error); notify();
    }
  }
  async function signIn() {
    if (state.loginBusy) return;
    state.loginBusy = true; state.loginError = ''; notify();
    try {
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
      // Success navigates away; keep disabled until then.
    } catch (error) {
      state.loginBusy = false; state.loginError = authErrorMessage(error); notify();
    }
  }
  async function redeem() {
    if (!state.session || state.signoutBusy || state.redeemBusy ||
        state.lockedUntil > Date.now() || inviteCharacters(state.code).length !== 8) return;
    const ownEpoch = epoch;
    state.redeemBusy = true; state.redeemError = ''; state.success = ''; notify();
    try {
      const { data, error } = await sb.rpc('redeem_guardian_invite', { p_code: state.code });
      if (ownEpoch !== epoch) return;
      if (error) throw error;
      if (data?.ok === true && data.student) {
        state.code = '';
        state.success = `ผูกกับ ${data.student.name} (${classLabel(data.student)}) แล้ว`;
        // Preserve the success notice while refreshing the server's full list.
        await loadChildren();
        return true;
      }
      if (data?.error === 'not_signed_in') {
        acceptSession(null);
        state.loginError = redeemErrorMessage(data);
        // Clear this app's expired auth storage without touching teacher sessions.
        void sb.auth.signOut({ scope: 'local' }).catch(() => {});
      } else {
        state.redeemError = redeemErrorMessage(data);
        if (data?.error === 'too_many_attempts') state.lockedUntil = Date.now() + 60 * 60 * 1000;
      }
    } catch {
      if (ownEpoch === epoch) state.redeemError = redeemErrorMessage(null);
    } finally {
      if (ownEpoch === epoch) { state.redeemBusy = false; notify(); }
      else if (!state.session) notify();
    }
    return false;
  }
  function resetLeave() {
    mutation++; state.leaveDraft = null; state.leaveBusy = false; state.leaveError = '';
    state.cancelBusyId = ''; state.cancelError = '';
  }
  const ownsChild = id => !!state.session && !state.signoutBusy && state.children.some(child => String(child.student_id) === String(id));
  async function submitLeave() {
    const draft = state.leaveDraft;
    if (!draft || !ownsChild(draft.studentId) || state.leaveBusy || state.cancelBusyId) return false;
    draft.errors = validateLeave(draft);
    state.leaveError = '';
    if (Object.keys(draft.errors).length) { notify(); return false; }
    const ownEpoch = epoch, ownMutation = ++mutation;
    state.leaveBusy = true; state.success = ''; notify();
    try {
      const { data, error } = await sb.rpc('submit_leave_request', { p_student_id: draft.studentId,
        p_leave_type: draft.leave_type, p_start: draft.start_date, p_end: draft.end_date, p_reason: draft.reason.trim() });
      if (ownEpoch !== epoch || ownMutation !== mutation) return false;
      if (error) throw error;
      if (typeof data !== 'string' || !data) throw Error('Invalid response');
      state.leaveDraft = null;
      state.success = 'ส่งใบลาแล้ว รอครูประจำชั้นอนุมัติ';
      void reads.loadLeaves(draft.studentId);
      return true;
    } catch (error) {
      if (ownEpoch === epoch && ownMutation === mutation) state.leaveError = leaveErrorMessage(error);
      return false;
    } finally { if (ownEpoch === epoch && ownMutation === mutation) { state.leaveBusy = false; notify(); } }
  }
  async function cancelLeave(studentId, id) {
    if (!ownsChild(studentId) || state.cancelBusyId || state.leaveBusy ||
        !state.read.children[studentId]?.leaves.rows.some(row => row.id === id && row.status === 'รออนุมัติ')) return;
    const ownEpoch = epoch, ownMutation = ++mutation;
    state.cancelBusyId = id; state.cancelError = ''; state.success = ''; notify();
    try {
      const { error } = await sb.rpc('cancel_leave_request', { p_id: id });
      if (ownEpoch !== epoch || ownMutation !== mutation) return;
      if (error) throw error;
      state.success = 'ยกเลิกใบลาแล้ว';
      await reads.loadLeaves(studentId);
    } catch (error) {
      if (ownEpoch === epoch && ownMutation === mutation) state.cancelError = leaveErrorMessage(error);
    } finally { if (ownEpoch === epoch && ownMutation === mutation) { state.cancelBusyId = ''; notify(); } }
  }
  async function signOut() {
    if (state.signoutBusy || !state.session) return;
    // Clear visible/private data immediately; no pending RPC can restore it.
    epoch++; request++; clearPrivateState(); state.signoutBusy = true; notify();
    const ownEpoch = epoch;
    try {
      const { error } = await sb.auth.signOut();
      if (ownEpoch !== epoch) return;
      if (error) throw error;
      acceptSession(null);
    } catch {
      if (ownEpoch === epoch && state.session) {
        state.signoutBusy = false;
        state.loadError = 'ออกจากระบบไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วกดออกจากระบบอีกครั้ง';
        notify();
      }
    }
  }
  async function refreshOnReturn() {
    if (stopped || !state.session || state.signoutBusy || !state.loaded || state.loading ||
        state.read.loading || state.leaveDraft || state.leaveBusy || state.cancelBusyId || state.redeemBusy) return;
    const page = routeFor(state, hash());
    if (!['home', 'child', 'calendar'].includes(page)) return;
    const studentId = page === 'child' ? hash().slice('#child/'.length) : '';
    if (page === 'child' && !ownsChild(studentId)) return;
    const scope = page === 'child' ? `child/${studentId}` : page;
    const loadedAt = state.read.loadedAt[scope];
    if (loadedAt === undefined || now().getTime() - loadedAt <= 60_000) return;
    // Same read version/revisions guard every reply after reset, sign-out or account change.
    return reads.load(state.children, { quiet: true, page, studentId });
  }
  return { state, start, signIn, redeem, signOut, loadChildren, acceptSession, notify, submitLeave, cancelLeave,
    refreshOnReturn,
    beginLeave(id) { if (ownsChild(id) && state.leaveDraft?.studentId !== String(id)) { state.leaveDraft = newLeaveDraft(id); state.leaveError = ''; } },
    discardLeave() { resetLeave(); },
    loadLeaves(id) { if (ownsChild(id)) return reads.loadLeaves(id); },
    loadData() { if (state.session && !state.signoutBusy && state.loaded) { resetLeave(); return reads.load(state.children); } },
    stop() { stopped = true; epoch++; request++; subscription?.unsubscribe(); clearPrivateState(); state.session = null; },
  };
}

export function registerResumeRefresh(controller, win, doc, updates = null) {
  const refresh = event => {
    // A persisted page was stopped and cleared on pagehide; mount's auth-safe reload handles it.
    if (event?.persisted || doc.visibilityState !== 'visible' || updates?.isReloadPending()) return;
    void controller.refreshOnReturn();
  };
  const stop = () => {
    doc.removeEventListener('visibilitychange', refresh);
    win.removeEventListener('pageshow', refresh); win.removeEventListener('pagehide', stop);
  };
  doc.addEventListener('visibilitychange', refresh);
  win.addEventListener('pageshow', refresh); win.addEventListener('pagehide', stop);
  return stop;
}

const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  share: '<path d="M12 15V3m-4 4 4-4 4 4M5 11v10h14V11"/>',
  add: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 7v10M7 12h10"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  forward: '<path d="m9 6 6 6-6 6"/>',
  receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8M8 12h6"/>',
  bus: '<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16M8 3v8M16 3v8M7 19v2M17 19v2M8 15h.01M16 15h.01"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>',
  attendance: '<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18m-9 5 2 2 4-4"/>',
  wallet: '<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 10h20M16 15h2"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  home: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`; }
// Google's standard multicolour G, kept in its original proportions and colours.
const googleIcon = `<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="var(--google-red)" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="var(--google-blue)" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="var(--google-yellow)" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z"/><path fill="var(--google-green)" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

export function firstName(name, kind = 'child') {
  const prefix = kind === 'guardian' ? /^(?:นางสาว|นาย|นาง)\s*/ : /^(?:เด็กชาย|เด็กหญิง|ด\.\s*ช\.|ด\.\s*ญ\.)\s*/;
  return String(name ?? '').trim().replace(prefix, '').trim().split(/\s+/)[0] || '';
}

export function guardianGreeting(children) {
  const name = firstName(children[0]?.guardian_name, 'guardian');
  return name ? `สวัสดี คุณ${name}` : 'สวัสดี ผู้ปกครอง';
}

export function childInitials(name) {
  const text = firstName(name);
  const segments = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].map(part => part.segment)
    : Array.from(text);
  return segments.slice(0, 2).join('') || '—';
}

export function childTone(index) { return index === 0 ? 'teal' : index === 1 ? 's5' : `s${(index - 2) % 14 + 1}`; }

export function filterChildren(children, selectedId) {
  return selectedId === null ? children : children.filter(child => String(child.student_id) === String(selectedId));
}

export function thaiToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok',
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value || '';
  return `${part('weekday').replace(/^วัน/, '')} ${part('day')} ${part('month')} ${part('year')}`;
}

export function bottomNavigation(route) {
  return [['home', 'หน้าแรก', 'home'], ['calendar', 'ปฏิทิน', 'calendar'],
    ['notifications', 'แจ้งเตือน', 'bell'], ['account', 'บัญชี', 'account']]
    .map(([page, label, symbol]) => `<a href="#${page}"${page === route ? ' aria-current="page"' : ''}><span class="nav-icon">${icon(symbol)}</span><span>${label}</span></a>`).join('');
}

export function childMarkup(child, index = 0) {
  return `<li class="child-card"><a class="child-card-link" href="#child/${encodeURIComponent(child.student_id)}"><div class="child-who"><span class="avatar tone-${childTone(index)}" aria-hidden="true">${escapeHtml(childInitials(child.name))}</span>
    <div class="child-info"><h2>${escapeHtml(child.name)}</h2><span class="grade-chip">${escapeHtml(classLabel(child))}</span>
    <p class="relation">คุณเป็น ${escapeHtml(child.relation)}</p></div></div>
    ${child.status && child.status !== 'กำลังศึกษา' ? `<p><span class="student-status">สถานะ: ${escapeHtml(child.status)}</span></p>` : ''}<span class="child-open">ดูการมาเรียนและการเงิน ${icon('forward')}</span></a></li>`;
}

export function mountParentApp(sb, win = window, doc = document, initialPrompt = null, updates = null) {
  const main = doc.getElementById('main'), account = doc.getElementById('account-bar');
  const app = doc.getElementById('app'), nav = doc.getElementById('bottom-nav');
  const success = doc.getElementById('success-message');
  let previousRoute = '', previousView = '', deferredPrompt = initialPrompt, installBusy = false, installError = '';
  let selectedChildId = null, filterAccountId = null;
  let detailChildId = null, detailMonth = '', expandedSavings = false, homeScroll = 0, homeFilterScroll = 0;
  let closeDialog = null;
  let dismissed = false;
  try { dismissed = win.localStorage.getItem(INSTALL_DISMISSED_KEY) === '1'; } catch { /* Private mode: session-only preference. */ }
  const standaloneQuery = win.matchMedia('(display-mode: standalone)');
  const controller = createController(sb, {
    hash: () => win.location.hash,
    redirectTo: win.location.origin + win.location.pathname,
    changed: render,
  });
  const { state } = controller;
  function installBanner() {
    const kind = installKind({ userAgent: win.navigator.userAgent, platform: win.navigator.platform,
      maxTouchPoints: win.navigator.maxTouchPoints, standalone: standaloneQuery.matches || win.navigator.standalone === true,
      dismissed, prompt: deferredPrompt });
    if (!kind) return '';
    return `<aside class="install-banner" aria-label="แนะนำติดตั้งแอป">
      <div class="install-heading"><span class="install-icon" aria-hidden="true">${icon('phone')}</span><div class="install-copy"><h2>เพิ่มลงหน้าจอหลัก</h2><p class="helper">เพื่อรับแจ้งเตือนเมื่อลูกขาดเรียน</p></div><button id="dismiss-install" class="button quiet install-dismiss" aria-label="ปิดคำแนะนำติดตั้งแอป">${icon('close')}</button></div>
      ${kind === 'ios' ? `<ol class="install-steps"><li>แตะ ${icon('share')} แชร์ ใน Safari</li><li>เลือก ${icon('add')} เพิ่มลงในหน้าจอโฮม</li></ol>` : `<button id="install-app" class="button primary full" ${installBusy ? 'disabled' : ''}>${installBusy ? 'กำลังติดตั้ง…' : 'ติดตั้งแอป'}</button>`}
      <p class="field-error" role="alert">${escapeHtml(installError)}</p></aside>`;
  }
  function askLeaveConfirmation(title, message, action) {
    if (closeDialog) return Promise.resolve(false);
    const previousFocus = doc.activeElement;
    const dialog = doc.createElement('dialog');
    dialog.className = 'leave-dialog';
    dialog.setAttribute('aria-labelledby', 'leave-dialog-title');
    dialog.setAttribute('aria-describedby', 'leave-dialog-message');
    dialog.innerHTML = `<h2 id="leave-dialog-title">${escapeHtml(title)}</h2><p id="leave-dialog-message">${escapeHtml(message)}</p><div class="actions"><button type="button" class="button secondary" id="keep-leave" autofocus>กลับไป</button><button type="button" class="button danger" id="confirm-leave">${escapeHtml(action)}</button></div>`;
    doc.body.append(dialog);
    return new Promise(resolve => {
      closeDialog = (accepted = false) => {
        closeDialog = null; dialog.close(); dialog.remove();
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        resolve(accepted);
      };
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(false); });
      dialog.querySelector('#keep-leave').addEventListener('click', () => closeDialog(false));
      dialog.querySelector('#confirm-leave').addEventListener('click', () => closeDialog(true));
      dialog.showModal();
    });
  }
  function render(s, route) {
    const activeId = doc.activeElement?.id;
    const activeHeading = doc.activeElement?.tagName === 'H1';
    const activeHref = doc.activeElement?.closest('a')?.getAttribute('href');
    const selection = ['invite-code', 'leave-reason'].includes(activeId)
      ? [doc.activeElement.selectionStart, doc.activeElement.selectionEnd] : null;
    const filterScroll = main.querySelector('.child-filters')?.scrollLeft || 0;
    const view = ['child', 'leave'].includes(route) ? win.location.hash : route;
    // คืนเส้นทางฟอร์มก่อนถาม รวมถึงกรณีกดปุ่มย้อนกลับของเบราว์เซอร์
    if (previousRoute === 'leave' && previousView !== view && s.session?.user?.id === filterAccountId &&
        s.leaveDraft && (s.leaveDraft.dirty || s.leaveBusy)) {
      const destination = win.location.hash, draft = s.leaveDraft;
      win.history.replaceState(null, '', previousView);
      void askLeaveConfirmation('ออกจากฟอร์มใบลา?', s.leaveBusy
        ? 'ใบลากำลังส่ง หากออกตอนนี้อาจส่งสำเร็จแล้ว กรุณาตรวจรายการใบลาก่อนส่งซ้ำ'
        : 'ข้อมูลที่กรอกยังไม่ได้ส่ง ต้องการทิ้งข้อมูลหรือไม่', 'ออกจากฟอร์ม').then(accepted => {
        if (!accepted || state.leaveDraft !== draft) return;
        controller.discardLeave();
        win.history.replaceState(null, '', destination); controller.notify();
      });
      return;
    }
    const openDetails = view === previousView ? [...main.querySelectorAll('details')].map(detail => detail.open) : [];
    if (previousRoute === 'home') { homeScroll = win.scrollY; homeFilterScroll = filterScroll; }
    const focusRoute = view !== previousView;
    const returningHome = route === 'home' && previousRoute === 'child';
    if (previousRoute === 'leave' && view !== previousView && s.leaveDraft) controller.discardLeave();
    previousRoute = route; previousView = view;
    if (['login', 'home', 'redeem', 'calendar', 'notifications', 'account'].includes(route) && win.location.hash !== `#${route}`) {
      win.history.replaceState(null, '', `#${route}`);
    }
    if (filterAccountId !== s.session?.user?.id) {
      closeDialog?.(false);
      selectedChildId = null; filterAccountId = s.session?.user?.id;
      detailChildId = null; detailMonth = ''; expandedSavings = false; homeScroll = 0; homeFilterScroll = 0;
    }
    if (selectedChildId !== null && !s.children.some(child => String(child.student_id) === selectedChildId)) selectedChildId = null;
    app.dataset.screen = route;
    const hasNav = !!s.session && s.children.length > 0;
    app.classList.toggle('with-nav', hasNav);
    nav.hidden = !hasNav; nav.innerHTML = hasNav ? bottomNavigation(['child', 'leave'].includes(route) ? 'home' : route) : '';
    doc.documentElement.classList.toggle('has-bottom-nav', hasNav);
    doc.getElementById('school-brand').hidden = !['loading', 'error'].includes(route);
    doc.getElementById('site-footer').hidden = !['loading', 'error'].includes(route);
    const showAccountBar = !!s.session && ['redeem', 'loading', 'error'].includes(route);
    account.hidden = !showAccountBar;
    account.classList.toggle('redeem-topbar', route === 'redeem');
    account.innerHTML = showAccountBar ? `${route === 'redeem' && s.children.length ? `<a class="button back-button" href="#home" aria-label="ย้อนกลับไปหน้าแรก">${icon('back')}</a>` : ''}
      <div class="account-info">${route === 'redeem' ? '<strong>เชื่อมกับลูกของคุณ</strong>' : '<small>บัญชีที่ใช้อยู่</small>'}<p class="account-email">${escapeHtml(s.session.user.email || 'ไม่พบอีเมลของบัญชี')}</p></div>
      ${route !== 'redeem' || !s.children.length ? `<button id="sign-out" class="button signout" ${s.signoutBusy ? 'disabled' : ''}>${s.signoutBusy ? 'กำลังออก…' : 'ออกจากระบบ'}</button>` : ''}` : '';
    account.querySelector('#sign-out')?.addEventListener('click', controller.signOut);
    if (focusRoute && route === 'leave') { s.success = ''; s.resumeNotice = ''; }
    success.classList.toggle('resume-toast', !!s.resumeNotice);
    success.hidden = !(s.resumeNotice || s.success); success.textContent = s.resumeNotice || s.success;
    main.setAttribute('aria-busy', String(route === 'loading' || s.redeemBusy || s.leaveBusy));
    if (route === 'login') {
      doc.title = 'แอปผู้ปกครอง — โรงเรียนเจริญศึกษา';
      main.innerHTML = `<section class="login-screen"><div class="login-hero"><div class="crest"><img src="./icons/icon-192.png" alt="ตราโรงเรียนเจริญศึกษา" width="80" height="80"></div>
        <p class="school">โรงเรียนเจริญศึกษา</p><h1 tabindex="-1">แอปผู้ปกครอง</h1><p class="tagline">ติดตามลูกได้ทุกวัน ในมือถือของคุณ</p></div>
        <div class="login-sheet"><ul class="features">
          <li><span class="feature-icon">${icon('attendance')}</span><div><strong>การมาเรียนรายวัน</strong><p>มา สาย ขาด ลา เห็นทันทีที่ครูเช็คชื่อ</p></div></li>
          <li><span class="feature-icon">${icon('wallet')}</span><div><strong>เงินออมและค่าใช้จ่าย</strong><p>ยอดออม ใบเสร็จ ใบแจ้งค่าธรรมเนียม</p></div></li>
          <li><span class="feature-icon">${icon('bell')}</span><div><strong>แจ้งเตือนสำคัญ</strong><p>ลูกขาดเรียน ผลใบลา ใบแจ้งหนี้ออก</p></div></li></ul>
        <button id="google-login" class="button google full" ${s.loginBusy ? 'disabled' : ''} aria-describedby="login-error">${googleIcon}<span>${s.loginBusy ? 'กำลังไปหน้า Google…' : 'เข้าสู่ระบบด้วย Google'}</span></button>
        <p id="login-error" class="field-error" role="alert">${escapeHtml(s.loginError)}</p>
        <p class="login-fine">ครั้งแรกต้องใช้รหัสจากครูประจำชั้น · <a href="./privacy.html">นโยบายความเป็นส่วนตัว</a></p></div></section>`;
      main.querySelector('#google-login').addEventListener('click', controller.signIn);
    } else if (route === 'loading') {
      main.innerHTML = `<section class="panel"><h1 tabindex="-1">${s.signoutBusy ? 'กำลังออกจากระบบ…' : 'กำลังโหลดรายชื่อลูก…'}</h1><p class="muted" role="status">กรุณารอสักครู่</p></section>`;
    } else if (route === 'error') {
      main.innerHTML = `<section class="panel"><h1 tabindex="-1">ยังเปิดรายชื่อลูกไม่ได้</h1><p class="notice error" role="alert">${escapeHtml(s.loadError)}</p><button id="retry-children" class="button primary full">ลองใหม่</button></section>`;
      main.querySelector('#retry-children').addEventListener('click', controller.loadChildren);
    } else if (route === 'redeem') {
      doc.title = 'กรอกรหัสจากครูประจำชั้น — CRS ผู้ปกครอง';
      const locked = s.lockedUntil > Date.now();
      main.innerHTML = `<div class="steps" role="img" aria-label="ขั้นที่ 2 จาก 3"><span></span><span></span><span class="step-next"></span></div>
        <section class="screen-page redeem-screen"><h1 tabindex="-1">กรอกรหัสจากครูประจำชั้น</h1>
        <p class="muted redeem-intro">${s.children.length ? 'เพิ่มลูกอีกคนด้วยรหัสที่ได้รับจากครูประจำชั้น' : 'ขั้นที่ 2 จาก 3 · ใช้รหัสครั้งเดียว ก็เห็นข้อมูลลูกทุกวัน'}</p>
        <form id="invite-form"><div class="field invite-ticket"><label for="invite-code">รหัสเชิญ</label>
        <input id="invite-code" name="invite-code" type="text" inputmode="text" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" placeholder="ABCD-EF__" value="${escapeHtml(s.code)}" aria-describedby="invite-help invite-error" aria-invalid="${!!s.redeemError}" ${s.redeemBusy ? 'readonly' : ''}>
        <p id="invite-help" class="helper">8 ตัว เช่น ABCD-EF23 · วางจาก LINE ได้เลย</p><p id="invite-error" class="field-error" role="alert">${escapeHtml(s.redeemError)}</p></div>
        <p class="invite-tip">${icon('info')}<span>ยังไม่มีรหัส? ขอได้จากครูประจำชั้นของลูก รหัสใช้ได้ 7 วัน</span></p>
        <div class="actions"><button id="redeem-code" class="button primary full" ${s.redeemBusy || locked || inviteCharacters(s.code).length !== 8 ? 'disabled' : ''}>${s.redeemBusy ? 'กำลังตรวจรหัส…' : 'ยืนยันรหัส'}</button></div></form></section>`;
      const input = main.querySelector('#invite-code');
      input.addEventListener('input', event => {
        let value = input.value;
        let cursor = inviteCharacters(value.slice(0, input.selectionStart)).length;
        if (event.inputType === 'deleteContentBackward' && s.code.includes('-') && value === s.code.replace('-', '')) {
          value = value.slice(0, 3) + value.slice(4); cursor = 3;
        }
        s.code = formatInvite(value); input.value = s.code;
        const position = cursor + (cursor > 4 ? 1 : 0);
        input.setSelectionRange(position, position);
        main.querySelector('#redeem-code').disabled = s.redeemBusy || s.lockedUntil > Date.now() || inviteCharacters(s.code).length !== 8;
      });
      main.querySelector('#invite-form').addEventListener('submit', async event => {
        event.preventDefault();
        const ok = await controller.redeem();
        if (ok && state.session) {
          win.history.replaceState(null, '', '#home'); controller.notify();
        } else if (state.session && previousRoute === 'redeem') {
          main.querySelector('#invite-code')?.focus();
        }
      });
    } else if (route === 'home') {
      doc.title = 'หน้าแรก — CRS ผู้ปกครอง';
      const summary = homeSummary(filterChildren(s.children, selectedChildId), s.read);
      const feed = splitFeed(s.read.feed.rows, s.children, selectedChildId, s.read.today);
      main.innerHTML = `<section><header class="home-header"><div class="home-greeting"><div><p class="today-date">${escapeHtml(thaiToday())}</p><h1 tabindex="-1">${escapeHtml(guardianGreeting(s.children))}</h1></div>
        <a class="button bell-button" href="#notifications" aria-label="ดูแจ้งเตือน">${icon('bell')}</a></div></header>
        <div class="child-filters" role="group" aria-label="กรองตามลูก"><button id="child-filter-all" class="filter-chip" aria-pressed="${selectedChildId === null}">ทุกคน</button>
        ${s.children.map((child, index) => `<button id="child-filter-${index}" class="filter-chip" data-child-id="${escapeHtml(child.student_id)}" aria-label="ดูข้อมูลของ ${escapeHtml(child.name)}" aria-pressed="${String(child.student_id) === selectedChildId}">${escapeHtml(firstName(child.nickname || child.name) || 'ลูกของฉัน')}</button>`).join('')}</div>
        <div class="home-content"><div class="summary-grid"><div aria-busy="${summary.attendanceBusy}"><h2>มาเรียนวันนี้</h2><strong>${escapeHtml(summary.attendance)}</strong><p>${escapeHtml(summary.attendanceDetail)}</p></div><div aria-busy="${summary.savingsBusy}"><h2>เงินออมรวม</h2><strong>${escapeHtml(summary.savings)}</strong><p>ของลูกที่เลือก</p></div></div>
        <ul class="children" aria-label="ลูกที่ผูกกับบัญชี">${filterChildren(s.children, selectedChildId).map(child => childMarkup(child, s.children.indexOf(child))).join('')}</ul>
        ${summary.attendance === 'ยังแสดงข้อมูลไม่ได้' || summary.savings === 'ยังแสดงยอดไม่ได้' ? '<button class="button quiet retry-data">ลองโหลดข้อมูลใหม่</button>' : ''}
        <section class="activity-feed" aria-labelledby="today-title" aria-busy="${s.read.feed.loading}"><h2 id="today-title">วันนี้</h2><ol id="today-feed" class="feed-list">${feedMarkup(feed.today, s.children, s.read.today)}</ol>
        ${resourceMarkup(s.read.feed) || (!feed.today.length ? `<div class="feed-empty"><span class="empty-icon">${icon('activity')}</span><h3>ยังไม่มีความเคลื่อนไหว</h3><p>เมื่อครูเช็คชื่อหรือมีรายการชำระ จะขึ้นที่นี่</p></div>` : '')}
        <h2 id="earlier-title">ก่อนหน้านี้</h2><ol id="earlier-feed" class="feed-list" aria-labelledby="earlier-title">${feedMarkup(feed.earlier, s.children, s.read.today)}</ol>${!s.read.feed.loading && !s.read.feed.error && !feed.earlier.length ? '<p class="earlier-empty">ยังไม่มีความเคลื่อนไหวก่อนหน้านี้</p>' : ''}</section>
        <a class="button add-child full" href="#redeem"><span class="add-icon">${icon('plus')}</span>เพิ่มลูกอีกคน</a>${installBanner()}</div></section>`;
      main.querySelectorAll('.filter-chip').forEach(button => button.addEventListener('click', () => {
        selectedChildId = button.dataset.childId ?? null; controller.notify();
      }));
      main.querySelector('.child-filters').scrollLeft = returningHome ? homeFilterScroll : filterScroll;
      main.querySelector('#dismiss-install')?.addEventListener('click', () => {
        dismissed = true;
        try { win.localStorage.setItem(INSTALL_DISMISSED_KEY, '1'); } catch { /* In-memory still works. */ }
        controller.notify(); main.querySelector('a[href="#redeem"]')?.focus();
      });
      main.querySelector('#install-app')?.addEventListener('click', async () => {
        if (!deferredPrompt || installBusy) return;
        const prompt = deferredPrompt;
        installBusy = true; installError = ''; controller.notify();
        try { await prompt.prompt(); await prompt.userChoice; deferredPrompt = null; }
        catch { installError = 'ยังติดตั้งไม่สำเร็จ โปรดลองอีกครั้ง'; }
        finally { installBusy = false; controller.notify(); main.querySelector('a[href="#redeem"]')?.focus(); }
      });
    } else if (route === 'child') {
      let id = '';
      try { id = decodeURIComponent(win.location.hash.slice('#child/'.length)); } catch { /* Invalid URL is treated as unknown child. */ }
      const child = s.children.find(row => String(row.student_id) === id);
      const data = s.read.children[id];
      if (detailChildId !== id) { detailChildId = id; detailMonth = s.read.today.slice(0, 7); expandedSavings = false; }
      doc.title = `${child?.name || 'ไม่พบข้อมูลลูก'} — CRS ผู้ปกครอง`;
      if (!child) {
        main.innerHTML = '<section class="screen-page"><h1 tabindex="-1">ไม่พบข้อมูลลูก</h1><p class="muted">บัญชีนี้ยังไม่ได้ผูกกับนักเรียนที่ระบุ</p><a class="button secondary" href="#home">กลับหน้าแรก</a></section>';
      } else {
        main.innerHTML = `<section class="screen-page child-screen"><a class="button quiet detail-back" href="#home">${icon('back')}กลับหน้าแรก</a><h1 tabindex="-1">${escapeHtml(child.name)}</h1><p class="muted">${escapeHtml(classLabel(child))}</p>
          <section class="data-card" aria-busy="${!data || data.attendance.loading}"><h2>การมาเรียน</h2>${resourceMarkup(data?.attendance) || attendanceMarkup(data.attendance.rows, detailMonth, s.read.today, s.read.schoolDays)}</section>
          <section class="data-card" aria-busy="${!data || data.leaves.loading || !!s.cancelBusyId}"><h2 id="leave-heading" tabindex="-1">ใบลา</h2><a class="button primary full" href="#leave/${encodeURIComponent(id)}">ยื่นใบลา</a>${leaveListMarkup(data?.leaves, s.cancelBusyId)}<p class="field-error" role="alert">${escapeHtml(s.cancelError)}</p><button type="button" id="reload-leaves" class="button secondary">โหลดรายการใบลาอีกครั้ง</button></section>
          <section class="data-card" aria-busy="${!data || data.savings.loading || s.read.moneyLoading}"><h2>เงินออม</h2>${savingsMarkup(data?.savings, s.read.money, expandedSavings, s.read.moneyLoading)}</section>
          <section class="data-card" aria-busy="${!data || data.payments.loading}"><h2>ประวัติการชำระ</h2>${paymentsMarkup(data?.payments)}</section></section>`;
        main.querySelector('#reload-leaves').addEventListener('click', () => { void controller.loadLeaves(id); });
        main.querySelectorAll('.cancel-leave').forEach(button => button.addEventListener('click', async () => {
          const record = s.read.children[id];
          const accepted = await askLeaveConfirmation('ยกเลิกใบลา?', 'ใบลาที่ยกเลิกจะไม่ส่งให้ครูพิจารณาต่อ', 'ยกเลิกใบลา');
          if (accepted && state.read.children[id] === record) {
            await controller.cancelLeave(id, button.dataset.id);
            if (state.read.children[id] === record && win.location.hash === `#child/${encodeURIComponent(id)}`) main.querySelector('#leave-heading')?.focus();
          }
        }));
        main.querySelector('#previous-month')?.addEventListener('click', () => { detailMonth = monthShift(detailMonth, -1); controller.notify(); });
        main.querySelector('#next-month')?.addEventListener('click', () => { detailMonth = monthShift(detailMonth, 1); controller.notify(); });
        main.querySelector('#expand-savings')?.addEventListener('click', () => { expandedSavings = !expandedSavings; controller.notify(); });
      }
    } else if (route === 'leave') {
      let id = '';
      try { id = decodeURIComponent(win.location.hash.slice('#leave/'.length)); } catch { /* แสดงหน้าข้อมูลลูกไม่พบ */ }
      const child = s.children.find(row => String(row.student_id) === id);
      doc.title = 'ยื่นใบลา — CRS ผู้ปกครอง';
      if (!child) {
        main.innerHTML = '<section class="screen-page"><h1 tabindex="-1">ไม่พบข้อมูลลูก</h1><p class="muted">บัญชีนี้ยังไม่ได้ผูกกับนักเรียนที่ระบุ</p><a class="button secondary" href="#home">กลับหน้าแรก</a></section>';
      } else {
        if (!s.leaveDraft && s.leaveBusy) {
          // ส่งสำเร็จแล้ว กำลังโหลดรายการใหม่ รอเปลี่ยนกลับหน้าลูก
          main.innerHTML = '<section class="screen-page"><h1 tabindex="-1">ยื่นใบลา</h1><p role="status">ส่งใบลาแล้ว รอครูประจำชั้นอนุมัติ</p></section>';
          return;
        }
        controller.beginLeave(id);
        const draft = s.leaveDraft;
        main.innerHTML = `<section class="screen-page child-screen"><a class="button quiet detail-back" href="#child/${encodeURIComponent(id)}">${icon('back')}กลับหน้าลูก</a><h1 tabindex="-1">ยื่นใบลา</h1><p class="muted">${escapeHtml(child.name)}</p><div class="data-card">${leaveFormMarkup(draft, s.read.schoolDays, s.leaveBusy, s.leaveError)}</div></section>`;
        const form = main.querySelector('#leave-form');
        const update = event => {
          const field = event.target.name;
          if (!['leave_type', 'start_date', 'end_date', 'reason'].includes(field) || s.leaveBusy) return;
          draft[field] = event.target.value; draft.dirty = true;
          // ไม่วาด textarea ใหม่ระหว่างพิมพ์หรือประกอบอักษร เพื่อคงตำแหน่งเคอร์เซอร์
          if (field === 'reason') main.querySelector('#reason-count').textContent = `${Array.from(draft.reason).length}/500 ตัวอักษร`;
          else controller.notify();
        };
        form.addEventListener('input', update);
        form.addEventListener('focusout', event => {
          const field = event.target.name;
          if (!['leave_type', 'start_date', 'end_date', 'reason'].includes(field)) return;
          const validation = validateLeave(draft);
          if (validation[field]) draft.errors[field] = validation[field]; else delete draft.errors[field];
          if (!validation[field]) {
            form.querySelector(`#leave-errors li[data-field="${field}"]`)?.remove();
            if (!Object.keys(draft.errors).length) form.querySelector('#leave-errors')?.remove();
          }
          const target = form.querySelector(`#${field}-error`);
          target.textContent = draft.errors[field] || '';
          form.querySelectorAll(`[name="${field}"]`).forEach(input => input.setAttribute('aria-invalid', String(!!draft.errors[field])));
        });
        form.addEventListener('submit', async event => {
          event.preventDefault();
          const submittedDraft = draft, accountId = s.session.user.id, record = s.read.children[id];
          if (await controller.submitLeave()) {
            if (state.session?.user.id === accountId && state.read.children[id] === record && !state.leaveDraft?.dirty && win.location.hash === `#leave/${encodeURIComponent(id)}`) win.location.hash = `#child/${encodeURIComponent(id)}`;
          } else if (state.leaveDraft === submittedDraft) {
            (main.querySelector('#leave-errors') || main.querySelector('#leave-error'))?.focus();
          }
        });
        main.querySelector('#leave-error').tabIndex = -1;
        main.querySelectorAll('#leave-errors a').forEach(link => link.addEventListener('click', event => {
          event.preventDefault(); main.querySelector(link.getAttribute('href'))?.focus();
        }));
      }
    } else if (route === 'calendar') {
      doc.title = 'ปฏิทิน — CRS ผู้ปกครอง';
      main.innerHTML = `<section class="screen-page"><p class="eyebrow">CRS ผู้ปกครอง</p><h1 tabindex="-1">ปฏิทิน</h1><div aria-busy="${s.read.calendar.loading}">${calendarMarkup(s.read.calendar)}</div></section>`;
    } else if (route === 'notifications') {
      const title = 'แจ้งเตือน';
      doc.title = `${title} — CRS ผู้ปกครอง`;
      main.innerHTML = `<section class="screen-page"><p class="eyebrow">CRS ผู้ปกครอง</p><h1 tabindex="-1">${title}</h1>
        <div class="empty-page"><span class="empty-icon">${icon('bell')}</span><h2>แจ้งเตือนจะเปิดให้ดูเร็ว ๆ นี้</h2><p>เมื่อลูกขาดเรียน มีผลใบลา หรือมีใบแจ้งหนี้ จะแสดงที่นี่</p></div></section>`;
    } else if (route === 'account') {
      doc.title = 'บัญชี — CRS ผู้ปกครอง';
      main.innerHTML = `<section class="screen-page account-screen"><p class="eyebrow">CRS ผู้ปกครอง</p><h1 tabindex="-1">บัญชี</h1>
        <div class="account-card"><span class="account-avatar">${icon('account')}</span><div><h2>บัญชีที่ใช้อยู่</h2><p class="account-email">${escapeHtml(s.session.user.email || 'ไม่พบอีเมลของบัญชี')}</p></div></div>
        <h2 class="section-title">ลูกที่ผูกกับบัญชี</h2><ul class="linked-children">${s.children.map((child, index) => `<li><span class="avatar tone-${childTone(index)}" aria-hidden="true">${escapeHtml(childInitials(child.name))}</span><div><strong>${escapeHtml(child.name)}</strong><p>คุณเป็น ${escapeHtml(child.relation)}</p></div></li>`).join('')}</ul>
        <a class="privacy-link" href="./privacy.html">นโยบายความเป็นส่วนตัว</a>
        <div class="signout-section"><button id="sign-out" class="button signout full" ${s.signoutBusy ? 'disabled' : ''}>${s.signoutBusy ? 'กำลังออก…' : 'ออกจากระบบ'}</button></div></section>`;
      main.querySelector('#sign-out').addEventListener('click', controller.signOut);
    }
    main.querySelectorAll('.retry-data').forEach(button => button.addEventListener('click', () => { void controller.loadData(); }));
    main.querySelectorAll('details').forEach((detail, index) => { detail.open = openDetails[index] || false; });
    if (focusRoute) {
      main.querySelector('h1')?.focus();
      win.scrollTo(0, returningHome ? homeScroll : 0);
    }
    else if (activeId || activeHeading || activeHref) {
      const target = activeId ? doc.getElementById(activeId) : activeHeading ? main.querySelector('h1')
        : [...doc.querySelectorAll('a')].find(link => link.getAttribute('href') === activeHref);
      if (target && !target.disabled) {
        target.focus({ preventScroll: true });
        if (selection) target.setSelectionRange(...selection);
      } else if (activeId === 'previous-month' || activeId === 'next-month') {
        main.querySelector('.month-controls h3')?.focus({ preventScroll: true });
      }
    }
  }
  const onHash = () => { if (win.location.hash !== '#main') controller.notify(); };
  const skipLink = doc.querySelector('.skip-link');
  const onSkip = event => { event.preventDefault(); main.focus(); };
  const onPrompt = event => { event.preventDefault(); deferredPrompt = event; controller.notify(); };
  const onInstalled = () => { deferredPrompt = null; dismissed = true; controller.notify(); };
  const onStandalone = () => controller.notify();
  const navResize = new win.ResizeObserver(() => {
    doc.documentElement.style.setProperty('--bottom-nav-height', `${nav.hidden ? 0 : nav.getBoundingClientRect().height}px`);
  });
  navResize.observe(nav);
  skipLink?.addEventListener('click', onSkip);
  win.addEventListener('hashchange', onHash);
  win.addEventListener('beforeinstallprompt', onPrompt);
  win.addEventListener('appinstalled', onInstalled);
  standaloneQuery.addEventListener('change', onStandalone);
  // Refresh on return from bfcache; don't show an old account's rendered data.
  const onPageShow = event => { if (event.persisted) win.location.reload(); };
  const onPageHide = () => {
    closeDialog?.(false);
    controller.stop();
    selectedChildId = null; filterAccountId = null;
    main.replaceChildren(); account.replaceChildren(); nav.replaceChildren(); nav.hidden = true; success.textContent = ''; success.hidden = true;
  };
  win.addEventListener('pageshow', onPageShow);
  win.addEventListener('pagehide', onPageHide);
  const stopResumeRefresh = registerResumeRefresh(controller, win, doc, updates);
  const error = oauthErrorFromUrl(win.location.href);
  // Read errors before removing callback parameters; never persist callback URLs in history.
  awaitStart();
  async function awaitStart() {
    await controller.start();
    const clean = new URL(win.location.href);
    for (const key of ['code', 'error', 'error_description', 'error_code']) clean.searchParams.delete(key);
    if (clean.hash.includes('error=') || clean.hash.includes('error_description=')) clean.hash = '#login';
    win.history.replaceState(null, '', clean.pathname + clean.search + clean.hash);
    if (error && !state.session) { state.loginError = authErrorMessage(error); controller.notify(); }
  }
  return { controller, destroy() {
    stopResumeRefresh();
    closeDialog?.(false);
    controller.stop(); win.removeEventListener('hashchange', onHash);
    win.removeEventListener('beforeinstallprompt', onPrompt); win.removeEventListener('appinstalled', onInstalled);
    win.removeEventListener('pageshow', onPageShow); win.removeEventListener('pagehide', onPageHide);
    standaloneQuery.removeEventListener('change', onStandalone);
    skipLink?.removeEventListener('click', onSkip);
    navResize.disconnect(); doc.documentElement.classList.remove('has-bottom-nav');
    main.replaceChildren(); account.replaceChildren(); nav.replaceChildren(); nav.hidden = true; success.textContent = '';
  } };
}

export function showEmbeddedBrowser(win = window, doc = document) {
  const result = embeddedBrowser(win.navigator.userAgent, win.location.href);
  if (!result.blocked) return false;
  if (result.redirect) win.location.replace(result.redirect);
  const main = doc.getElementById('main');
  const link = win.location.origin + win.location.pathname;
  main.setAttribute('aria-busy', 'false');
  main.innerHTML = `<section class="panel"><h1 tabindex="-1">เปิดในเบราว์เซอร์เพื่อเข้าสู่ระบบ</h1>
    <p>กดเมนู ⋯ แล้วเลือกเปิดในเบราว์เซอร์ เช่น Safari หรือ Chrome จากนั้นเข้าสู่ระบบด้วย Google</p>
    <button id="copy-link" class="button primary full">คัดลอกลิงก์</button>
    <p id="copy-status" class="helper" role="status"></p><div id="copy-fallback" class="field" hidden><label for="app-link">แตะค้างเพื่อคัดลอกลิงก์นี้</label><input id="app-link" type="url" readonly value="${escapeHtml(link)}"></div></section>`;
  main.querySelector('h1').focus();
  main.querySelector('#copy-link').addEventListener('click', async () => {
    try {
      await win.navigator.clipboard.writeText(link);
      main.querySelector('#copy-status').textContent = 'คัดลอกลิงก์แล้ว นำไปเปิดใน Safari หรือ Chrome';
    } catch {
      main.querySelector('#copy-status').textContent = 'คัดลอกอัตโนมัติไม่ได้ แตะค้างที่ลิงก์ด้านล่างเพื่อคัดลอก';
      main.querySelector('#copy-fallback').hidden = false;
      const input = main.querySelector('#app-link'); input.focus(); input.select();
    }
  });
  return true;
}

// ตรวจรุ่นใหม่เมื่อกลับมาใช้แอป และเก็บสถานะรอ reload ไว้เฉพาะในหน่วยความจำ
export function registerAppServiceWorker(win = window, doc = document) {
  if (!('serviceWorker' in win.navigator)) return { setStateReader() {}, isReloadPending: () => false, stop() {}, ready: Promise.resolve(null) };
  const sw = win.navigator.serviceWorker;
  let registration, readState = () => null;
  let pendingReload = false, reloadStarted = false, submitted = false, stopped = false, focusTimer;
  function maybeReload() {
    if (stopped || !pendingReload || reloadStarted) return;
    const state = readState();
    if (state?.redeemBusy) submitted = true;
    // รอทั้งการส่งรหัสและการเปิด session เริ่มต้น เพื่อไม่ขัดจังหวะ OAuth callback
    if (state?.redeemBusy || state?.loginBusy || state?.signoutBusy || state?.leaveBusy || state?.cancelBusyId ||
        (state?.leaveDraft?.dirty && doc.getElementById('leave-form')) ||
        doc.getElementById('main')?.getAttribute('aria-busy') === 'true') return;
    const input = doc.getElementById('invite-code');
    if (!submitted && input && (input.value.trim() || doc.activeElement === input)) return;
    reloadStarted = true;
    pendingReload = false;
    win.location.reload();
  }
  const onControllerChange = () => {
    if (!sw.controller) return;
    pendingReload = true;
    maybeReload();
  };
  const onVisible = () => {
    if (doc.visibilityState !== 'visible') return;
    registration?.update().catch(() => {}); // ออฟไลน์ยังใช้งาน shell เดิมได้
    maybeReload();
  };
  const onSubmit = event => {
    if (pendingReload && event.target.id === 'invite-form' && readState()?.redeemBusy) submitted = true;
    maybeReload();
  };
  const onFocusOut = () => {
    win.clearTimeout(focusTimer);
    focusTimer = win.setTimeout(maybeReload, 0);
  };
  const observer = new win.MutationObserver(maybeReload);
  observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-busy'] });
  sw.addEventListener('controllerchange', onControllerChange);
  doc.addEventListener('visibilitychange', onVisible);
  doc.addEventListener('submit', onSubmit);
  doc.addEventListener('input', maybeReload);
  doc.addEventListener('focusout', onFocusOut);
  function stop() {
    stopped = true;
    observer.disconnect();
    win.clearTimeout(focusTimer);
    sw.removeEventListener('controllerchange', onControllerChange);
    doc.removeEventListener('visibilitychange', onVisible);
    doc.removeEventListener('submit', onSubmit);
    doc.removeEventListener('input', maybeReload);
    doc.removeEventListener('focusout', onFocusOut);
    win.removeEventListener('pagehide', stop);
  }
  win.addEventListener('pagehide', stop);
  const ready = sw.register('./sw.js', { updateViaCache: 'none' }).then(value => {
    registration = value;
    return value;
  }).catch(() => null);
  return { ready, stop, isReloadPending: () => pendingReload || reloadStarted,
    setStateReader(reader) { readState = reader; maybeReload(); } };
}

export async function start() {
  if (showEmbeddedBrowser()) return;
  // Capture the one-shot install event even if the CDN takes time to load.
  let initialPrompt = null;
  const capturePrompt = event => { event.preventDefault(); initialPrompt = event; };
  window.addEventListener('beforeinstallprompt', capturePrompt);
  // The shell remains available offline. Auth/CDN errors have a visible retry path.
  const updates = registerAppServiceWorker();
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    window.removeEventListener('beforeinstallprompt', capturePrompt);
    const app = mountParentApp(createClient(SUPABASE_URL, SUPABASE_ANON_KEY, CLIENT_OPTIONS), window, document, initialPrompt, updates);
    updates.setStateReader(() => app.controller.state);
  } catch {
    window.removeEventListener('beforeinstallprompt', capturePrompt);
    const main = document.getElementById('main');
    main.setAttribute('aria-busy', 'false');
    main.innerHTML = '<section class="panel"><h1 tabindex="-1">ยังเปิดแอปไม่ได้</h1><p class="notice error" role="alert">ตรวจอินเทอร์เน็ตแล้วกดลองใหม่ เพื่อเข้าสู่ระบบและโหลดข้อมูลล่าสุด</p><button id="retry-app" class="button primary full">ลองใหม่</button></section>';
    main.querySelector('#retry-app').addEventListener('click', () => location.reload());
    main.querySelector('h1').focus();
  }
}
