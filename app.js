export const SUPABASE_URL = 'https://cbfblvsasamxuwgcpmtj.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_EEGLPPMa3fIX1aRR6GA3Xw_mF4mh5X0';
export const CLIENT_OPTIONS = { auth: {
  storageKey: 'crs-parent-auth', flowType: 'pkce', detectSessionInUrl: true, persistSession: true,
} };
export const INSTALL_DISMISSED_KEY = 'crs-parent-install-dismissed';
export const MONEY_MODULE_URL = 'https://nonpatan.github.io/CRS_Score/shared/money.js?v=20261121-2';
export const GRADES_MODULE_URL = 'https://nonpatan.github.io/CRS_Score/shared/grades.js?v=20261121-1';
export const REPORT_MODULE_URL = 'https://nonpatan.github.io/CRS_Score/shared/report-card.js?v=20261121-2';

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

const childSections = {
  attendance: 'การมาเรียน',
  grades: 'ผลการเรียน',
  development: 'กิจกรรม · คุณลักษณะ',
  timetable: 'ตารางเรียน',
  money: 'เงินออม · การชำระ',
  profile: 'ข้อมูลประจำตัว',
  transport: 'รถรับส่ง',
};

function childLocation(hash) {
  const [, encoded, section = ''] = hash.split('/');
  let id = '';
  try { id = decodeURIComponent(encoded || ''); } catch { /* Invalid child link. */ }
  return { id, section };
}
function childHref(id) { return `#child/${encodeURIComponent(id)}`; }

