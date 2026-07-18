export interface VisitSummarySection {
  sectionKey: string;
  label: string;
  enabled: boolean;
  order: number;
  toggleable: boolean;
}

export interface SystemSetting {
  uuid: string;
  value: string;
}
