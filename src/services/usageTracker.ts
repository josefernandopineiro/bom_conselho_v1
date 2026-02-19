export type UsageEventName =
  | 'upload_success'
  | 'upload_failed'
  | 'report_pdf_generated'
  | 'report_docx_generated'
  | 'minutes_pdf_generated'
  | 'minutes_docx_generated'
  | 'reports_zip_generated';

export interface UsageEvent {
  name: UsageEventName;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UsageTracker {
  track(event: UsageEvent): void;
  list(): UsageEvent[];
}

const USAGE_STORAGE_KEY = 'usageMetrics';

class LocalStorageUsageTracker implements UsageTracker {
  track(event: UsageEvent): void {
    if (typeof window === 'undefined') {
      return;
    }

    const events = this.list();
    events.push(event);
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(events));
  }

  list(): UsageEvent[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const rawValue = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export const usageTracker: UsageTracker = new LocalStorageUsageTracker();

export const createUsageEvent = (
  name: UsageEventName,
  metadata?: UsageEvent['metadata'],
): UsageEvent => ({
  name,
  timestamp: new Date().toISOString(),
  metadata,
});