export function routeFor({ session, loaded, loading, loadError, children }, hash) {
  if (!session) return 'login';
  if (loading || (!loaded && !loadError)) return 'loading';
  if (loadError) return 'error';
  if (!children.length) return 'redeem';
  if (/^#child\/[^/]+$/.test(hash)) return 'child';
  if (/^#child\/[^/]+\/[^/]+$/.test(hash)) {
    const { id, section } = childLocation(hash);
    if (section === 'development' && !hasAcademicReports(children.find(child => String(child.student_id) === id))) return 'childMissing';
    if (Object.hasOwn(childSections, section)) return 'childSection';
  }
  if (hash.startsWith('#child/')) return 'childMissing';
  if (/^#leave\/[^/]+$/.test(hash)) return 'leave';
  return ['#redeem', '#calendar', '#account'].includes(hash) ? hash.slice(1) : 'home';
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
    ${row.status === 'รออนุมัติ' ? `<button type="button" class="button danger cancel-leave" id="cancel-${escapeHtml(row.id)}" data-id="${escapeHtml(row.id)}" ${busyId ? 'disabled' : ''}>${busyId === row.id ? `${busyIcon()}กำลังยกเลิก…` : 'ยกเลิกใบลา'}</button>` : ''}</li>`).join('')}</ul>`;
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
    <button id="submit-leave" class="button primary full" ${busy ? 'disabled' : ''}>${busy ? `${busyIcon()}กำลังส่ง…` : 'ส่งใบลา'}</button>
    <p id="leave-error" class="field-error" role="alert">${escapeHtml(error)}</p>
    <p class="helper">ถ้าเร่งด่วน โทรแจ้งครูประจำชั้นได้ตามเดิม</p></form>`;
}
export function schoolDaysMetadata(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.holidays) ||
      (data.year_start != null && !validSchoolDate(data.year_start)) ||
      (data.year_end != null && !validSchoolDate(data.year_end)) ||
      (data.year_start && data.year_end && data.year_end < data.year_start)) return null;
  return { year: data.year, year_start: data.year_start || null, year_end: data.year_end || null,
    term1_end: validSchoolDate(data.term1_end) ? data.term1_end : null,
    term2_start: validSchoolDate(data.term2_start) ? data.term2_start : null,
    term2_end: validSchoolDate(data.term2_end) ? data.term2_end : null,
    holidays: data.holidays.filter(row => validSchoolDate(row?.date)).map(row => ({
      date: row.date, name: typeof row.name === 'string' ? row.name.trim() : '',
    })) };
}
export function schoolYearAttendance(rows, schoolDays) {
  return rows.filter(row => (!schoolDays?.year_start || row.attend_date >= schoolDays.year_start) &&
    (!schoolDays?.year_end || row.attend_date <= schoolDays.year_end));
}

export function attendanceTerms(schoolDays, today) {
  const { year, year_start: start, term1_end: firstEnd, term2_start: secondStart } = schoolDays || {};
  if (!year || !start || !firstEnd || !secondStart || today < start || firstEnd < start || secondStart <= firstEnd) return [];
  const terms = [{ year, term: '1', start, end: firstEnd }];
  if (today >= secondStart) terms.push({ year, term: '2', start: secondStart,
    end: schoolDays.term2_end || schoolDays.year_end || today });
  return terms;
}

function selectedAttendanceTerm(terms, data) {
  return terms.find(term => academicTermKey(term) === data?.selected) || terms.at(-1);
}

const subjectAttendanceError = 'ยังแสดงเวลาเรียนรายวิชาไม่ได้ ลองใหม่';
const attendanceRiskOrder = { retake: 0, critical: 1, warn: 2 };

function subjectAttendanceResults(data, studentId, module) {
  const { MS_WARN_PERCENT_SECONDARY, MS_MAKEUP_RATIO, MS_RETAKE_RATIO, computeAttendanceRisk } = module;
  if (typeof computeAttendanceRisk !== 'function' ||
      ![MS_WARN_PERCENT_SECONDARY, MS_MAKEUP_RATIO, MS_RETAKE_RATIO].every(value => Number.isFinite(value) && value > 0)) {
    throw Error('Invalid attendance module');
  }
  const subjects = data.subjects.map(({ id, code, name, total_periods }) => {
    const sessions = data.sessions.filter(row => row.subject_id === id).map(({ periods_covered, status }) => ({
      periods_covered, attendance_records: status ? [{ student_id: studentId, status }] : [],
    }));
    const makeupHours = data.makeup.filter(row => row.subject_id === id).map(({ periods }) => ({ student_id: studentId, periods }));
    const risk = computeAttendanceRisk(studentId, [{ subject: { total_periods }, sessions, makeupHours }], {});
    const empty = !(Number(total_periods) > 0) ? 'ยังไม่ได้ตั้งจำนวนคาบ' : !sessions.length ? 'ยังไม่มีการเช็คชื่อ' : '';
    return { code, name, totalPeriods: total_periods, empty, level: empty ? null : risk.level,
      percent: risk.percent, rawMissed: risk.rawMissed, netMissed: risk.netMissed, makeupTotal: risk.makeupTotal };
  });
  subjects.sort((a, b) => (attendanceRiskOrder[a.level] ?? 3) - (attendanceRiskOrder[b.level] ?? 3) ||
    String(a.code ?? '').localeCompare(String(b.code ?? ''), 'th'));
  return { subjects, warn: MS_WARN_PERCENT_SECONDARY, makeup: MS_MAKEUP_RATIO * 100, retake: MS_RETAKE_RATIO * 100 };
}

// The same reset points as the session controller invalidate every S3 request.
// No data, module response, or derived amount is written to persistent storage.
export function createReadController(sb, { changed = () => {}, leavesChanged = () => {}, now = () => new Date(),
  loadMoney = () => import(MONEY_MODULE_URL), loadGrades = () => import(GRADES_MODULE_URL),
  loadReport = () => import(REPORT_MODULE_URL) } = {}) {
  const state = { children: {}, feed: resource(), calendar: resource(), schoolDays: null,
    money: null, moneyLoading: false, today: bangkokDate(now()), loading: false, loadedAt: {} };
  let version = 0, moneyPending, schoolDaysPending, schoolDaysThrough = '';
  const revisions = new WeakMap();
  const termRequests = new WeakMap();
  function sharedMoney() {
    moneyPending ??= Promise.resolve().then(loadMoney).finally(() => { moneyPending = undefined; });
    return moneyPending;
  }
  function reset() {
    version++;
    state.children = {}; state.feed = resource(); state.calendar = resource();
    state.money = null; state.moneyLoading = false;
    state.schoolDays = null; schoolDaysPending = undefined; schoolDaysThrough = '';
    state.loading = false; state.loadedAt = {};
  }
  async function load(children, { quiet = false, page = 'all', studentId = '', section = '' } = {}) {
    const knownYearStart = state.schoolDays?.year_start;
    if (!quiet) reset();
    const ownVersion = version;
    const notices = [];
    state.today = bangkokDate(now()); state.loading = true;
    if (!quiet) {
      state.moneyLoading = true;
      for (const child of children) state.children[child.student_id] = { attendance: resource(), savings: resource(), payments: resource(), leaves: resource(),
        profile: { ...resource(), started: false, refreshing: false },
        timetable: { loading: true, pending: false, date: '', error: '', result: undefined },
        transport: { loading: true, pending: false, error: '', result: undefined },
        feeNotices: { loading: true, pending: false, error: '', result: undefined },
        attendanceView: { secondary: isSecondary(child), selected: '', entries: new Map() },
        grades: hasAcademicReports(child) ? { primary: isPrimary(child), started: false, terms: resource(),
          selected: '', entries: new Map() } : null,
        development: hasAcademicReports(child) ? { primary: isPrimary(child), terms: resource(), selected: '',
          currentKey: '', entries: new Map() } : null };
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
    const attendance = page !== 'calendar' && (!section || section === 'attendance');
    const timetable = page === 'child' && (!section || section === 'timetable');
    const finance = page !== 'calendar' && (!section || section === 'money');
    const money = finance && (!quiet || !state.money) ? (async () => {
      try {
        const module = await sharedMoney();
        if (version === ownVersion && typeof module.computeSavingsBalance === 'function') state.money = module.computeSavingsBalance;
      } catch { /* Keep raw transactions visible; never substitute a local formula. */ }
      finally { if (version === ownVersion) { state.moneyLoading = false; changed(); } }
    })() : Promise.resolve();
    const schoolDays = attendance || timetable ? (async () => {
      const to = shiftDate(state.today, 120);
      // A known start is useful on refresh, provided the RPC's 400-day cap allows it.
      const from = knownYearStart && knownYearStart >= shiftDate(to, -400) && knownYearStart <= to
        ? knownYearStart : shiftDate(state.today, -40);
      try {
        const { data, error } = await sb.rpc('parent_school_days', { p_from: from, p_to: to });
        if (version !== ownVersion) return null;
        if (!error) {
          const metadata = schoolDaysMetadata(data);
          if (metadata || !quiet) {
            state.schoolDays = metadata;
            schoolDaysThrough = metadata ? to : '';
          }
        }
      } catch { /* Optional metadata: keep the original attendance behaviour on failure. */ }
      if (version === ownVersion) { changed(); return state.schoolDays; }
      return null;
    })() : Promise.resolve(state.schoolDays);
    if (attendance || timetable) schoolDaysPending = schoolDays;
    const jobs = [money, schoolDays];
    if (page === 'all' || page === 'home') jobs.push(fetchRows(state.feed, 'parent_feed', { p_days: 14 }));
    if (page === 'all' || page === 'calendar') jobs.push(fetchRows(state.calendar, 'public_calendar', { p_from: shiftDate(state.today, -7), p_to: shiftDate(state.today, 120) }));
    for (const child of children) {
      if (page === 'calendar' || (page === 'child' && String(child.student_id) !== studentId)) continue;
      const target = state.children[child.student_id], args = { p_student_id: child.student_id };
      if (attendance) jobs.push(schoolDays.then(metadata => {
        if (version !== ownVersion) return;
        return fetchRows(target.attendance, 'child_attendance', { ...args,
          p_from: metadata?.year_start || shiftDate(state.today, -400), p_to: state.today },
        rows => schoolYearAttendance(rows, metadata));
      }), fetchRows(target.leaves, 'my_leave_requests', args));
      if (finance) jobs.push(fetchRows(target.savings, 'child_savings', args));
      if (finance && page !== 'home') jobs.push(fetchRows(target.payments, 'child_payments', { ...args, p_limit: 50 }));
      if (quiet && page === 'child') {
        if (timetable) jobs.push(loadTimetable(child.student_id, { quiet: true }));
        if (!section || section === 'transport') jobs.push(loadTransport(child.student_id, { quiet: true }));
        if (finance) jobs.push(loadFeeNotices(child.student_id, { quiet: true }));
        const refreshGrades = target.grades?.started && (!section || section === 'grades');
        if (refreshGrades) {
          jobs.push(loadGradeTerms(child.student_id, { force: true }));
        }
        if (!section || section === 'development') jobs.push(loadDevelopment(child.student_id, {
          summary: !section, quiet: true, refreshTerms: !refreshGrades,
        }));
        if (!section || section === 'profile') jobs.push(loadProfile(child.student_id, { quiet: true }));
        if (attendance && target.attendanceView.secondary) jobs.push(schoolDays.then(() => {
          if (version === ownVersion) return loadSubjectAttendance(child.student_id, { quiet: true, summary: !section });
        }));
      }
    }
    await Promise.allSettled(jobs);
    if (version !== ownVersion) return;
    const scopes = page === 'all' ? ['home', 'calendar', ...children.flatMap(({ student_id: id }) =>
      [`child/${id}`, `child/${id}/attendance`, `child/${id}/money`])]
      : [page === 'child' ? `child/${studentId}${section ? `/${section}` : ''}` : page];
    for (const scope of scopes) state.loadedAt[scope] = now().getTime();
    state.loading = false;
    if (notices.length) leavesChanged(notices);
    changed();
  }
  async function loadSubjectAttendance(studentId, { quiet = false, summary = false, force = false, key } = {}) {
    const target = state.children[studentId]?.attendanceView;
    if (!target) return;
    const terms = attendanceTerms(state.schoolDays, state.today);
    if (key !== undefined) {
      if (!terms.some(term => academicTermKey(term) === key)) return;
      target.selected = key;
    }
    if (!target.secondary) {
      if (key !== undefined) changed();
      return;
    }
    const term = summary ? terms.at(-1) : selectedAttendanceTerm(terms, target);
    if (!term) return;
    const termKey = academicTermKey(term), previous = target.entries.get(termKey);
    if (previous?.loading || previous?.refreshing || (previous && !quiet && !force)) {
      if (key !== undefined) changed();
      return;
    }
    const retain = quiet && !!previous?.result;
    const entry = { loading: !retain, refreshing: retain, error: '', result: retain ? previous.result : null };
    target.entries.set(termKey, entry);
    const ownVersion = version;
    const current = () => version === ownVersion && target.entries.get(termKey) === entry;
    if (!retain) changed();
    try {
      const { data, error } = await sb.rpc('child_subject_attendance', {
        p_student_id: studentId, p_year: term.year, p_term: term.term,
      });
      if (!current()) return;
      if (!error && data === null) entry.result = null;
      if (error || !data || academicTermKey(data) !== termKey ||
          ![data.subjects, data.sessions, data.makeup].every(Array.isArray)) throw Error('Invalid subject attendance');
      if (!data.subjects.length) { entry.result = { subjects: [] }; return; }
      const module = await loadGrades();
      if (current()) entry.result = subjectAttendanceResults(data, studentId, module);
    } catch {
      if (current() && !entry.result) entry.error = subjectAttendanceError;
    } finally {
      if (current()) { entry.loading = false; entry.refreshing = false; changed(); }
    }
  }
  async function loadProfile(studentId, { force = false, quiet = false } = {}) {
    const profile = state.children[studentId]?.profile;
    if (!profile || (quiet && (!profile.started || profile.loading || profile.refreshing)) ||
        (!quiet && profile.started && (profile.loading || !force))) return;
    const ownVersion = version, revision = (revisions.get(profile) || 0) + 1;
    revisions.set(profile, revision);
    const current = () => version === ownVersion && revisions.get(profile) === revision;
    profile.started = true;
    profile.refreshing = quiet;
    if (!quiet) { profile.loading = true; profile.error = ''; changed(); }
    try {
      const { data, error } = await sb.rpc('child_profile', { p_student_id: studentId });
      if (!current()) return;
      if (error || !Array.isArray(data) || data.length > 1 ||
          (data.length === 1 && (!data[0] || typeof data[0] !== 'object' || Array.isArray(data[0])))) throw Error('Invalid profile');
      profile.rows = data;
      profile.error = data.length ? '' : 'ไม่พบข้อมูลประจำตัวของนักเรียนคนนี้ ลองใหม่อีกครั้ง';
    } catch {
      if (current() && !quiet) profile.error = 'โหลดข้อมูลประจำตัวไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
    } finally {
      if (current()) {
        profile.loading = false; profile.refreshing = false;
        state.loadedAt[`child/${studentId}/profile`] = now().getTime();
        changed();
      }
    }
  }
  async function loadTransport(studentId, { force = false, quiet = false } = {}) {
    const target = state.children[studentId]?.transport;
    if (!target || target.pending || (!target.loading && !quiet && !force)) return;
    const ownVersion = version;
    target.pending = true;
    if (!quiet) { target.loading = true; target.error = ''; changed(); }
    try {
      const { data, error } = await sb.rpc('child_transport', { p_student_id: studentId });
      if (version !== ownVersion) return;
      if (error) throw error;
      if (data === null) {
        target.result = null;
      } else {
        if (![data?.periods, data?.attendance, data?.overrides, data?.month_rates, data?.payments].every(Array.isArray)) {
          throw Error('Invalid transport data');
        }
        const { periods, attendance, overrides, month_rates: monthRates, opening_debt: openingDebt, payments, from, to } = data;
        if (!periods.length && !(Number(openingDebt) > 0) && !payments.length) {
          target.result = { periods };
        } else {
          if (!validSchoolDate(from) || !validSchoolDate(to) || from > to) throw Error('Invalid transport dates');
          const { computeTransportCharges, computeTransportOutstanding } = await sharedMoney();
          if (version !== ownVersion) return;
          const charges = computeTransportCharges({ periods, attendance, overrides, monthRates, openingDebt, from, to });
          const outstanding = computeTransportOutstanding(charges, payments);
          if (!Number.isFinite(outstanding)) throw Error('Invalid outstanding transport balance');
          target.result = transportSummary(periods, charges, outstanding, payments, to);
        }
      }
      target.error = '';
    } catch {
      if (version === ownVersion && (!quiet || target.result === undefined)) target.error = transportError;
    } finally {
      if (version === ownVersion) {
        state.loadedAt[`child/${studentId}/transport`] = now().getTime();
        target.loading = false; target.pending = false; changed();
      }
    }
  }
  async function loadFeeNotices(studentId, { force = false, quiet = false } = {}) {
    const target = state.children[studentId]?.feeNotices;
    if (!target || target.pending || (!target.loading && !quiet && !force)) return;
    const ownVersion = version;
    target.pending = true;
    let received = false;
    if (!quiet) { target.loading = true; target.error = ''; changed(); }
    try {
      const { data, error } = await sb.rpc('child_fee_notices', { p_student_id: studentId });
      if (version !== ownVersion) return;
      if (error) throw error;
      if (data !== null && !Array.isArray(data?.notices)) throw Error('Invalid fee notices');
      received = true;
      const notices = data?.notices ?? [];
      if (notices.length) {
        const module = await sharedMoney();
        if (version !== ownVersion) return;
        target.result = sortAcademicTerms(notices.map(notice => invoiceSummary(data, notice, module)));
      } else {
        target.result = [];
      }
      target.error = '';
    } catch {
      if (version === ownVersion) {
        // ผลอ่านล่าสุดอาจถอนประกาศเดิมแล้ว ล้างยอดเก่าถ้าคำนวณใบแจ้งชุดใหม่ไม่ได้
        if (received) target.result = undefined;
        if (!quiet || target.result === undefined) target.error = feeNoticeError;
      }
    } finally {
      if (version === ownVersion) {
        target.loading = false; target.pending = false; changed();
      }
    }
  }
  async function loadTimetable(studentId, { force = false, quiet = false } = {}) {
    const target = state.children[studentId]?.timetable, date = bangkokDate(now());
    if (!target || target.pending || (!force && !quiet && target.date === date)) return;
    const ownVersion = version, holidaysPending = schoolDaysPending;
    const current = () => version === ownVersion;
    target.date = date;
    target.pending = true;
    if (!quiet) { target.loading = target.result === undefined; target.error = ''; changed(); }

    async function fetchTimetable(day) {
      const { data, error } = await sb.rpc('child_timetable', { p_student_id: studentId, p_date: day });
      if (error) throw error;
      return prepareTimetable(data);
    }
    async function timetableHolidays(model, from, through, metadata) {
      const fallback = new Set(metadata?.holidays.map(day => day.date));
      if (model.end_date <= through || nextTeachingDate(model, shiftDate(from, 1), {
        holidays: fallback, through, withLesson: true,
      })) return fallback;
      try {
        const { data, error } = await sb.rpc('parent_school_days', {
          p_from: from, p_to: model.end_date < shiftDate(from, 400) ? model.end_date : shiftDate(from, 400),
        });
        const calendar = !error && schoolDaysMetadata(data);
        if (calendar) return new Set(calendar.holidays.map(day => day.date));
      } catch { /* The weekly schedule is still available if the holiday lookup fails. */ }
      return fallback;
    }
    try {
      const [result, metadata] = await Promise.all([fetchTimetable(date), holidaysPending]);
      if (!current()) return;
      let next = null;
      if (result?.hasPlacements) {
        const from = result.start_date > date ? result.start_date : date;
        const through = schoolDaysThrough || shiftDate(date, 120);
        result.holidays = await timetableHolidays(result, from, through, metadata);
        if (!current()) return;
        // At the end of a published timetable, look for the next published one.
        if (from === date && result.end_date < shiftDate(date, 400) &&
            !nextTeachingDate(result, shiftDate(date, 1), { withLesson: true }) &&
            [...result.days.values()].some(rows => rows.some(hasTeachingLesson))) {
          try {
            next = await fetchTimetable(shiftDate(result.end_date, 1));
            if (!current()) return;
            if (next?.hasPlacements) next.holidays = await timetableHolidays(next, next.start_date, through, metadata);
          } catch { next = null; }
        }
      }
      if (!current()) return;
      target.result = result;
      target.next = next;
      target.error = '';
    } catch {
      if (current() && (!quiet || target.result === undefined)) target.error = timetableError;
    } finally {
      if (current()) {
        target.loading = false; target.pending = false;
        state.loadedAt[`child/${studentId}/timetable`] = now().getTime();
        changed();
      }
    }
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
  async function selectGradeTerm(studentId, key) {
    const grades = state.children[studentId]?.grades;
    const term = grades?.terms.rows.find(row => academicTermKey(row) === key);
    if (!term) return;
    grades.selected = key;
    // คงชิปและโฟกัสระหว่างรีเฟรช แล้วโหลดภาคล่าสุดที่ผู้ใช้เลือก
    if (grades.terms.loading || grades.entries.has(key)) { changed(); return; }
    return loadGradeEntry(studentId, grades, term);
  }
  async function loadGradeEntry(studentId, grades, term) {
    const key = academicTermKey(term);
    const entry = { loading: true, error: '', released: false, release_date: term.release_date };
    grades.entries.set(key, entry);
    const ownVersion = version;
    const current = () => version === ownVersion && grades.entries.get(key) === entry;
    changed();
    try {
      // ภาคที่ยังไม่ประกาศไม่ขอคะแนนและไม่โหลดโมดูลคำนวณ
      if (term.released !== true) return;
      const { data, error } = await sb.rpc('child_grade_data', {
        p_student_id: studentId, p_year: term.year, p_term: term.term,
      });
      if (!current()) return;
      if (error || !data || typeof data.released !== 'boolean') throw Error('Invalid grades');
      if (!data.released) { entry.release_date = data.release_date; return; }
      if (String(data.student_id) !== String(studentId)) throw Error('Invalid student');
      if (grades.primary && academicTermKey(data) !== key) throw Error('Invalid grade term');
      const module = await loadGrades();
      if (!current()) return;
      const input = module.fromGradeRpc(data);
      if (!input) throw Error('Invalid grade payload');
      const subjects = module.assembleStudentResults(input).get(data.student_id)?.subjects;
      if (!Array.isArray(subjects)) throw Error('Invalid results');
      // เก็บเฉพาะข้อมูลแสดงผลในหน่วยความจำ ไม่เก็บคะแนนดิบหรือบันทึกภายใน
      if (grades.primary) {
        const report = await loadReport();
        if (!current()) return;
        const half = primaryPeriod(term.term);
        entry.primaryReport = primaryGradeReport(report.primaryReportRows(subjects, { half }), half, subjects);
      } else {
        const gpa = module.computeGpa(subjects);
        entry.gpa = { pending: gpa.pending, gpa: gpa.gpa, pendingReason: gpa.pendingReason };
        entry.subjects = subjects.map(subject => ({
          code: subject.subject.code, name: subject.subject.name, credits: subject.creditInfo?.credits,
          score: module.subjectTotalScore(subject), complete: subject.scoring?.complete !== false,
          type: subject.result.type, grade: subject.result.grade, sourceLabel: gradeSourceLabel(subject),
        }));
      }
      entry.released = true;
    } catch {
      if (current()) entry.error = 'ยังแสดงผลการเรียนไม่ได้ ลองใหม่';
    } finally {
      if (current()) { entry.loading = false; changed(); }
    }
  }
  async function loadGradeTerms(studentId, { force = false, summary = false } = {}) {
    const child = state.children[studentId], grades = child?.grades;
    if (!grades || (grades.started && !force)) return;
    grades.started = true;
    const ownVersion = version, revision = (revisions.get(grades) || 0) + 1;
    revisions.set(grades, revision);
    const current = () => version === ownVersion && revisions.get(grades) === revision;
    grades.terms.loading = true; grades.terms.error = '';
    // ล้างแคชทุกภาคและกันคำตอบเก่าที่ยังเดินทางอยู่ก่อนรีเฟรช
    grades.entries.clear(); changed();
    try {
      const data = await publishedTerms(studentId, child, force);
      if (!current()) return;
      grades.terms.rows = data;
      if (!data.some(row => academicTermKey(row) === grades.selected)) grades.selected = grades.terms.rows[0] ? academicTermKey(grades.terms.rows[0]) : '';
      grades.terms.loading = false;
      if (summary) await loadGradeSummary(studentId);
      else if (grades.selected) await selectGradeTerm(studentId, grades.selected);
    } catch {
      if (current()) grades.terms.error = 'ยังแสดงผลการเรียนไม่ได้ ลองใหม่';
    } finally {
      if (current()) {
        grades.terms.loading = false;
        state.loadedAt[`child/${studentId}/grades`] = now().getTime();
        changed();
      }
    }
  }
  async function loadGradeSummary(studentId) {
    const grades = state.children[studentId]?.grades;
    if (!grades) return;
    if (!grades.started) return loadGradeTerms(studentId, { summary: true });
    if (grades.terms.loading || grades.terms.error) return;
    const term = latestReleasedTerm(grades);
    if (term && !grades.entries.has(academicTermKey(term))) return loadGradeEntry(studentId, grades, term);
  }
  function publishedTerms(studentId, child, force) {
    if (!force && termRequests.has(child)) return termRequests.get(child);
    const request = (async () => {
      const { data, error } = await sb.rpc('child_grade_terms', { p_student_id: studentId });
      if (error || !Array.isArray(data) || data.some(row => !row || !row.year || !['1', '2'].includes(String(row.term)) ||
          typeof row.released !== 'boolean' || !validSchoolDate(row.release_date))) throw Error('Invalid terms');
      return sortAcademicTerms(data);
    })();
    termRequests.set(child, request);
    void request.catch(() => { if (termRequests.get(child) === request) termRequests.delete(child); });
    return request;
  }
  async function loadDevelopment(studentId, { summary = false, quiet = false, force = false, key,
    refreshTerms = true } = {}) {
    const child = state.children[studentId], target = child?.development;
    if (!target) return;
    if (key !== undefined) {
      if (!target.terms.rows.some(term => academicTermKey(term) === key)) return;
      target.selected = key;
      changed();
    }
    const ownVersion = version;
    const scope = `child/${studentId}/development`;
    const refresh = target.terms.loading || quiet || (force && target.terms.error);
    if (refresh || target.terms.pending) {
      if (!target.terms.pending) {
        if (!quiet) { target.terms.loading = true; target.terms.error = ''; }
        target.terms.pending = (async () => {
          try {
            const [published] = await Promise.all([
              publishedTerms(studentId, child, (quiet && refreshTerms) || force), schoolDaysPending,
            ]);
            if (version !== ownVersion) return;
            const currentTerms = attendanceTerms(state.schoolDays, state.today);
            const terms = new Map(currentTerms.map(term => [academicTermKey(term), { ...term, released: false }]));
            for (const term of published) terms.set(academicTermKey(term), term);
            target.terms.rows = sortAcademicTerms([...terms.values()]);
            target.currentKey = currentTerms.length ? academicTermKey(currentTerms.at(-1)) : '';
            target.terms.error = '';
            if (quiet) {
              const keep = summary ? latestReleasedTerm(target) : developmentTerm(target);
              for (const cachedKey of target.entries.keys()) {
                if (!keep || cachedKey !== academicTermKey(keep)) target.entries.delete(cachedKey);
              }
            }
          } catch {
            if (version === ownVersion && (!quiet || target.terms.loading)) target.terms.error = developmentError;
            return false;
          } finally {
            target.terms.loading = false;
            target.terms.pending = null;
          }
          return true;
        })();
        if (!quiet) changed();
      }
      if (!await target.terms.pending) {
        if (version === ownVersion) {
          if (!summary) state.loadedAt[scope] = now().getTime();
          changed();
        }
        return;
      }
    }
    if (version !== ownVersion || target.terms.error) return;
    const term = summary ? latestReleasedTerm(target) : developmentTerm(target);
    if (!term) {
      if (!summary && (refresh || state.loadedAt[scope] === undefined)) state.loadedAt[scope] = now().getTime();
      if (refresh) changed();
      return;
    }
    const termKey = academicTermKey(term), previous = target.entries.get(termKey);
    if (!summary && state.loadedAt[scope] === undefined) state.loadedAt[scope] = now().getTime();
    if (previous?.pending || (previous && !quiet && !force)) return;
    const retained = quiet && (term.released || !previous?.result?.released) ? previous?.result : null;
    const entry = { pending: true, loading: !retained, result: retained, error: '' };
    target.entries.set(termKey, entry);
    const current = () => version === ownVersion && target.entries.get(termKey) === entry;
    if (entry.loading) changed();
    try {
      const { data, error } = await sb.rpc('child_report_extras', {
        p_student_id: studentId, p_year: term.year, p_term: term.term,
      });
      if (!current()) return;
      if (error) throw error;
      // An explicit denial or withdrawal from the server invalidates previously visible results.
      if (!data || typeof data.released !== 'boolean' ||
          (data.release_date != null && !validSchoolDate(data.release_date))) {
        entry.result = null;
        throw Error('Invalid report');
      }
      if (!data.released) { entry.result = { released: false, release_date: data.release_date }; return; }
      entry.result = null;
      if (academicTermKey(data) !== termKey) throw Error('Invalid report term');
      const module = await loadReport();
      if (current()) entry.result = reportExtras(data, target.primary, module);
    } catch {
      if (current() && !entry.result) entry.error = developmentError;
    } finally {
      if (current()) {
        if (!summary) state.loadedAt[scope] = now().getTime();
        entry.loading = false; entry.pending = false; changed();
      }
    }
  }
  return { state, load, reset, loadLeaves, loadProfile, loadTimetable, loadTransport, loadFeeNotices, loadSubjectAttendance, loadGrades: loadGradeTerms,
    loadGradeSummary, selectGradeTerm, loadDevelopment };
}

function isPrimary(child) { return /^ป\./.test(child?.grade_level || ''); }
function isSecondary(child) { return /^ม\./.test(child?.grade_level || ''); }
function hasAcademicReports(child) { return isPrimary(child) || isSecondary(child); }
function academicTermKey(term) { return `${term.year}/${term.term}`; }
function sortAcademicTerms(terms) {
  return terms.slice().sort((a, b) => Number(b.year) - Number(a.year) || Number(b.term) - Number(a.term));
}
function latestReleasedTerm(view) { return view?.terms.rows.find(term => term.released === true); }
function developmentTerm(view) {
  const find = key => view.terms.rows.find(term => academicTermKey(term) === key);
  return find(view.selected) || latestReleasedTerm(view) || find(view.currentKey) || view.terms.rows[0];
}

const developmentError = 'ยังแสดงผลไม่ได้ ลองใหม่';
function reportExtras(data, primary, module) {
  const { term, comment, traits, trait_results, activity_categories, activity_assessments,
    activity_member_ids, activity_results, external_activity_results } = data;
  if (![traits, trait_results, activity_categories, activity_assessments, activity_member_ids,
    activity_results, external_activity_results].every(Array.isArray)) throw Error('Invalid report payload');
  const options = { primary, half: primary ? primaryPeriod(term) : '', term: String(term) };
  const terms = module.reportTerms(options);
  return { released: true, comment: typeof comment === 'string' ? comment : '',
    activities: module.activityRows(activity_categories, activity_assessments, new Set(activity_member_ids),
      new Map(activity_results.map(row => [row.assessment_id, row.passed])), terms, external_activity_results),
    traits: traits.slice().sort((a, b) => a.seq - b.seq).map(trait => ({
      name: trait.name, level: module.traitLevel(trait_results, trait.id, options),
    })),
    competency: reportCompetency(data),
  };
}
function reportCompetency({ competencies, competency_results, competency_published_at: publishedAt }) {
  if (!Array.isArray(competencies) || !Array.isArray(competency_results) ||
      typeof publishedAt !== 'string' || !Number.isFinite(Date.parse(publishedAt))) return null;
  const byId = new Map(competency_results.map(row => [row.competency_id, row]));
  const rows = competencies.slice().sort((a, b) => a.seq - b.seq).map(({ id, name }) => {
    const result = byId.get(id);
    if (!result) return { name, label: '—' };
    if (!result.complete) return { name, label: 'ยังสรุปไม่ได้', tone: 'neutral' };
    return { name, label: result.level ?? '—', tone: 'positive', score: result.score };
  });
  return { rows, publishedAt };
}
function primaryPeriod(term) { return String(term) === '2' ? 'ปลายปี' : 'กลางปี'; }
function primaryAverageLabel(term) { return String(term) === '2' ? 'คะแนนเฉลี่ยทั้งปี' : 'คะแนนเฉลี่ยกลางปี'; }
function releaseMessage(term, date, fallback, label = `ภาคเรียนที่ ${term.term}/${term.year}`) {
  return validSchoolDate(date)
    ? `ประกาศผล${escapeHtml(label)} วันที่ ${escapeHtml(thaiDate(date))}` : fallback;
}
function termChips(terms, selected, kind, label, idFor = (_, index) => index, groupLabel = 'เลือกภาคเรียน') {
  return `<div class="grade-terms${kind === 'attendance' ? ' attendance-terms' : ''}" role="group" aria-label="${groupLabel}">${terms.map((term, index) => {
    const key = academicTermKey(term);
    return `<button id="${kind}-term-${escapeHtml(idFor(term, index))}" class="filter-chip" type="button" data-${kind}-term="${escapeHtml(key)}" aria-pressed="${selected === key}">${escapeHtml(label(term))}</button>`;
  }).join('')}</div>`;
}

function gradeSourceLabel(item) {
  const source = item.external?.source;
  if (source === 'โอน') return 'ผลโอน';
  if (source === 'สุ่ม') return 'ผลประเมินแทน';
  return '';
}
function gradeSourceMarkup(label) {
  return label ? `<p class="grade-source"><span>${escapeHtml(label)}</span></p>` : '';
}
function primaryGradeReport({ rows, average, allOk, missingPeriods }, half, subjects) {
  const fullYear = half === 'ปลายปี';
  const sourceLabels = new Map(subjects.map(item => [item.subject.id, gradeSourceLabel(item)]));
  const displayRow = row => {
    const hideMidAndYear = row.missingMemberPeriods || row.external;
    return {
      code: row.subject.code, name: row.subject.name, hours: row.hours,
      mid: hideMidAndYear ? null : row.mid,
      ...(fullYear ? { end: row.missingMemberPeriods ? null : row.end,
        year: hideMidAndYear ? null : row.year, result: hideMidAndYear ? null : row.result } : {}),
    };
  };
  return { average, allOk, missingPeriods, rows: rows.map(row => ({
    ...displayRow(row), sourceLabel: sourceLabels.get(row.subject.id), members: row.members.map(displayRow),
  })) };
}
function primaryScoreMarkup(label, cell) {
  const value = Number.isFinite(cell?.score) ? cell.score.toFixed(2) : '—';
  return `<span>${label} <strong>${value}${cell?.ok === false ? '<sup>*</sup>' : ''}</strong></span>`;
}
function primaryGradeRowMarkup(row, fullYear, member = false) {
  const heading = member ? 'h3' : 'h2';
  const result = row.result?.label;
  const blocked = ['ร.', 'มส.'].includes(result);
  const level = fullYear
    ? `<span>ระดับผล <strong class="${blocked ? 'grade-warning' : ''}">${escapeHtml(result ?? '—')}${result != null && !blocked && row.result.ok === false ? '<sup>*</sup>' : ''}</strong></span>`
    : primaryScoreMarkup('กลางปี', row.mid);
  return `<div class="primary-grade-row"><div class="primary-grade-name"><p class="grade-code">${escapeHtml(row.code)}</p>
    <${heading}>${escapeHtml(row.name)}</${heading}>${gradeSourceMarkup(row.sourceLabel)}${!member && Number.isFinite(row.hours) && row.hours > 0
      ? `<p class="helper">${row.hours} ชม./ปี</p>` : ''}</div><div class="primary-grade-level">${level}</div></div>
    ${fullYear ? `<div class="primary-grade-scores">${primaryScoreMarkup('กลางปี', row.mid)}${primaryScoreMarkup('ปลายปี', row.end)}${primaryScoreMarkup('ทั้งปี', row.year)}</div>` : ''}
    ${blocked ? '<p class="helper primary-grade-contact">ติดต่อครูประจำวิชา</p>' : ''}`;
}
function primaryGradesMarkup({ rows, average, allOk, missingPeriods }, term) {
  const fullYear = primaryPeriod(term.term) === 'ปลายปี';
  return `<div class="grade-average"><h2>${primaryAverageLabel(term.term)} (ร้อยละ)</h2>
    ${Number.isFinite(average) ? `<strong>${average.toFixed(2)}${allOk ? '' : '<sup>*</sup>'}</strong>` : '<p>ยังสรุปไม่ได้</p>'}
    ${missingPeriods.length ? `<p class="helper primary-grade-note">ยังไม่ตั้งคาบเรียน: ${escapeHtml(missingPeriods.join(' · '))}</p>` : ''}
    ${allOk ? '' : '<p class="helper">* คะแนนยังกรอกไม่ครบ ผลอาจเปลี่ยน</p>'}</div>
    ${rows.length ? `<ul class="grade-subjects primary-grade-subjects" aria-label="ผลการเรียนรายวิชา">${rows.map(row =>
      `<li>${primaryGradeRowMarkup(row, fullYear)}${row.members.length
        ? `<ul class="primary-grade-members" aria-label="วิชาย่อย">${row.members.map(member => `<li>${primaryGradeRowMarkup(member, fullYear, true)}</li>`).join('')}</ul>`
        : ''}</li>`).join('')}</ul>` : '<p class="data-status">ยังไม่มีผลรายวิชา</p>'}
    <p class="helper">เฉลี่ยถ่วงด้วยชั่วโมงเรียน · ทั้งปี = (กลางปี + ปลายปี) ÷ 2 · ผลอาจเปลี่ยนได้หากครูแก้ไขคะแนน</p>`;
}

export function gradesMarkup(child, grades) {
  if (!hasAcademicReports(child)) return '<p class="data-status">ผลการเรียนระดับชั้นนี้จะเปิดให้ดูในแอปเร็ว ๆ นี้</p>';
  const retry = message => `<p class="field-error" role="alert">${escapeHtml(message)}</p><button id="retry-grades" class="button quiet">ลองใหม่</button>`;
  const loading = `<p class="data-status" role="status">${busyIcon()}กำลังโหลดผลการเรียน…</p>`;
  if (!grades || (grades.terms.loading && !grades.terms.rows.length)) return loading;
  if (grades.terms.error) return retry(grades.terms.error);
  if (!grades.terms.rows.length) return '<p class="data-status">ยังไม่มีการประกาศผลการเรียน</p>';
  const primary = isPrimary(child), terms = grades.terms.rows;
  const multipleYears = primary && new Set(terms.map(row => String(row.year))).size > 1;
  const chips = primary
    ? termChips(terms, grades.selected, 'grade', row => `${primaryPeriod(row.term)}${multipleYears ? ' ' + row.year : ''}`,
      row => `${row.year}-${row.term}`, 'เลือกช่วงปีการศึกษา')
    : termChips(terms, grades.selected, 'grade', row => `${row.term}/${row.year}`);
  if (grades.terms.loading) return chips + loading;
  const entry = grades.entries.get(grades.selected), term = grades.terms.rows.find(row => academicTermKey(row) === grades.selected);
  if (!entry || entry.loading) return chips + loading;
  if (entry.error) return chips + retry(entry.error);
  if (!entry.released) return chips + `<p class="data-status">${releaseMessage(term, entry.release_date, 'ยังไม่มีการประกาศผลการเรียน',
    primary ? `${primaryPeriod(term.term)} ปีการศึกษา ${term.year}` : undefined)}</p>`;
  if (primary) return chips + primaryGradesMarkup(entry.primaryReport, term);
  const gpa = entry.gpa;
  return chips + `<div class="grade-average"><h2>เกรดเฉลี่ยภาคเรียน</h2>${gpa.pending
    ? `<p>ยังสรุปเกรดเฉลี่ยไม่ได้</p><p class="helper">${escapeHtml(gpa.pendingReason)}</p>`
    : `<strong>${Number.isFinite(gpa.gpa) ? gpa.gpa.toFixed(2) : '—'}</strong>`}</div>
    ${entry.subjects.length ? `<ul class="grade-subjects" aria-label="ผลการเรียนรายวิชา">${entry.subjects.map(subject => {
      const blocked = ['ร.', 'มส.'].includes(subject.type);
      return `<li><p class="grade-code">${escapeHtml(subject.code)}</p><h2>${escapeHtml(subject.name)}</h2>${gradeSourceMarkup(subject.sourceLabel)}
        <p class="helper">หน่วยกิต ${escapeHtml(subject.credits ?? '—')}</p><div class="grade-values"><p>คะแนนรวม <strong>${Number.isFinite(subject.score) ? `${escapeHtml(subject.score.toFixed(2))} / 100` : '—'}</strong></p>
        <p>เกรด <strong class="${blocked || !subject.complete ? 'grade-warning' : ''}">${escapeHtml(blocked ? subject.type : !subject.complete ? 'ยังไม่ครบ' : subject.grade ?? '—')}</strong></p></div>
        ${blocked ? '<p class="helper">ติดต่อครูประจำวิชา</p>' : ''}</li>`;
    }).join('')}</ul>` : '<p class="data-status">ยังไม่มีผลรายวิชา</p>'}
    <p class="helper">ผลอาจเปลี่ยนได้หากครูแก้ไขคะแนน</p>`;
}

const traitLabels = ['ไม่ผ่าน', 'ผ่าน', 'ดี', 'ดีเยี่ยม'];
function developmentRows(rows) {
  return `<ul class="development-rows">${rows.map(({ name, label, tone, followUp, score }) => {
    const level = tone ? `<strong class="development-result ${tone}">${escapeHtml(label)}</strong>`
      : `<span class="muted">${escapeHtml(label)}</span>`;
    const value = Number.isFinite(score)
      ? `<span class="development-value">${level}<span class="development-score">${score.toFixed(1)}</span></span>` : level;
    return `<li><span class="development-name">${escapeHtml(name)}</span>${value}${followUp ? '<p class="helper">ติดต่อครูประจำชั้น</p>' : ''}</li>`;
  }).join('')}</ul>`;
}
export function developmentMarkup(view) {
  const loading = `<p class="data-status" role="status">${busyIcon()}กำลังโหลดผล…</p>`;
  const retry = `<p class="field-error" role="alert">${developmentError}</p><button id="retry-development" class="button quiet" type="button">ลองใหม่</button>`;
  if (!view || (view.terms.loading && !view.terms.rows.length)) return loading;
  const term = developmentTerm(view);
  const multipleYears = new Set(view.terms.rows.map(row => row.year)).size > 1;
  const chips = term ? termChips(view.terms.rows, academicTermKey(term), 'development', row => view.primary
    ? `${primaryPeriod(row.term)}${multipleYears ? ' ' + row.year : ''}` : `ภาค ${row.term}/${row.year}`,
  row => `${row.year}-${row.term}`) : '';
  if (view.terms.loading) return chips + loading;
  if (view.terms.error) return chips + retry;
  if (!term) return '<p class="data-status" role="status">ยังไม่มีการประกาศผล</p>';
  const entry = view.entries.get(academicTermKey(term));
  if (!entry || entry.loading) return chips + loading;
  if (entry.error) return chips + retry;
  const { result } = entry;
  if (!result.released) return chips + `<p class="data-status" role="status">${releaseMessage(term, result.release_date, 'ยังไม่มีการประกาศผล')}</p>`;
  const { comment, activities, traits, competency } = result;
  const activityContent = activities.length ? developmentRows(activities.map(({ name, result }) => ({ name, label: result,
    tone: result === 'ผ่าน' ? 'positive' : result === 'ไม่ผ่าน' ? 'danger' : 'neutral', followUp: result === 'ไม่ผ่าน',
  }))) : '<p class="data-status">ยังไม่มีกิจกรรมในภาคนี้</p>';
  const traitContent = traits.some(trait => trait.level !== null) ? developmentRows(traits.map(({ name, level }) => ({ name,
    label: traitLabels[level] ?? 'ยังไม่ประเมิน', tone: level === null ? 'neutral' : level === 0 ? 'danger' : 'positive',
  }))) : '<p class="data-status">ครูยังไม่ได้ประเมิน</p>';
  const competencyContent = competency
    ? `${developmentRows(competency.rows)}<p class="helper">บันทึกผลเมื่อ <time datetime="${escapeHtml(competency.publishedAt)}">${escapeHtml(thaiDate(competency.publishedAt))}</time></p>`
    : '<p class="data-status">ครูยังไม่ได้บันทึกผลสมรรถนะของภาคนี้</p>';
  return chips + (comment ? `<section class="data-card development-comment"><h2>ความเห็นครูประจำชั้น</h2>
    <p class="development-byline">ครูประจำชั้น · ภาคเรียนที่ ${escapeHtml(term.term)}/${escapeHtml(term.year)}</p><p class="development-message">${escapeHtml(comment)}</p></section>` : '') +
    `<section class="data-card"><h2>กิจกรรมพัฒนาผู้เรียน</h2>${activityContent}</section>
    <section class="data-card"><h2>สมรรถนะสำคัญ</h2>${competencyContent}</section>
    <section class="data-card"><h2>คุณลักษณะอันพึงประสงค์</h2>${traitContent}</section>`;
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

const attendanceStates = { มา: ['มา', 'present'], มาสาย: ['สาย', 'late'], ขาด: ['ขาด', 'absent'], ลาป่วย: ['ลา', 'leave'], ลากิจ: ['ลา', 'leave'] };
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
    }).join('')}</div><ul class="attendance-legend">${['มา', 'มาสาย', 'ขาด', 'ลาป่วย'].map(label => {
      const [abbr, tone] = attendanceStates[label];
      return `<li><span class="${tone}">${abbr}</span> ${label === 'ลาป่วย' ? 'ลาป่วย/ลากิจ' : label}</li>`;
    }).join('')}<li><span class="holiday">หยุด</span> = วันหยุดโรงเรียน</li><li>— ไม่มีรายการ</li></ul>
    <p class="month-summary">มา ${summary.มา} · สาย ${summary.มาสาย} · ขาด ${summary.ขาด} · ลา ${summary.ลา}</p>${!rows.some(row => row.attend_date.startsWith(month)) ? '<p class="muted">ยังไม่มีรายการเช็คชื่อในเดือนนี้</p>' : ''}`;
}

function resourceMarkup(data) {
  if (!data || data.loading) return `<p class="data-status" role="status">${busyIcon()}กำลังโหลดข้อมูล…</p>`;
  if (data.error) return `<p class="field-error" role="alert">${escapeHtml(data.error)}</p><button class="button quiet retry-data">ลองใหม่</button>`;
  return '';
}
const healthFlags = [
  ['drug_allergy', 'drug_allergy_none', 'แพ้ยา'],
  ['food_allergy', 'food_allergy_none', 'แพ้อาหาร'],
  ['chronic_disease', 'chronic_none', 'โรคประจำตัว'],
];
function profileText(value) { return String(value ?? '').trim(); }
function loadedProfile(data) { return data && !data.loading && !data.error ? data.rows[0] : undefined; }
export function hasHealthData(profile) {
  if (!profile) return false;
  return ['blood_type', 'regular_meds', 'emergency_phone'].some(field => profileText(profile[field])) ||
    healthFlags.some(([field, none]) => profileText(profile[field]) || profile[none] === true);
}
function profileLabel(hasHealth) { return hasHealth ? `${childSections.profile} · สุขภาพ` : childSections.profile; }
function homeroomTeachers(profile) {
  return (Array.isArray(profile?.homeroom_teachers) ? profile.homeroom_teachers : []).map(profileText).filter(Boolean);
}
function healthWarnings(profile) { return healthFlags.filter(([field]) => profileText(profile[field])); }
function formatEmergencyPhone(value) {
  const text = profileText(value), digits = text.replace(/[\s()-]/g, '');
  if (/^0\d{9}$/.test(digits)) return digits.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
  if (/^0\d{8}$/.test(digits)) return digits.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1-$2-$3');
  return text;
}
function profileStatus(data) {
  if (!data || data.loading) return resourceMarkup(data);
  if (data.error) {
    return `<p class="field-error" role="alert">${escapeHtml(data.error)}</p><button id="retry-profile" class="button quiet" type="button">ลองใหม่</button>`;
  }
  return '';
}
export function profileMarkup(data) {
  const status = profileStatus(data);
  if (status) return `<section class="data-card" aria-label="${childSections.profile}">${status}</section>`;
  const profile = data.rows[0];
  const teachers = homeroomTeachers(profile);
  const hasHealth = hasHealthData(profile);
  const warnings = healthWarnings(profile);
  const correction = '<p class="helper">ข้อมูลไม่ถูกต้อง แจ้งครูประจำชั้นเพื่อแก้ไข</p>';
  const healthValue = (field, none) => {
    const text = profileText(profile[field]);
    if (text) return [text];
    return none && profile[none] === true ? ['ไม่มี'] : ['ยังไม่ได้บันทึก', true];
  };
  const infoRow = (label, value, muted = false) => `<div><dt>${label}</dt><dd${muted ? ' class="muted"' : ''}>${escapeHtml(value || '—')}</dd></div>`;
  const placement = [classLabel(profile), profile.year && `ปีการศึกษา ${profile.year}`].filter(Boolean).join(' · ');
  const updated = profile.profile_updated_at;
  return `<section class="data-card profile-card"><h2>ข้อมูลประจำตัว</h2><dl>
      ${infoRow('ชื่อเล่น', profileText(profile.nickname))}${infoRow('เลขประจำตัว', profileText(profile.student_no))}
      ${infoRow('ชั้น/ห้อง', placement)}${infoRow('วันเกิด', validSchoolDate(profile.birth_date) ? thaiDate(profile.birth_date) : '')}
    </dl>${hasHealth ? '' : correction}</section>
    <section class="data-card profile-card"><h2>ครูประจำชั้น</h2>${teachers.length
      ? `<ul class="homeroom-list">${teachers.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>`
      : '<p class="muted">ยังไม่ได้ระบุครูประจำชั้นปีนี้</p>'}</section>
    ${hasHealth ? `<section class="data-card profile-card"><h2>สุขภาพ</h2>${warnings.length
      ? `<ul class="health-alert">${warnings.map(([field, , label]) => `<li>${icon('alert')}<span><strong>${label}:</strong> ${escapeHtml(profileText(profile[field]))}</span></li>`).join('')}</ul>`
      : ''}
      <dl>${infoRow('กรุ๊ปเลือด', ...healthValue('blood_type'))}
      ${[healthFlags[2], ...healthFlags.slice(0, 2)].map(([field, none, label]) => infoRow(label, ...healthValue(field, none))).join('')}
      ${infoRow('ยาประจำ', ...healthValue('regular_meds'))}
      ${infoRow('เบอร์ฉุกเฉิน', formatEmergencyPhone(profile.emergency_phone) || 'ยังไม่ได้บันทึก', !profileText(profile.emergency_phone))}</dl>
      ${correction}
      ${updated && Number.isFinite(Date.parse(updated)) ? `<p class="helper">ปรับปรุงล่าสุด ${escapeHtml(thaiDate(updated))}</p>` : ''}</section>` : ''}`;
}

export function yearAttendance(rows, schoolDays, today) {
  if (!schoolDays?.year_start) return null;
  const counts = { มา: 0, มาสาย: 0, ขาด: 0, ลา: 0 };
  for (const row of schoolYearAttendance(rows, schoolDays)) {
    if (row.attend_date > today) continue;
    if (row.status === 'ลาป่วย' || row.status === 'ลากิจ') counts.ลา++;
    else if (Object.hasOwn(counts, row.status)) counts[row.status]++;
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const present = counts.มา + counts.มาสาย;
  return total ? { present, total, percent: Math.round(present * 100 / total), absent: counts.ขาด,
    leave: counts.ลา, late: counts.มาสาย, year: schoolDays.year } : null;
}
function attendanceStats(data, read, term) {
  const dates = term ? { year: term.year, year_start: term.start, year_end: term.end } : read.schoolDays;
  return data && !data.loading && !data.error ? yearAttendance(data.rows, dates, read.today) : null;
}
function schoolYearLabel(year) { return year ? `ปีการศึกษา ${year}` : ''; }
export function attendanceTermChips(terms, selected) {
  if (!selected) return '';
  return termChips(terms, academicTermKey(selected), 'attendance', term => `ภาค ${term.term}`, term => term.term);
}
export function attendanceSummaryMarkup(data, read, term) {
  const status = resourceMarkup(data);
  const stats = attendanceStats(data, read, term);
  const period = term ? `ภาคเรียนที่ ${term.term}/${term.year}` : schoolYearLabel(stats?.year);
  return `<section class="data-card attendance-summary" aria-label="สรุปการมาเรียน${term ? escapeHtml(period) : 'ปีการศึกษานี้'}">${status ||
    (!stats ? `<p class="data-status">ยังไม่มีข้อมูลการมาเรียน${term ? escapeHtml(period) : 'ปีการศึกษานี้'}</p>` : `<div class="attendance-overview">
      <svg class="attendance-ring" viewBox="0 0 100 100" role="img" aria-label="มาเรียน ${stats.percent} เปอร์เซ็นต์">
        <circle cx="50" cy="50" r="43" fill="none" stroke="var(--line)" stroke-width="8"/>
        <circle cx="50" cy="50" r="43" fill="none" stroke="var(--teal)" stroke-width="8" pathLength="100"
          stroke-dasharray="${stats.percent} 100" transform="rotate(-90 50 50)"/>
        <text x="50" y="51" dominant-baseline="middle" text-anchor="middle">${stats.percent}%</text>
      </svg><div><p><strong>มา ${stats.present} จาก ${stats.total} วันที่ครูเช็ค</strong></p>
        <p class="muted">${escapeHtml(period)}</p>
        <ul class="attendance-counts"><li class="absent">ขาด ${stats.absent}</li><li class="leave">ลา ${stats.leave}</li><li class="late">สาย ${stats.late}</li></ul>
      </div></div>`)}</section>`;
}
export function subjectAttendanceMarkup(child, term, data) {
  if (!isSecondary(child)) return '';
  const entry = term && data?.attendanceView?.entries.get(academicTermKey(term));
  const loading = term ? !entry || entry.loading : !data || data.attendance.loading;
  let content;
  if (loading) content = `<p class="data-status" role="status">${busyIcon()}กำลังโหลดเวลาเรียนรายวิชา…</p>`;
  else if (!term) content = '<p class="data-status">ยังไม่มีข้อมูลภาคเรียนสำหรับแสดงเวลาเรียนรายวิชา</p>';
  else if (entry.error) content = `<p class="field-error" role="alert">${escapeHtml(entry.error)}</p><button id="retry-subject-attendance" class="button quiet" type="button">ลองใหม่</button>`;
  else if (!entry.result.subjects.length) content = '<p class="data-status">ยังไม่มีรายวิชาในภาคนี้</p>';
  else {
    const { subjects, warn, makeup, retake } = entry.result;
    const labels = { warn: 'ใกล้เกณฑ์', critical: 'เกินเกณฑ์ · ติดต่อครูประจำวิชา', retake: `ขาดเกิน ${retake}% · ติดต่อครูประจำวิชา` };
    content = `<p class="helper subject-attendance-hint">คิดจากคาบทั้งภาค · ลาคิดครึ่งคาบ · ขาดเกิน ${makeup}% ต้องเรียนชดเชย</p>
      <ul class="subject-attendance-list">${subjects.map(subject => {
        const tone = subject.level === 'warn' ? 'amber' : subject.level ? 'danger' : '';
        const retake = subject.level === 'retake';
        const missed = retake ? subject.rawMissed : subject.netMissed;
        const countLabel = retake && subject.makeupTotal ? 'ขาดก่อนชดเชย' : 'ขาด';
        return `<li><div class="subject-attendance-header"><h3>${escapeHtml(subject.name)}</h3>
          ${subject.empty ? '' : `<strong>${subject.percent ? `ขาด ${subject.percent.toFixed(1)}%` : 'ไม่ขาด'}</strong>`}</div>
          ${subject.code ? `<p class="helper subject-attendance-code">${escapeHtml(subject.code)}</p>` : ''}
          ${subject.empty ? `<p class="helper">${subject.empty}</p>` : `
            <div class="subject-meter ${tone}" aria-hidden="true" style="--meter-fill:${Math.min(100, subject.percent / makeup * 100)}%;--meter-warn:${warn / makeup * 100}%"><span></span></div>
            <p class="helper">${countLabel} ${missed} คาบ จาก ${escapeHtml(subject.totalPeriods)} คาบ${subject.makeupTotal ? ` · ชดเชยแล้ว ${subject.makeupTotal} คาบ` : ''}</p>
            ${tone ? `<p class="subject-risk ${tone}">${labels[subject.level]}</p>` : ''}`}</li>`;
      }).join('')}</ul>`;
  }
  return `<section class="data-card subject-attendance" aria-labelledby="subject-attendance-heading"><h2 id="subject-attendance-heading" tabindex="-1">เวลาเรียนรายวิชา</h2>${content}</section>`;
}
export function childTodayMarkup(data, read) {
  const row = data?.rows.find(item => item.attend_date === read.today);
  const holiday = read.schoolDays?.holidays.find(item => item.date === read.today);
  const weekend = [0, 6].includes(new Date(`${read.today}T12:00:00Z`).getUTCDay());
  const status = {
    มา: ['วันนี้มาเรียน', 'present', 'check'], มาสาย: ['วันนี้มาสาย', 'late', 'clock'],
    ขาด: ['วันนี้ขาดเรียน', 'absent', 'alert'], ลาป่วย: ['วันนี้ลาป่วย', 'leave', 'calendar'],
    ลากิจ: ['วันนี้ลากิจ', 'leave', 'calendar'],
  }[row?.status];
  let [label, tone, symbol] = status || ['ครูยังไม่เช็คชื่อวันนี้', 'unrecorded', 'clock'];
  if (status && ['present', 'late'].includes(tone) && Number.isFinite(Date.parse(row.recorded_at))) {
    const time = new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' });
    label += ` · เช็คชื่อ ${time.format(new Date(row.recorded_at))}`;
  } else if (!status && (holiday || weekend)) {
    [label, tone, symbol] = [`วันหยุด${holiday?.name ? ` · ${holiday.name}` : ''}`, 'holiday', 'calendar'];
  } else if (!status && data?.error) {
    [label, tone, symbol] = ['โหลดการมาเรียนวันนี้ไม่สำเร็จ', 'unrecorded', 'alert'];
  } else if (!status && (!data || data.loading)) {
    return `<p class="child-today unrecorded" role="status">${busyIcon()}<span>กำลังโหลดการมาเรียนวันนี้…</span></p>`;
  }
  return `<p class="child-today ${tone}" role="status">${icon(symbol)}<span>${escapeHtml(label)}</span></p>`;
}

const timetableError = 'โหลดตารางเรียนไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
const timetableNoRoom = 'โรงเรียนยังไม่มีตารางเรียนของห้องนี้ในระบบ';
const timetableWeekdays = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const timetableDayLabels = ['', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const bangkokClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
function weekdayOf(date) {
  return new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
}
function prepareTimetable(data) {
  if (data === null) return null;
  if (data?.timetable === null) return { hasPlacements: false };
  const table = data?.timetable;
  if (!table || !validSchoolDate(table.start_date) || !validSchoolDate(table.end_date) ||
      table.end_date < table.start_date || !Array.isArray(table.teaching_days) ||
      !Array.isArray(data.columns) || !Array.isArray(data.placements)) throw Error('Invalid timetable');

  let period = 0;
  const columns = data.columns.slice().sort((a, b) => a.seq - b.seq).map(column => ({
    ...column, period: column.kind === 'คาบเรียน' ? ++period : null,
  }));
  const bySequence = new Map(columns.map(column => [column.seq, column]));
  const days = new Map([...new Set(table.teaching_days)].filter(day => timetableWeekdays[day]).sort((a, b) => a - b)
    .map(day => [day, new Map()]));
  let hasPlacements = false;
  for (const { weekday, column_seq, span, title, subject_code, facility, teachers } of data.placements) {
    const placements = days.get(weekday), column = bySequence.get(column_seq), last = bySequence.get(column_seq + span - 1);
    if (!placements || !column || !last || column.kind === 'พัก') continue;
    if (!placements.has(column_seq)) placements.set(column_seq, []);
    placements.get(column_seq).push({ title, subject_code, facility, teachers: (teachers || []).filter(Boolean),
      end: last.end_time, lastSeq: last.seq });
    hasPlacements = true;
  }
  for (const [day, placements] of days) {
    const rows = [];
    let coveredThrough = 0;
    for (const column of columns) {
      const lessons = placements.get(column.seq) || [];
      if (!lessons.length && column.seq <= coveredThrough) continue;
      const end = lessons.reduce((latest, lesson) => lesson.end > latest ? lesson.end : latest, column.end_time);
      for (const lesson of lessons) coveredThrough = Math.max(coveredThrough, lesson.lastSeq);
      rows.push({ ...column, end, lessons });
    }
    days.set(day, rows);
  }
  return { name: table.name, classroom: classLabel(data), start_date: table.start_date, end_date: table.end_date,
    days, hasPlacements, holidays: new Set() };
}
function hasTeachingLesson(row) { return Boolean(row.period && row.lessons.length); }
function nextTeachingDate(table, from, { holidays = table.holidays, through = table.end_date, withLesson = false } = {}) {
  const end = through < table.end_date ? through : table.end_date;
  for (let date = from < table.start_date ? table.start_date : from; date <= end; date = shiftDate(date, 1)) {
    const rows = table.days.get(weekdayOf(date));
    if (rows && !holidays.has(date) && (!withLesson || rows.some(hasTeachingLesson))) return date;
  }
  return '';
}
function isTimetableToday(table, today) {
  return today >= table.start_date && today <= table.end_date;
}
function isCurrentLesson(row, lesson, time) {
  return row.start_time <= time && time < lesson.end;
}
function timetableTile(entry, href, now) {
  const options = { href, className: 'timetable-tile' };
  if (!entry || entry.loading) options.busy = true;
  else if (entry.error) options.detail = 'ยังแสดงตารางเรียนไม่ได้';
  else if (entry.result === null) options.detail = 'บัญชีนี้ยังดูตารางเรียนของนักเรียนคนนี้ไม่ได้';
  else if (!entry.result?.hasPlacements) {
    options.value = '—'; options.detail = 'ยังไม่มีตารางเรียนของห้องนี้';
  } else {
    const table = entry.result, today = bangkokDate(now), time = bangkokClock.format(now), weekday = weekdayOf(today);
    const lessonsToday = isTimetableToday(table, today) && !table.holidays.has(today)
      ? (table.days.get(weekday) || []).filter(hasTeachingLesson) : [];
    const current = lessonsToday.find(row => row.lessons.some(lesson => isCurrentLesson(row, lesson, time)));
    const upcoming = lessonsToday.find(row => time < row.start_time);
    if (current) {
      const lesson = current.lessons.find(lesson => isCurrentLesson(current, lesson, time));
      options.value = `คาบ ${current.period} · ${lesson.title}`;
      options.detail = ['ตอนนี้', `${current.start_time}–${lesson.end}`, ...lesson.teachers].join(' · ');
    } else if (upcoming) {
      options.value = `คาบ ${upcoming.period} · ${upcoming.lessons[0].title}`;
      options.detail = `ถัดไป ${upcoming.start_time}`;
    } else {
      const from = shiftDate(today, 1);
      const date = nextTeachingDate(table, from, { withLesson: true }), next = entry.next;
      const firstDate = date || (next?.hasPlacements && nextTeachingDate(next, from, { withLesson: true }));
      if (firstDate) {
        const day = weekdayOf(firstDate);
        const first = (date ? table : next).days.get(day).find(hasTeachingLesson);
        options.value = timetableWeekdays[day];
        options.detail = `คาบแรก ${first.start_time} · ${first.lessons[0].title}`;
      } else {
        options.value = '—'; options.detail = 'ยังไม่พบคาบเรียนถัดไป';
      }
    }
  }
  return childTile(childSections.timetable, 'clock', options);
}
function timetableRowMarkup(row, time) {
  const hours = `<span class="timetable-time">${escapeHtml(row.start_time)}–${escapeHtml(row.end)}</span>`;
  if (row.kind === 'พัก') {
    const lunch = row.start_time < '13:00' && row.end > '12:00';
    return `<li class="timetable-break"><span>${lunch ? 'พักกลางวัน' : 'พัก'}</span> ${hours}</li>`;
  }
  const current = row.lessons.some(lesson => isCurrentLesson(row, lesson, time));
  const past = Boolean(time && row.end <= time);
  const lessons = row.lessons.map(lesson => {
    const ownTime = lesson.end !== row.end
      ? `<span class="timetable-time">${escapeHtml(row.start_time)}–${escapeHtml(lesson.end)}</span>` : '';
    return `<li class="timetable-lesson${time && lesson.end <= time ? ' is-past' : ''}">
      <strong>${escapeHtml(lesson.title)}</strong>
      ${row.lessons.length > 1 && isCurrentLesson(row, lesson, time) ? '<span class="timetable-badge">ตอนนี้</span>' : ''}
      ${lesson.subject_code || ownTime ? `<p class="timetable-meta">${escapeHtml(lesson.subject_code)} ${ownTime}</p>` : ''}
      ${lesson.teachers.length ? `<p class="timetable-meta">${escapeHtml(lesson.teachers.join(' · '))}</p>` : ''}
      ${lesson.facility ? `<p class="timetable-meta">${escapeHtml(lesson.facility)}</p>` : ''}</li>`;
  }).join('');
  return `<li class="timetable-row${current ? ' is-current' : ''}${past ? ' is-past' : ''}">
    <div class="timetable-row-time">${hours}<span class="timetable-meta">${row.period ? `คาบ ${row.period}` : 'กิจกรรม'}</span>
      ${current && row.lessons.length === 1 ? '<span class="timetable-badge">ตอนนี้</span>' : ''}</div>
    ${lessons ? `<ul class="timetable-lessons">${lessons}</ul>` : '<span class="muted">ว่าง</span>'}</li>`;
}
export function timetableMarkup(entry, selected, now = new Date()) {
  const status = (message, role = '') => `<section class="data-card" aria-label="ตารางเรียน"><p class="muted"${role ? ` role="${role}"` : ''}>${message}</p></section>`;
  if (!entry || entry.loading) return status(`${busyIcon()}กำลังโหลดตารางเรียน…`, 'status');
  if (entry.error) return `<section class="data-card" aria-label="ตารางเรียน"><p class="field-error" role="alert">${timetableError}</p><button id="retry-timetable" class="button quiet" type="button">ลองใหม่</button></section>`;
  const table = entry.result;
  if (table === null) return status('บัญชีนี้ยังดูตารางเรียนของนักเรียนคนนี้ไม่ได้');
  if (!table?.start_date) return status('โรงเรียนยังไม่ได้เผยแพร่ตารางเรียน');
  if (!table.hasPlacements) return status(timetableNoRoom);

  const today = bangkokDate(now), todayInTable = isTimetableToday(table, today);
  const todayWeekday = todayInTable ? weekdayOf(today) : null;
  const nextDate = nextTeachingDate(table, today);
  const firstDay = table.days.keys().next().value;
  const day = table.days.has(selected) ? selected : nextDate ? weekdayOf(nextDate) : firstDay;
  const time = day === todayWeekday && !table.holidays.has(today) ? bangkokClock.format(now) : '';
  const chips = [...table.days.keys()].map(weekday => `<button class="filter-chip" type="button" id="timetable-day-${weekday}" data-timetable-day="${weekday}"
      aria-pressed="${weekday === day}" aria-controls="timetable-schedule" aria-label="วัน${timetableWeekdays[weekday]}${weekday === todayWeekday ? ' วันนี้' : ''}">
      <span>${timetableDayLabels[weekday]}</span>${weekday === todayWeekday ? '<span class="timetable-today">วันนี้</span>' : ''}</button>`).join('');
  return `${table.start_date > today ? `<p class="timetable-start">ตารางนี้เริ่มใช้ ${thaiDate(table.start_date)}</p>` : ''}
    <div class="timetable-days" role="group" aria-label="เลือกวันเรียน">${chips}</div>
    <section class="timetable-schedule" id="timetable-schedule" aria-labelledby="timetable-heading">
      <h2 id="timetable-heading" aria-live="polite">วัน${timetableWeekdays[day]}</h2>
      <ol class="timetable-rows">${table.days.get(day).map(row => timetableRowMarkup(row, time)).join('')}</ol>
    </section>
    <p class="helper timetable-note">บางวันอาจมีสอนแทนหรือแลกคาบ ตารางนี้เป็นตารางประจำสัปดาห์</p>`;
}

function childTile(label, symbol, { href, value, detail, busy = false, warning = false, extra = '', className = '' } = {}) {
  const classes = `child-tile${className ? ' ' + className : ''}`;
  const content = `<span class="tile-icon">${icon(symbol)}</span><strong class="tile-label">${label}</strong>
    ${value ? `<strong class="tile-value">${escapeHtml(value)}</strong>` : ''}
    ${busy ? `<span class="tile-detail">${busyIcon()}กำลังโหลด…</span>`
      : detail === undefined ? '' : `<span class="tile-detail${warning ? ' tile-warning' : ''}">${warning ? icon('alert') : ''}${escapeHtml(detail)}</span>`}${extra}`;
  return href ? `<a class="${classes}" href="${href}">${content}</a>`
    : `<div class="${classes} tile-upcoming">${content}</div>`;
}
const transportError = 'โหลดข้อมูลรถรับส่งไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
const transportNoService = 'ไม่ได้ใช้รถรับส่งของโรงเรียน';
const transportUnannounced = 'ยังไม่ประกาศยอด';
const transportDue = 'ค่ารถค้างชำระ';

function transportSummary(periods, charges, outstanding, payments, to) {
  const active = period => period.start_date <= to && (!period.end_date || period.end_date >= to);
  const orderedPeriods = periods.slice().sort((a, b) => Number(active(b)) - Number(active(a)) || b.start_date.localeCompare(a.start_date));
  const months = new Map();
  function monthFor(date) {
    const ym = `${date.slice(0, 7)}-01`;
    if (!months.has(ym)) months.set(ym, { ym, monthly: null, unannounced: false, daily: null, rides: 0 });
    return months.get(ym);
  }
  // Group the amounts already computed by the shared module for display.
  for (const { ym, amount, announced } of charges.months) {
    const month = monthFor(ym);
    if (announced) month.monthly = (month.monthly ?? 0) + amount;
    else month.unannounced = true;
  }
  for (const { date, amount } of charges.days) {
    const month = monthFor(date);
    month.daily = (month.daily ?? 0) + amount;
    if (amount > 0) month.rides++;
  }
  return { periods: orderedPeriods, to, outstanding, openingDebt: charges.openingDebt,
    months: [...months.values()].sort((a, b) => b.ym.localeCompare(a.ym)),
    unannouncedMonths: charges.unannouncedMonths,
    payments: payments.slice().sort((a, b) => b.pay_date.localeCompare(a.pay_date)) };
}
function transportMonth(ym, withYear = true) {
  return thaiDate(ym, { day: undefined, year: withYear ? 'numeric' : undefined });
}

function transportTile(entry, href) {
  const options = { href, className: 'transport-tile' };
  const result = entry?.result;
  if (!entry || entry.loading) options.busy = true;
  else if (entry.error || !result) options.detail = 'ยังแสดงยอดไม่ได้';
  else if (!result.periods.length) return childTile(childSections.transport, 'bus', { className: options.className, value: '—', detail: transportNoService });
  else {
    const { periods, outstanding, unannouncedMonths, to } = result;
    const period = periods.find(row => row.start_date <= to) || periods.at(-1);
    options.warning = outstanding > 0;
    options.value = options.warning ? baht(outstanding) : 'ไม่มียอดค้าง';
    options.detail = options.warning ? transportDue : [period.zone_name, period.billing_mode].filter(Boolean).join(' · ');
    if (unannouncedMonths.length) {
      const withYear = new Set(unannouncedMonths.map(ym => ym.slice(0, 4))).size > 1;
      const months = unannouncedMonths.map(ym => transportMonth(ym, withYear)).join(', ');
      const note = `+ ${transportUnannounced} ${months}`;
      if (options.warning) options.extra = `<span class="tile-detail">${escapeHtml(note)}</span>`;
      else options.detail = note;
    }
  }
  return childTile(childSections.transport, 'bus', options);
}

export function transportMarkup(entry) {
  if (!entry || entry.loading) return `<section class="data-card"><p class="muted" role="status">${busyIcon()}กำลังโหลดข้อมูลรถรับส่ง…</p></section>`;
  if (entry.error) return `<section class="data-card"><p class="field-error" role="alert">${escapeHtml(entry.error)}</p><button id="retry-transport" class="button quiet" type="button">ลองใหม่</button></section>`;
  const result = entry.result;
  if (!result) return '<section class="data-card"><p class="muted">บัญชีนี้ยังดูข้อมูลรถรับส่งของนักเรียนคนนี้ไม่ได้</p></section>';
  if (result.outstanding === undefined) return `<section class="data-card"><p class="muted">${transportNoService}</p></section>`;

  const { periods, to, outstanding, openingDebt, months, unannouncedMonths, payments } = result;
  const openingRow = openingDebt > 0 ? `<li class="transport-line"><span>ยอดยกมาจากปีก่อน</span><strong>${escapeHtml(baht(openingDebt))}</strong></li>` : '';
  const monthRows = months.map(({ ym, monthly, daily, rides, unannounced }) => `<li><h3>${transportMonth(ym)}</h3>
    ${monthly !== null ? `<div class="transport-line"><span>รายเดือน</span><strong>${escapeHtml(baht(monthly))}</strong></div>` : ''}
    ${unannounced ? `<p class="muted">${transportUnannounced}</p>` : ''}
    ${daily !== null ? `<div class="transport-line"><span>ขึ้นรถ ${rides.toLocaleString('th-TH')} วัน</span><strong>${escapeHtml(baht(daily))}</strong></div>` : ''}</li>`).join('');
  return `<section class="data-card transport-balance"><h2>${transportDue}</h2>
    <p class="transport-amount${outstanding > 0 ? ' is-due' : ''}">${outstanding > 0 ? `${icon('alert')}${escapeHtml(baht(outstanding))}` : 'ไม่มียอดค้าง'}</p>
    ${outstanding < 0 ? `<p>ชำระเกิน ${escapeHtml(baht(-outstanding))}</p>` : ''}
    <p class="helper">คิดถึงวันที่ <time datetime="${to}">${thaiDate(to)}</time></p>
    ${unannouncedMonths.length ? `<p class="helper">ยังไม่รวมเดือน ${unannouncedMonths.map(ym => transportMonth(ym)).join(', ')} ที่ฝ่ายการเงินยังไม่ประกาศยอด</p>` : ''}</section>
    <section class="data-card"><h2>การใช้รถ</h2>${periods.length ? `<ul class="transport-list">${periods.map(period => `<li><strong>${escapeHtml([period.zone_name, period.trip_mode, period.billing_mode].filter(Boolean).join(' · '))}</strong>
      <p class="muted">${thaiDate(period.start_date)} ${period.end_date ? `– ${thaiDate(period.end_date)}` : 'ถึงปัจจุบัน'}</p>
      ${period.billing_mode === 'รายวัน' ? `<p class="transport-rate">วันละ ${escapeHtml(baht(period.rate_amount))}</p>` : ''}</li>`).join('')}</ul>` : `<p class="muted">${transportNoService}</p>`}</section>
    <section class="data-card"><h2>ยอดรายเดือน</h2>${openingRow || monthRows ? `<ul class="transport-list">${openingRow}${monthRows}</ul>` : '<p class="muted">ยังไม่มียอดรายเดือน</p>'}</section>
    <section class="data-card"><h2>ประวัติชำระค่ารถ</h2>${payments.length ? `<ul class="transport-list">${payments.map(row => `<li class="transport-line"><div><time datetime="${escapeHtml(row.pay_date)}">${thaiDate(row.pay_date)}</time>
      ${row.method ? `<p class="muted">${escapeHtml(row.method)}</p>` : ''}</div><strong>${escapeHtml(baht(row.amount))}</strong></li>`).join('')}</ul>` : '<p class="muted">ยังไม่มีประวัติชำระค่ารถ</p>'}</section>
    <p class="helper transport-note">ยอดอาจเปลี่ยนเมื่อครูเช็คชื่อย้อนหลังหรือฝ่ายการเงินแก้ไข · สอบถามฝ่ายการเงิน</p>`;
}

const feeNoticeTitle = 'ใบแจ้งค่าธรรมเนียม';
const feeNoticeError = 'โหลดใบแจ้งค่าธรรมเนียมไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
const feeNoticeMismatch = 'ยอดรวมคงเหลือไม่ตรงกับยอดค้างชำระ กรุณาสอบถามฝ่ายการเงินของโรงเรียน';
const invoiceAmount = value => value.toLocaleString('th-TH', { maximumFractionDigits: 2 }).replace(/^-/, '−');

function invoiceSummary({ year, grade_level: grade }, { term, published_at: publishedAt, charges, payments }, module) {
  const { buildInvoiceRows, computeFeeOutstanding, MANUAL_NOTE_PLACEHOLDER } = module;
  if (!Array.isArray(charges) || !Array.isArray(payments) || typeof MANUAL_NOTE_PLACEHOLDER !== 'string') {
    throw Error('Incomplete fee notice data or formulas');
  }
  const table = buildInvoiceRows(charges, payments);
  const { outstanding } = computeFeeOutstanding(charges, payments);
  const header = { year, term, grade, publishedAt };
  if (![outstanding, table.full, table.paid, table.remaining].every(Number.isFinite) ||
      Math.abs(table.remaining - outstanding) > 0.005) return { ...header, error: feeNoticeMismatch };
  const rows = table.rows.map(({ note, ...row }) => ({ ...row, note: note === MANUAL_NOTE_PLACEHOLDER ? '' : note }));
  return { ...header, ...table, rows, outstanding };
}

function invoiceMarkup({ year, term, grade, publishedAt, error, outstanding, rows, full, paid }) {
  const scope = [`ภาคเรียนที่ ${term}/${year}`, grade].filter(Boolean).join(' · ');
  const date = typeof publishedAt === 'string' && Number.isFinite(Date.parse(publishedAt))
    ? `<p class="helper">ประกาศเมื่อ <time datetime="${escapeHtml(publishedAt)}">${escapeHtml(thaiDate(publishedAt))}</time></p>` : '';
  const header = `<h2>${feeNoticeTitle}</h2><h3>${escapeHtml(scope)}</h3>${date}`;
  if (error) return `<section class="data-card fee-notice">${header}<p class="field-error" role="alert">${escapeHtml(error)}</p></section>`;
  const due = outstanding > 0;
  const lines = rows.map(({ description, qty, unit, note, kind, full, paid, remaining }) => {
    const credit = full < 0;
    return `<li class="fee-notice-line${credit ? ' fee-notice-credit' : ''}">
      <div class="fee-notice-line-top"><strong>${escapeHtml(description || 'รายการค่าใช้จ่าย')}</strong>
      <strong aria-label="คงเหลือ ${invoiceAmount(remaining)} บาท">${invoiceAmount(remaining)}</strong></div>
      ${credit ? `<p class="fee-notice-kind">${escapeHtml(kind || 'ส่วนลด')}</p>` : ''}
      ${qty > 1 ? `<p class="helper">${invoiceAmount(qty)} × ${invoiceAmount(unit)} บาท</p>` : ''}
      ${note ? `<p class="helper">${escapeHtml(note)}</p>` : ''}
      <p class="helper">เต็ม ${invoiceAmount(full)} · จ่ายแล้ว ${invoiceAmount(paid)}</p></li>`;
  }).join('');
  return `<section class="data-card fee-notice">${header}
    <div class="fee-notice-balance${due ? ' is-due' : ''}">
      <span>ยอดคงเหลือ</span><strong>${invoiceAmount(outstanding)} บาท</strong>
      <span class="fee-notice-state">${icon(due ? 'alert' : 'check')}${due ? 'ค้างชำระ' : 'ชำระครบแล้ว'}</span>
    </div>
    ${lines ? `<ul class="fee-notice-lines">${lines}</ul>` : '<p class="muted">ยังไม่มีรายการค่าใช้จ่ายในภาคเรียนนี้</p>'}
    <dl class="fee-notice-totals">
      <div><dt>ยอดเต็ม</dt><dd>${invoiceAmount(full)} บาท</dd></div>
      <div><dt>จ่ายแล้ว</dt><dd>${invoiceAmount(paid)} บาท</dd></div>
      <div><dt>คงเหลือ</dt><dd>${invoiceAmount(outstanding)} บาท</dd></div>
    </dl>
    <p class="helper">ยอดเป็นปัจจุบัน · ชำระที่ฝ่ายการเงินของโรงเรียน</p>
  </section>`;
}

export function feeNoticesMarkup(entry) {
  if (entry?.result?.length && !entry.loading && !entry.error) return entry.result.map(invoiceMarkup).join('');
  const loading = !entry || entry.loading;
  const content = loading ? `<p class="muted" role="status">${busyIcon()}กำลังโหลดใบแจ้งค่าธรรมเนียม…</p>`
    : entry.error ? `<p class="field-error" role="alert">${escapeHtml(entry.error)}</p><button id="retry-fee-notices" class="button quiet" type="button">ลองใหม่</button>`
      : '<p class="muted">ยังไม่มีใบแจ้งค่าธรรมเนียมที่โรงเรียนประกาศ</p>';
  return `<section class="data-card fee-notice"><h2>${feeNoticeTitle}</h2>${content}</section>`;
}

function feeNoticesTileWarning(entry) {
  if (!entry?.result?.length || entry.error || entry.result.some(notice => notice.error)) return '';
  const due = entry.result.reduce((sum, notice) => sum + Math.max(0, notice.outstanding), 0);
  return due > 0 ? `<span class="tile-detail tile-warning fee-notice-warning">${icon('alert')}<span>ค้างค่าธรรมเนียม ${invoiceAmount(due)} บาท</span></span>` : '';
}

function attendanceTileNote(entry) {
  const subjects = entry?.result?.subjects || [];
  const danger = subjects.filter(subject => subject.level === 'retake' || subject.level === 'critical').length;
  const warn = danger ? 0 : subjects.filter(subject => subject.level === 'warn').length;
  const label = (severe, count) => `<span>${severe ? 'เกินเกณฑ์' : 'ใกล้เกณฑ์'} มส. ${count} วิชา</span>`;
  // Measure both warning labels before loading so Thai wrapping at high zoom cannot move the tiles.
  const space = [true, false].map(severe => `<span class="tile-warning-size" aria-hidden="true">${icon('alert')}${label(severe, 99)}</span>`).join('');
  return `<span class="attendance-tile-note">${space}${danger || warn
    ? `<span class="tile-warning${danger ? ' danger' : ''}">${icon('alert')}${label(danger, danger || warn)}</span>` : ''}</span>`;
}
function developmentTile(child, view, link) {
  if (!hasAcademicReports(child)) return childTile(childSections.development, 'activity', { detail: 'เปิดให้ดูเร็ว ๆ นี้' });
  const term = latestReleasedTerm(view), entry = term && view.entries.get(academicTermKey(term));
  const busy = !view || view.terms.loading || (term && !view.terms.error && (!entry || entry.loading));
  const activities = entry?.result?.activities;
  const failed = activities?.filter(row => row.result === 'ไม่ผ่าน').length || 0;
  const total = (passed, count, semester) => `กิจกรรมผ่าน ${passed}/${count} · ภาค ${semester}`;
  const warning = count => `${icon('alert')}<span>กิจกรรมไม่ผ่าน ${count} รายการ</span>`;
  const detail = view?.terms.error || entry?.error ? 'ยังแสดงผลไม่ได้' : activities
    ? total(activities.filter(row => row.result === 'ผ่าน').length, activities.length, `${term.term}/${term.year}`) : 'ยังไม่ประกาศผล';
  return childTile(childSections.development, 'activity', { href: link + '/development', extra: `
    <span class="tile-detail development-tile-slot"><span aria-hidden="true" class="tile-placeholder">${total(99, 99, '2/2569')}</span>
      <span>${busy ? `${busyIcon()}กำลังโหลด…` : escapeHtml(detail)}</span></span>
    <span class="development-tile-slot"><span aria-hidden="true" class="tile-warning-size">${warning(99)}</span>
      ${failed ? `<span class="tile-warning danger">${warning(failed)}</span>` : ''}</span>` });
}
function gradeTile(child, grades, href) {
  if (!hasAcademicReports(child)) return childTile(childSections.grades, 'book', { href, detail: 'เปิดให้ดูเร็ว ๆ นี้' });
  const term = latestReleasedTerm(grades);
  const entry = term && grades.entries.get(academicTermKey(term));
  const busy = !grades || grades.terms.loading || (!!term && !grades.terms.error && (!entry || entry.loading));
  const primary = isPrimary(child);
  const average = primary ? entry?.primaryReport?.average : entry?.gpa?.pending ? null : entry?.gpa?.gpa;
  const value = entry?.released && Number.isFinite(average) ? average.toFixed(2) : '';
  const error = grades?.terms.error || entry?.error;
  let detail = error ? 'ยังแสดงผลการเรียนไม่ได้' : 'ยังไม่ประกาศผล';
  if (!error && entry?.released) {
    detail = primary
      ? (value ? `${primaryAverageLabel(term.term)} ${term.year}` : 'ยังสรุปไม่ได้')
      : (value ? `เกรดเฉลี่ย ภาค ${term.term}/${term.year}` : 'ยังสรุปเกรดเฉลี่ยไม่ได้');
  }
  return childTile(childSections.grades, 'book', { href, value, busy, detail });
}
export function childTilesMarkup(child, data, read, now = new Date()) {
  const currentTerm = attendanceTerms(read.schoolDays, read.today).at(-1);
  const link = childHref(child.student_id), stats = attendanceStats(data?.attendance, read, currentTerm);
  const secondary = isSecondary(child);
  const subjectEntry = currentTerm && data?.attendanceView?.entries.get(academicTermKey(currentTerm));
  const balance = savingsBalance(data?.savings, read.money);
  const paid = data?.payments.rows.reduce((latest, row) => validSchoolDate(row.paid_on) && row.paid_on > latest ? row.paid_on : latest, '');
  const profile = loadedProfile(data?.profile), hasHealth = hasHealthData(profile);
  const warnings = hasHealth ? healthWarnings(profile) : [];
  const bloodType = profileText(profile?.blood_type), studentNo = profileText(profile?.student_no);
  return childTile(childSections.attendance, 'attendance', {
    href: link + '/attendance', value: stats && `${stats.percent}%`, busy: !data || data.attendance.loading,
    detail: stats ? [currentTerm ? `ภาค ${currentTerm.term}/${currentTerm.year}` : schoolYearLabel(stats.year), `ขาด ${stats.absent} ลา ${stats.leave} สาย ${stats.late}`].filter(Boolean).join(' · ')
      : data?.attendance.error ? 'ยังแสดงข้อมูลไม่ได้' : 'ยังไม่มีข้อมูล',
    extra: secondary && currentTerm ? attendanceTileNote(subjectEntry) : '',
  }) + gradeTile(child, data?.grades, link + '/grades') + childTile(childSections.money, 'wallet', {
    href: link + '/money', value: balance === null ? '' : baht(balance), busy: !data || data.savings.loading || read.moneyLoading,
    detail: balance === null ? 'ยังแสดงยอดไม่ได้' : data.payments.loading ? 'กำลังโหลดประวัติการชำระ…'
      : data.payments.error ? 'ยังแสดงประวัติการชำระไม่ได้' : validSchoolDate(paid)
        ? `ชำระล่าสุด ${thaiDate(paid, { year: undefined })}` : 'ยังไม่มีประวัติการชำระ',
    extra: feeNoticesTileWarning(data?.feeNotices),
  }) + childTile(profileLabel(hasHealth), hasHealth ? 'heart' : 'user', {
    href: link + '/profile', busy: !data || data.profile.loading, warning: warnings.length > 0,
    detail: data?.profile.error ? 'ยังแสดงข้อมูลไม่ได้' : warnings.length === 1 && warnings[0][0] === 'drug_allergy' ? 'แพ้ยา 1 รายการ'
      : warnings.length ? `มีข้อควรระวัง ${warnings.length} รายการ` : bloodType ? `กรุ๊ปเลือด ${bloodType}`
        : hasHealth ? 'ดูข้อมูลสุขภาพ' : studentNo ? `เลขประจำตัว ${studentNo}` : 'ดูข้อมูลประจำตัว',
  }) + childTile('ยื่นใบลา', 'receipt', { href: `#leave/${encodeURIComponent(child.student_id)}`, detail: 'แจ้งลาป่วย/ลากิจ' }) +
    developmentTile(child, data?.development, link) + timetableTile(data?.timetable, link + '/timetable', now) +
    transportTile(data?.transport, link + '/transport');
}
export function savingsMarkup(data, money, expanded = false, moneyLoading = false) {
  const unavailable = resourceMarkup(data);
  if (unavailable) return unavailable;
  const balance = savingsBalance(data, money);
  const rows = data.rows.slice().reverse();
  return `<p class="savings-balance">${moneyLoading ? `${busyIcon()}กำลังโหลด…` : balance === null ? 'ยังแสดงยอดไม่ได้' : escapeHtml(baht(balance))}</p>${balance === null && !moneyLoading ? '<p class="muted">ยอดคงเหลือยังไม่พร้อมแสดง คุณยังดูรายการเงินออมได้</p><button class="button quiet retry-data">ลองใหม่</button>' : ''}
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
  now = () => new Date(), loadMoney, loadGrades, loadReport, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
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
  const reads = createReadController(sb, { changed: notify, now, loadMoney, loadGrades, loadReport, leavesChanged(messages) {
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
    const route = routeFor(state, hash());
    if (!['home', 'child', 'childSection', 'calendar'].includes(route)) return;
    const isChild = route === 'child' || route === 'childSection';
    const { id: studentId, section } = isChild ? childLocation(hash()) : { id: '', section: '' };
    if (isChild && !ownsChild(studentId)) return;
    const page = isChild ? 'child' : route;
    const scope = isChild ? `child/${studentId}${section ? `/${section}` : ''}` : page;
    const loadedAt = state.read.loadedAt[scope];
    if (loadedAt === undefined || now().getTime() - loadedAt <= 60_000) {
      if (isChild && (!section || section === 'timetable')) notify();
      return;
    }
    // Same read version/revisions guard every reply after reset, sign-out or account change.
    return reads.load(state.children, { quiet: true, page, studentId, section });
  }
  async function loadChildPage(id, section) {
    const route = routeFor(state, hash());
    if (route !== 'child' && route !== 'childSection') return;
    const location = childLocation(hash());
    if (location.id !== id || location.section !== section || !ownsChild(id)) return;
    if (!section) return Promise.all([reads.loadProfile(id), reads.loadGradeSummary(id),
      reads.loadSubjectAttendance(id, { summary: true }), reads.loadDevelopment(id, { summary: true }), reads.loadTimetable(id),
      reads.loadTransport(id), reads.loadFeeNotices(id)]);
    if (section === 'money') return reads.loadFeeNotices(id);
    if (section === 'timetable') return reads.loadTimetable(id);
    if (section === 'transport') return reads.loadTransport(id);
    if (section === 'attendance') return reads.loadSubjectAttendance(id);
    if (section === 'profile') return reads.loadProfile(id);
    if (section === 'development') return reads.loadDevelopment(id);
    if (section === 'grades') {
      const grades = state.read.children[id]?.grades;
      if (!grades) return;
      if (!grades.started) return reads.loadGrades(id);
      if (!grades.terms.loading && !grades.terms.error && grades.selected && !grades.entries.has(grades.selected)) {
        return reads.selectGradeTerm(id, grades.selected);
      }
    }
  }
  return { state, start, signIn, redeem, signOut, loadChildren, acceptSession, notify, submitLeave, cancelLeave,
    refreshOnReturn, loadChildPage,
    beginLeave(id) { if (ownsChild(id) && state.leaveDraft?.studentId !== String(id)) { state.leaveDraft = newLeaveDraft(id); state.leaveError = ''; } },
    discardLeave() { resetLeave(); },
    loadLeaves(id) { if (ownsChild(id)) return reads.loadLeaves(id); },
    retryProfile(id) { if (ownsChild(id)) return reads.loadProfile(id, { force: true }); },
    retryTimetable(id) { if (ownsChild(id)) return reads.loadTimetable(id, { force: true }); },
    retryTransport(id) { if (ownsChild(id)) return reads.loadTransport(id, { force: true }); },
    retryFeeNotices(id) { if (ownsChild(id)) return reads.loadFeeNotices(id, { force: true }); },
    selectAttendanceTerm(id, key) { if (ownsChild(id)) return reads.loadSubjectAttendance(id, { key }); },
    retrySubjectAttendance(id) { if (ownsChild(id)) return reads.loadSubjectAttendance(id, { force: true }); },
    loadGrades(id, options) { if (ownsChild(id)) return reads.loadGrades(id, options); },
    selectGradeTerm(id, key) { if (ownsChild(id)) return reads.selectGradeTerm(id, key); },
    selectDevelopmentTerm(id, key) { if (ownsChild(id)) return reads.loadDevelopment(id, { key }); },
    retryDevelopment(id) { if (ownsChild(id)) return reads.loadDevelopment(id, { force: true }); },
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
  hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
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
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20v-1a7 7 0 0 1 14 0v1"/>',
  heart: '<path d="M20.8 5.6a5.3 5.3 0 0 0-7.5 0L12 6.9l-1.3-1.3a5.3 5.3 0 1 0-7.5 7.5l8.8 8.4 8.8-8.4a5.3 5.3 0 0 0 0-7.5Z"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4m0 4h.01"/>',
  book: '<path d="M12 5v15M3 4h4a6 6 0 0 1 5 2.5A6 6 0 0 1 17 4h4v14h-4a6 6 0 0 0-5 2.5A6 6 0 0 0 7 18H3z"/>',
  wallet: '<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 10h20M16 15h2"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  home: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  backpack: '<rect x="5" y="6" width="14" height="15" rx="3"/><path d="M9 6V5a3 3 0 0 1 6 0v1M5 13h14m-7 0v2"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`; }
function busyIcon() { return `<span class="busy-icon">${icon('hourglass')}</span>`; }
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

export function bottomNavigation(route, childId) {
  const active = ['childSection', 'leave'].includes(route) ? 'child' : route;
  return [['home', '#home', 'วันนี้', 'home'], ['child', childHref(childId), 'ลูก', 'backpack'],
    ['calendar', '#calendar', 'ปฏิทิน', 'calendar'], ['account', '#account', 'บัญชี', 'account']]
    .map(([page, href, label, symbol]) => `<a href="${href}"${page === active ? ' aria-current="page"' : ''}><span class="nav-icon">${icon(symbol)}</span><span>${label}</span></a>`).join('');
}

export function childMarkup(child, index = 0) {
  return `<li class="child-card"><a class="child-card-link" href="#child/${encodeURIComponent(child.student_id)}"><div class="child-who"><span class="avatar tone-${childTone(index)}" aria-hidden="true">${escapeHtml(childInitials(child.name))}</span>
    <div class="child-info"><h2>${escapeHtml(child.name)}</h2><span class="grade-chip">${escapeHtml(classLabel(child))}</span>
    <p class="relation">คุณเป็น ${escapeHtml(child.relation)}</p></div></div>
    ${child.status && child.status !== 'กำลังศึกษา' ? `<p><span class="student-status">สถานะ: ${escapeHtml(child.status)}</span></p>` : ''}<span class="child-open">เปิดแฟ้มลูก ${icon('forward')}</span></a></li>`;
}

function childShortName(child, data) {
  return profileText(data?.profile.rows[0]?.nickname) || profileText(child.nickname) || firstName(child.name);
}
function childHubMarkup(child, s) {
  const id = String(child.student_id), data = s.read.children[id], profile = data?.profile.rows[0];
  const children = s.children, index = children.indexOf(child), teachers = homeroomTeachers(profile);
  const childrenNav = children.length < 2 ? '' : `<nav class="hub-children" aria-label="เลือกแฟ้มลูก">${children.map(item => {
    const record = s.read.children[item.student_id];
    const label = [childShortName(item, record), classLabel(record?.profile.rows[0] || item)].filter(Boolean).join(' · ');
    return `<a href="${childHref(item.student_id)}"${item === child ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
  }).join('')}</nav>`;
  const name = profile?.name || child.name;
  const identity = [classLabel(profile || child), profile?.student_no && `เลขประจำตัว ${profile.student_no}`].filter(Boolean).join(' · ');
  const loading = !data || data.profile.loading;
  return `<section class="child-hub">
    <header class="hub-header"><p>ลูกของคุณ</p>${childrenNav}</header>
    <div class="hub-content">
      <div class="hub-id data-card"><div class="child-who"><span class="avatar tone-${childTone(index)}" aria-hidden="true">${escapeHtml(childInitials(name))}</span>
        <div class="child-info"><h1 tabindex="-1">${escapeHtml(name)}</h1>
          <p class="hub-id-meta">${escapeHtml(identity)}</p>
          ${teachers.length ? `<p class="hub-id-meta">ครูประจำชั้น ${escapeHtml(teachers.join(' · '))}</p>`
            : loading ? '<p class="hub-id-meta" aria-hidden="true"></p>' : ''}
        </div></div>
        ${child.status && child.status !== 'กำลังศึกษา' ? `<span class="student-status">สถานะ: ${escapeHtml(child.status)}</span>` : ''}
      </div>
      ${data?.profile.error ? `<div class="data-card hub-profile-error">${profileStatus(data.profile)}</div>` : ''}
      ${childTodayMarkup(data?.attendance, s.read)}
      <h2>ดูข้อมูลลูก</h2><div class="child-tiles">${childTilesMarkup(child, data, s.read)}</div>
    </div></section>`;
}
function childSectionMarkup(child, title, data, subtitle = child.name) {
  const name = childShortName(child, data);
  return `<header class="child-section-header">
    <a class="button child-section-back" href="${childHref(child.student_id)}">${icon('back')}${escapeHtml(name ? `แฟ้มของ${name}` : 'แฟ้มลูก')}</a>
    <h1 tabindex="-1">${title}</h1><p>${escapeHtml(subtitle)}</p>
  </header>`;
}

export function mountParentApp(sb, win = window, doc = document, initialPrompt = null, updates = null) {
  const main = doc.getElementById('main'), account = doc.getElementById('account-bar');
  const app = doc.getElementById('app'), nav = doc.getElementById('bottom-nav');
  const success = doc.getElementById('success-message');
  let previousRoute = '', previousView = '', deferredPrompt = initialPrompt, installBusy = false, installError = '';
  let selectedChildId = null, filterAccountId = null;
  let lastChildId = null, detailChildId = null, detailMonth = '', expandedSavings = false, homeScroll = 0, homeFilterScroll = 0;
  let timetableDay = null;
  const hubScroll = new Map();
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
      ${kind === 'ios' ? `<ol class="install-steps"><li>แตะ ${icon('share')} แชร์ ใน Safari</li><li>เลือก ${icon('add')} เพิ่มลงในหน้าจอโฮม</li></ol>` : `<button id="install-app" class="button primary full" ${installBusy ? 'disabled' : ''}>${installBusy ? `${busyIcon()}กำลังติดตั้ง…` : 'ติดตั้งแอป'}</button>`}
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
    const activeInNav = nav.contains(doc.activeElement);
    const selection = ['invite-code', 'leave-reason'].includes(activeId)
      ? [doc.activeElement.selectionStart, doc.activeElement.selectionEnd] : null;
    const filterScroll = main.querySelector('.child-filters')?.scrollLeft || 0;
    const isChildRoute = ['child', 'childSection', 'childMissing', 'leave'].includes(route);
    const view = isChildRoute ? win.location.hash : route;
    const { id, section } = isChildRoute ? childLocation(view) : {};
    const child = route !== 'childMissing' && s.children.find(row => String(row.student_id) === id);
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
    if (previousRoute === 'child' && detailChildId) hubScroll.set(detailChildId, win.scrollY);
    const focusRoute = view !== previousView;
    if (focusRoute) timetableDay = null;
    const returningHome = route === 'home' && ['child', 'childSection'].includes(previousRoute);
    const returningHub = route === 'child' && ['childSection', 'leave'].includes(previousRoute) && childLocation(previousView).id === id;
    if (previousRoute === 'leave' && view !== previousView && s.leaveDraft) controller.discardLeave();
    previousRoute = route; previousView = view;
    if (['login', 'home', 'redeem', 'calendar', 'account'].includes(route) && win.location.hash !== `#${route}`) {
      win.history.replaceState(null, '', `#${route}`);
    }
    if (filterAccountId !== s.session?.user?.id) {
      closeDialog?.(false);
      selectedChildId = null; filterAccountId = s.session?.user?.id;
      lastChildId = null; detailChildId = null; detailMonth = ''; expandedSavings = false; homeScroll = 0; homeFilterScroll = 0;
      hubScroll.clear();
    }
    if (selectedChildId !== null && !s.children.some(child => String(child.student_id) === selectedChildId)) selectedChildId = null;
    if (child) lastChildId = id;
    const navChild = s.children.find(row => String(row.student_id) === lastChildId) || s.children[0];
    app.dataset.screen = route;
    const hasNav = !!s.session && s.children.length > 0;
    app.classList.toggle('with-nav', hasNav);
    nav.hidden = !hasNav; nav.innerHTML = hasNav ? bottomNavigation(route, navChild.student_id) : '';
    doc.documentElement.classList.toggle('has-bottom-nav', hasNav);
    doc.getElementById('school-brand').hidden = !['loading', 'error'].includes(route);
    doc.getElementById('site-footer').hidden = !['loading', 'error'].includes(route);
    const showAccountBar = !!s.session && ['redeem', 'loading', 'error'].includes(route);
    account.hidden = !showAccountBar;
    account.classList.toggle('redeem-topbar', route === 'redeem');
    account.innerHTML = showAccountBar ? `${route === 'redeem' && s.children.length ? `<a class="button back-button" href="#home" aria-label="ย้อนกลับไปหน้าแรก">${icon('back')}</a>` : ''}
      <div class="account-info">${route === 'redeem' ? '<strong>เชื่อมกับลูกของคุณ</strong>' : '<small>บัญชีที่ใช้อยู่</small>'}<p class="account-email">${escapeHtml(s.session.user.email || 'ไม่พบอีเมลของบัญชี')}</p></div>
      ${route !== 'redeem' || !s.children.length ? `<button id="sign-out" class="button signout" ${s.signoutBusy ? 'disabled' : ''}>${s.signoutBusy ? `${busyIcon()}กำลังออก…` : 'ออกจากระบบ'}</button>` : ''}` : '';
    account.querySelector('#sign-out')?.addEventListener('click', controller.signOut);
    if (focusRoute && route === 'leave') { s.success = ''; s.resumeNotice = ''; }
    success.classList.toggle('resume-toast', !!s.resumeNotice);
    success.hidden = !(s.resumeNotice || s.success); success.textContent = s.resumeNotice || s.success;
    main.setAttribute('aria-busy', String(route === 'loading' || s.redeemBusy || s.leaveBusy));
    if (route === 'login') {
      doc.title = 'CRS MIS (ผู้ปกครอง-นักเรียน) — โรงเรียนเจริญศึกษา';
      main.innerHTML = `<section class="login-screen"><div class="login-hero"><div class="crest"><img src="./icons/icon-192.png" alt="ตราโรงเรียนเจริญศึกษา" width="80" height="80"></div>
        <p class="school">โรงเรียนเจริญศึกษา</p><h1 tabindex="-1"><span class="login-title">CRS MIS</span> <span class="login-subtitle">ผู้ปกครอง-นักเรียน</span></h1><p class="tagline">ติดตามลูกได้ทุกวัน ในมือถือของคุณ</p></div>
        <div class="login-sheet"><ul class="features">
          <li><span class="feature-icon">${icon('attendance')}</span><div><strong>การมาเรียนรายวัน</strong><p>มา สาย ขาด ลา เห็นทันทีที่ครูเช็คชื่อ</p></div></li>
          <li><span class="feature-icon">${icon('wallet')}</span><div><strong>เงินออมและค่าใช้จ่าย</strong><p>ยอดออม ใบเสร็จ ใบแจ้งค่าธรรมเนียม</p></div></li>
          <li><span class="feature-icon">${icon('bell')}</span><div><strong>แจ้งเตือนสำคัญ</strong><p>ลูกขาดเรียน ผลใบลา ใบแจ้งหนี้ออก</p></div></li></ul>
        <button id="google-login" class="button google full" ${s.loginBusy ? 'disabled' : ''} aria-describedby="login-error">${s.loginBusy ? busyIcon() : googleIcon}<span>${s.loginBusy ? 'กำลังไปหน้า Google…' : 'เข้าสู่ระบบด้วย Google'}</span></button>
        <p id="login-error" class="field-error" role="alert">${escapeHtml(s.loginError)}</p>
        <p class="login-fine">ครั้งแรกต้องใช้รหัสจากครูประจำชั้น · <a href="./privacy.html">นโยบายความเป็นส่วนตัว</a></p>
        <p class="login-developer">ผู้พัฒนา: ผอ.อานนท์ ปัญจเมธีกุล · <a href="mailto:nonpatan@gmail.com">nonpatan@gmail.com</a></p></div></section>`;
      main.querySelector('#google-login').addEventListener('click', controller.signIn);
    } else if (route === 'loading') {
      main.innerHTML = `<section class="panel"><h1 tabindex="-1">${busyIcon()}${s.signoutBusy ? 'กำลังออกจากระบบ…' : 'กำลังโหลดรายชื่อลูก…'}</h1><p class="muted" role="status">กรุณารอสักครู่</p></section>`;
    } else if (route === 'error') {
      main.innerHTML = `<section class="panel"><h1 tabindex="-1">ยังเปิดรายชื่อลูกไม่ได้</h1><p class="notice error" role="alert">${escapeHtml(s.loadError)}</p><button id="retry-children" class="button primary full">ลองใหม่</button></section>`;
      main.querySelector('#retry-children').addEventListener('click', controller.loadChildren);
    } else if (route === 'redeem') {
      doc.title = 'กรอกรหัสจากครูประจำชั้น — CRS MIS';
      const locked = s.lockedUntil > Date.now();
      main.innerHTML = `<div class="steps" role="img" aria-label="ขั้นที่ 2 จาก 3"><span></span><span></span><span class="step-next"></span></div>
        <section class="screen-page redeem-screen"><h1 tabindex="-1">กรอกรหัสจากครูประจำชั้น</h1>
        <p class="muted redeem-intro">${s.children.length ? 'เพิ่มลูกอีกคนด้วยรหัสที่ได้รับจากครูประจำชั้น' : 'ขั้นที่ 2 จาก 3 · ใช้รหัสครั้งเดียว ก็เห็นข้อมูลลูกทุกวัน'}</p>
        <form id="invite-form"><div class="field invite-ticket"><label for="invite-code">รหัสเชิญ</label>
        <input id="invite-code" name="invite-code" type="text" inputmode="text" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" placeholder="ABCD-EF__" value="${escapeHtml(s.code)}" aria-describedby="invite-help invite-error" aria-invalid="${!!s.redeemError}" ${s.redeemBusy ? 'readonly' : ''}>
        <p id="invite-help" class="helper">8 ตัว เช่น ABCD-EF23 · วางจาก LINE ได้เลย</p><p id="invite-error" class="field-error" role="alert">${escapeHtml(s.redeemError)}</p></div>
        <p class="invite-tip">${icon('info')}<span>ยังไม่มีรหัส? ขอได้จากครูประจำชั้นของลูก รหัสใช้ได้ 7 วัน</span></p>
        <div class="actions"><button id="redeem-code" class="button primary full" ${s.redeemBusy || locked || inviteCharacters(s.code).length !== 8 ? 'disabled' : ''}>${s.redeemBusy ? `${busyIcon()}กำลังตรวจรหัส…` : 'ยืนยันรหัส'}</button></div></form></section>`;
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
      doc.title = 'วันนี้ — CRS MIS';
      const summary = homeSummary(filterChildren(s.children, selectedChildId), s.read);
      const feed = splitFeed(s.read.feed.rows, s.children, selectedChildId, s.read.today);
      main.innerHTML = `<section><header class="home-header"><p class="today-date">${escapeHtml(thaiToday())}</p><h1 tabindex="-1">${escapeHtml(guardianGreeting(s.children))}</h1></header>
        <div class="child-filters" role="group" aria-label="กรองตามลูก"><button id="child-filter-all" class="filter-chip" aria-pressed="${selectedChildId === null}">ทุกคน</button>
        ${s.children.map((child, index) => `<button id="child-filter-${index}" class="filter-chip" data-child-id="${escapeHtml(child.student_id)}" aria-label="ดูข้อมูลของ ${escapeHtml(child.name)}" aria-pressed="${String(child.student_id) === selectedChildId}">${escapeHtml(firstName(child.nickname || child.name) || 'ลูกของฉัน')}</button>`).join('')}</div>
        <div class="home-content"><div class="summary-grid"><div aria-busy="${summary.attendanceBusy}"><h2>มาเรียนวันนี้</h2><strong>${summary.attendanceBusy ? busyIcon() : ''}${escapeHtml(summary.attendance)}</strong><p>${escapeHtml(summary.attendanceDetail)}</p></div><div aria-busy="${summary.savingsBusy}"><h2>เงินออมรวม</h2><strong>${summary.savingsBusy ? busyIcon() : ''}${escapeHtml(summary.savings)}</strong><p>ของลูกที่เลือก</p></div></div>
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
    } else if (isChildRoute && !child) {
      doc.title = 'ไม่พบข้อมูลลูก — CRS MIS';
      main.innerHTML = '<section class="screen-page"><h1 tabindex="-1">ไม่พบข้อมูลลูก</h1><p class="muted">บัญชีนี้ยังไม่ได้ผูกกับนักเรียนที่ระบุ</p><a class="button secondary" href="#home">กลับหน้าวันนี้</a></section>';
    } else if (route === 'child' || route === 'childSection') {
      const data = s.read.children[id];
      if (detailChildId !== id) { detailChildId = id; detailMonth = s.read.today.slice(0, 7); expandedSavings = false; }
      const sectionTitle = section === 'profile' ? profileLabel(hasHealthData(loadedProfile(data?.profile))) : childSections[section];
      const title = section ? `${sectionTitle} · ${child.name}` : child.name;
      doc.title = `${title} — CRS MIS`;
      if (!section) {
        main.innerHTML = childHubMarkup(child, s);
      } else {
        let content, subtitle;
        if (section === 'attendance') {
          const terms = attendanceTerms(s.read.schoolDays, s.read.today);
          const term = selectedAttendanceTerm(terms, data?.attendanceView);
          content = `${attendanceTermChips(terms, term)}${attendanceSummaryMarkup(data?.attendance, s.read, term)}
            ${data && !data.attendance.loading && !data.attendance.error
              ? `<section class="data-card"><h2>ปฏิทินการมาเรียน</h2>${attendanceMarkup(data.attendance.rows, detailMonth, s.read.today, s.read.schoolDays)}</section>` : ''}
            <section class="data-card" aria-busy="${!data || data.leaves.loading || !!s.cancelBusyId}"><h2 id="leave-heading" tabindex="-1">ใบลา</h2><a class="button primary full" href="#leave/${encodeURIComponent(id)}">ยื่นใบลา</a>${leaveListMarkup(data?.leaves, s.cancelBusyId)}<p class="field-error" role="alert">${escapeHtml(s.cancelError)}</p><button type="button" id="reload-leaves" class="button secondary">โหลดรายการใบลาอีกครั้ง</button></section>
            ${subjectAttendanceMarkup(child, term, data)}`;
        } else if (section === 'grades') {
          const grades = data?.grades;
          const busy = hasAcademicReports(child) && (!grades || grades.terms.loading || !!grades.entries.get(grades.selected)?.loading);
          content = `<section class="data-card" aria-label="ผลการเรียน" aria-busy="${busy}">${gradesMarkup(child, grades)}</section>`;
        } else if (section === 'development') {
          content = developmentMarkup(data?.development);
        } else if (section === 'timetable') {
          const table = data?.timetable?.result;
          subtitle = [table?.classroom, table?.name].filter(Boolean).join(' · ') || child.name;
          content = timetableMarkup(data?.timetable, timetableDay);
        } else if (section === 'transport') {
          content = transportMarkup(data?.transport);
        } else if (section === 'money') {
          content = feeNoticesMarkup(data?.feeNotices) + `<section class="data-card" aria-busy="${!data || data.savings.loading || s.read.moneyLoading}"><h2>เงินออม</h2>${savingsMarkup(data?.savings, s.read.money, expandedSavings, s.read.moneyLoading)}</section>
            <section class="data-card" aria-busy="${!data || data.payments.loading}"><h2>ประวัติการชำระ</h2>${paymentsMarkup(data?.payments)}</section>`;
        } else {
          content = profileMarkup(data?.profile);
        }
        main.innerHTML = `<section class="child-section">${childSectionMarkup(child, sectionTitle, data, subtitle)}<div class="child-section-content">${content}</div></section>`;
      }
      if (data && ['', 'profile', 'grades', 'attendance', 'development', 'timetable', 'transport', 'money'].includes(section)) {
        void Promise.resolve().then(() => controller.loadChildPage(id, section));
      }
      main.querySelector('#retry-profile')?.addEventListener('click', () => { void controller.retryProfile(id); });
      main.querySelector('#retry-timetable')?.addEventListener('click', () => { void controller.retryTimetable(id); });
      main.querySelector('#retry-transport')?.addEventListener('click', () => { void controller.retryTransport(id); });
      main.querySelector('#retry-fee-notices')?.addEventListener('click', () => { void controller.retryFeeNotices(id); });
      main.querySelectorAll('[data-timetable-day]').forEach(button => button.addEventListener('click', () => {
        timetableDay = Number(button.dataset.timetableDay); controller.notify();
      }));
      main.querySelectorAll('[data-attendance-term]').forEach(button => button.addEventListener('click', () => {
        void controller.selectAttendanceTerm(id, button.dataset.attendanceTerm);
      }));
      main.querySelector('#retry-subject-attendance')?.addEventListener('click', () => { void controller.retrySubjectAttendance(id); });
      main.querySelectorAll('[data-grade-term]').forEach(button => button.addEventListener('click', () => {
        void controller.selectGradeTerm(id, button.dataset.gradeTerm);
      }));
      main.querySelector('#retry-grades')?.addEventListener('click', () => { void controller.loadGrades(id, { force: true }); });
      main.querySelectorAll('[data-development-term]').forEach(button => button.addEventListener('click', () => {
        void controller.selectDevelopmentTerm(id, button.dataset.developmentTerm);
      }));
      main.querySelector('#retry-development')?.addEventListener('click', () => { void controller.retryDevelopment(id); });
      main.querySelector('#reload-leaves')?.addEventListener('click', () => { void controller.loadLeaves(id); });
      main.querySelectorAll('.cancel-leave').forEach(button => button.addEventListener('click', async () => {
        const record = s.read.children[id];
        const accepted = await askLeaveConfirmation('ยกเลิกใบลา?', 'ใบลาที่ยกเลิกจะไม่ส่งให้ครูพิจารณาต่อ', 'ยกเลิกใบลา');
        if (accepted && state.read.children[id] === record) {
          await controller.cancelLeave(id, button.dataset.id);
          if (state.read.children[id] === record && win.location.hash === view) main.querySelector('#leave-heading')?.focus();
        }
      }));
      main.querySelector('#previous-month')?.addEventListener('click', () => { detailMonth = monthShift(detailMonth, -1); controller.notify(); });
      main.querySelector('#next-month')?.addEventListener('click', () => { detailMonth = monthShift(detailMonth, 1); controller.notify(); });
      main.querySelector('#expand-savings')?.addEventListener('click', () => { expandedSavings = !expandedSavings; controller.notify(); });
    } else if (route === 'leave') {
      doc.title = 'ยื่นใบลา — CRS MIS';
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
          if (state.session?.user.id === accountId && state.read.children[id] === record && !state.leaveDraft?.dirty && win.location.hash === `#leave/${encodeURIComponent(id)}`) win.location.hash = childHref(id) + '/attendance';
        } else if (state.leaveDraft === submittedDraft) {
          (main.querySelector('#leave-errors') || main.querySelector('#leave-error'))?.focus();
        }
      });
      main.querySelector('#leave-error').tabIndex = -1;
      main.querySelectorAll('#leave-errors a').forEach(link => link.addEventListener('click', event => {
        event.preventDefault(); main.querySelector(link.getAttribute('href'))?.focus();
      }));
    } else if (route === 'calendar') {
      doc.title = 'ปฏิทิน — CRS MIS';
      main.innerHTML = `<section class="screen-page"><p class="eyebrow">CRS MIS</p><h1 tabindex="-1">ปฏิทิน</h1><div aria-busy="${s.read.calendar.loading}">${calendarMarkup(s.read.calendar)}</div></section>`;
    } else if (route === 'account') {
      doc.title = 'บัญชี — CRS MIS';
      main.innerHTML = `<section class="screen-page account-screen"><p class="eyebrow">CRS MIS</p><h1 tabindex="-1">บัญชี</h1>
        <div class="account-card"><span class="account-avatar">${icon('account')}</span><div><h2>บัญชีที่ใช้อยู่</h2><p class="account-email">${escapeHtml(s.session.user.email || 'ไม่พบอีเมลของบัญชี')}</p></div></div>
        <h2 class="section-title">ลูกที่ผูกกับบัญชี</h2><ul class="linked-children">${s.children.map((child, index) => `<li><span class="avatar tone-${childTone(index)}" aria-hidden="true">${escapeHtml(childInitials(child.name))}</span><div><strong>${escapeHtml(child.name)}</strong><p>คุณเป็น ${escapeHtml(child.relation)}</p></div></li>`).join('')}</ul>
        <a class="privacy-link" href="./privacy.html">นโยบายความเป็นส่วนตัว</a>
        <div class="signout-section"><button id="sign-out" class="button signout full" ${s.signoutBusy ? 'disabled' : ''}>${s.signoutBusy ? `${busyIcon()}กำลังออก…` : 'ออกจากระบบ'}</button></div></section>`;
      main.querySelector('#sign-out').addEventListener('click', controller.signOut);
    }
    main.querySelectorAll('.retry-data').forEach(button => button.addEventListener('click', () => { void controller.loadData(); }));
    main.querySelectorAll('details').forEach((detail, index) => { detail.open = openDetails[index] || false; });
    if (focusRoute) {
      main.querySelector('h1')?.focus();
      win.scrollTo(0, returningHome ? homeScroll : returningHub ? hubScroll.get(id) || 0 : 0);
    }
    else if (activeId || activeHeading || activeHref) {
      const target = activeId ? doc.getElementById(activeId) : activeHeading ? main.querySelector('h1')
        : [...(activeInNav ? nav : doc).querySelectorAll('a')].find(link => link.getAttribute('href') === activeHref);
      if (target && !target.disabled) {
        target.focus({ preventScroll: true });
        if (selection) target.setSelectionRange(...selection);
      } else if (activeId === 'previous-month' || activeId === 'next-month') {
        main.querySelector('.month-controls h3')?.focus({ preventScroll: true });
      } else if (activeId === 'retry-subject-attendance') {
        main.querySelector('#subject-attendance-heading')?.focus({ preventScroll: true });
      } else if (activeId === 'retry-development') {
        (main.querySelector('[data-development-term][aria-pressed="true"]') || main.querySelector('h1'))?.focus({ preventScroll: true });
      } else if (activeId === 'retry-timetable' || activeId === 'retry-transport' || activeId === 'retry-fee-notices') {
        main.querySelector('h1')?.focus({ preventScroll: true });
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
    selectedChildId = null; filterAccountId = null; lastChildId = null; hubScroll.clear();
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
