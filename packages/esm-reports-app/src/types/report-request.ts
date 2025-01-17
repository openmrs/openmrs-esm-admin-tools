export interface ReportRequest {
  uuid: string;
  schedule: string;
  renderingMode: {
    argument: string;
  };
  parameterMappings: any;
}
