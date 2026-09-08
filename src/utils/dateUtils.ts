export const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = d.getFullYear() + 543; // BE
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export function formatDateTimeThai(dateTimeStr: string): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} เวลา ${hours}:${mins} น.`;
  } catch {
    return dateTimeStr;
  }
}

export type DeadlineUrgency = 'overdue' | 'due_today' | 'due_soon' | 'due_this_week' | 'normal' | 'completed';

export interface DeadlineAlertInfo {
  urgency: DeadlineUrgency;
  daysDiff: number; // positive = days remaining, negative = days overdue
  badgeText: string;
  badgeClass: string;
}

export function getDeadlineAlertInfo(deadlineDateStr: string, status: string): DeadlineAlertInfo {
  if (status === 'completed') {
    return {
      urgency: 'completed',
      daysDiff: 0,
      badgeText: 'เสร็จสิ้นแล้ว',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (!deadlineDateStr) {
    return {
      urgency: 'normal',
      daysDiff: 999,
      badgeText: 'ไม่ได้ระบุ',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  try {
    const deadline = new Date(deadlineDateStr);
    deadline.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        urgency: 'overdue',
        daysDiff: diffDays,
        badgeText: `🚨 เกินกำหนด ${overdueDays} วัน`,
        badgeClass: 'bg-rose-100 text-rose-700 border-rose-300 font-bold animate-pulse',
      };
    } else if (diffDays === 0) {
      return {
        urgency: 'due_today',
        daysDiff: 0,
        badgeText: '🔥 ถึงกำหนดส่งวันนี้!',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      };
    } else if (diffDays <= 3) {
      return {
        urgency: 'due_soon',
        daysDiff: diffDays,
        badgeText: `⏰ อีก ${diffDays} วันถึงกำหนด`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
      };
    } else if (diffDays <= 7) {
      return {
        urgency: 'due_this_week',
        daysDiff: diffDays,
        badgeText: `📅 อีก ${diffDays} วัน (สัปดาห์นี้)`,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
      };
    } else {
      return {
        urgency: 'normal',
        daysDiff: diffDays,
        badgeText: `อีก ${diffDays} วัน`,
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
      };
    }
  } catch {
    return {
      urgency: 'normal',
      daysDiff: 999,
      badgeText: deadlineDateStr,
      badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    };
  }
}

export function isTaskOverdue(deadlineStr: string, status: string): boolean {
  return getDeadlineAlertInfo(deadlineStr, status).urgency === 'overdue';
}

// Generate Timeline header months and weeks (Aug 2026 - Dec 2026)
export interface TimelineWeek {
  id: string; // e.g. "Aug-26-W1"
  label: string; // "W1"
  month: string; // "Aug-26"
  monthLabelThai: string; // "ส.ค. 69"
  startDate: Date;
  endDate: Date;
}

export interface TimelineMonth {
  id: string;
  name: string;
  nameThai: string;
  weeks: TimelineWeek[];
}

export function generateTimelineHeader(): { months: TimelineMonth[]; totalWeeks: TimelineWeek[] } {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Create 5-month timeline window based on current date
  const monthsData = [];
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 5; i++) {
    const d = new Date(currentYear, currentMonth + i, 1);
    const mIdx = d.getMonth();
    const yStr = String(d.getFullYear()).slice(2);
    const name = `${monthNamesEn[mIdx]}-${yStr}`;
    const nameThai = `${THAI_MONTHS_FULL[mIdx]} ${d.getFullYear() + 543}`;
    const weeksCount = 4;

    monthsData.push({
      id: name,
      name,
      nameThai,
      weeksCount,
      start: d,
    });
  }

  const months: TimelineMonth[] = [];
  const totalWeeks: TimelineWeek[] = [];

  monthsData.forEach((m) => {
    const weeks: TimelineWeek[] = [];
    for (let w = 1; w <= m.weeksCount; w++) {
      const weekStart = new Date(m.start);
      weekStart.setDate((w - 1) * 7 + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekObj: TimelineWeek = {
        id: `${m.id}-W${w}`,
        label: `W${w}`,
        month: m.name,
        monthLabelThai: m.nameThai,
        startDate: weekStart,
        endDate: weekEnd,
      };
      weeks.push(weekObj);
      totalWeeks.push(weekObj);
    }

    months.push({
      id: m.id,
      name: m.name,
      nameThai: m.nameThai,
      weeks,
    });
  });

  return { months, totalWeeks };
}

export function toLocalDateString(dateOrIso: string | Date | undefined): string {
  if (!dateOrIso) return '';
  if (typeof dateOrIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrIso)) {
    return dateOrIso;
  }
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
}

export function formatThaiTime(isoStr: string | undefined): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}
