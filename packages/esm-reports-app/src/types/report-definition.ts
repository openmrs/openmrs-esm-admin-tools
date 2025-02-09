export interface ReportDefinition {
  uuid: string;
  name: string;
  description: string;
  parameters: ReportParameter[];
}

interface ReportParameter {
  name: string;
  label: string;
  type: string;
}
