import { openmrsFetch, Session, FetchResponse, openmrsObservableFetch } from '@openmrs/esm-framework';
import { Observable } from 'rxjs';
import useSWR from 'swr';
import moment from 'moment';
import { ReportDefinition } from '../types/report-definition';
import { ReportDesign } from '../types/report-design';
import { ReportRequest } from '../types/report-request';

interface ReportModel {
  reportName: string;
  status: string;
  requestedBy: string;
  requestedByUserUuid: string;
  requestedOn: string;
  outputFormat: string;
  parameters: any;
  id: string;
  evaluateCompleteDatetime: string;
  schedule: string;
}

interface ScheduledReportModel {
  reportDefinitionUuid: string;
  reportRequestUuid: string;
  name: string;
  schedule: string;
}

export interface RunReportRequest {
  existingRequestUuid?: string | undefined;
  reportDefinitionUuid: string;
  renderModeUuid: string;
  reportParameters: any;
  schedule?: string | undefined;
}

export function useLocations() {
  const apiUrl = `/ws/rest/v1/location?tag=Login+Location`;

  const { data } = useSWR<{ data: { results: Array<any> } }, Error>(apiUrl, openmrsFetch);

  return {
    locations: data ? data?.data?.results : [],
  };
}

export function useReports(statusesGroup: string, pageNumber: number, pageSize: number, sortBy?: string): any {
  const reportsUrl =
    `/ws/rest/v1/reportingrest/reportRequest?statusesGroup=${statusesGroup}&startIndex=${pageNumber}&limit=${pageSize}&totalCount=true` +
    (sortBy ? `&sortBy=${sortBy}` : '');

  const { data, error, isValidating, mutate } = useSWR<{ data: { results: Array<any>; totalCount: number } }, Error>(
    reportsUrl,
    openmrsFetch,
  );

  const reports = data?.data?.results;
  const totalCount = data?.data?.totalCount;
  const reportsArray: Array<any> = reports ? [].concat(...reports.map((report) => mapReportResults(report))) : [];

  return {
    reports: reportsArray,
    reportsTotalCount: totalCount,
    isError: error,
    isValidating: isValidating,
    mutateReports: mutate,
  };
}

export function useReportRequest(reportRequestUuid: string): any {
  const reportsUrl = `/ws/rest/v1/reportingrest/reportRequest/${reportRequestUuid}`;

  const { data, error, isValidating, mutate } = useSWR<{ data: ReportRequest }, Error>(reportsUrl, openmrsFetch);

  return {
    reportRequest: data?.data,
    isError: error,
    isValidating: isValidating,
    mutate,
  };
}

export function useScheduledReports(sortBy?: string): any {
  const scheduledReportsUrl = `/ws/rest/v1/reportingrest/scheduledReport` + (sortBy ? `?sortBy=${sortBy}` : '');

  const { data, error, isValidating, mutate } = useSWR<{ data: { results: Array<any> } }, Error>(
    scheduledReportsUrl,
    openmrsFetch,
  );

  const scheduledReports = data?.data?.results;
  const scheduledReportsArray: Array<any> = scheduledReports
    ? [].concat(...scheduledReports.map((report) => mapScheduledReportResults(report)))
    : [];

  return {
    scheduledReports: scheduledReportsArray,
    isError: error,
    isValidating: isValidating,
    mutateScheduledReports: mutate,
  };
}

export function useReportDefinitions() {
  const apiUrl = `/ws/rest/v1/reportingrest/reportDefinition?v=full`;

  const { data } = useSWR<{ data: { results: Array<ReportDefinition> } }, Error>(apiUrl, openmrsFetch);

  return {
    reportDefinitions: data ? data?.data?.results : [],
  };
}

export function useReportDefinition(reportDefinitionUuid: string): ReportDefinition {
  const apiUrl = `/ws/rest/v1/reportingrest/reportDefinition/${reportDefinitionUuid}?v=full`;

  const { data } = useSWR<{ data: ReportDefinition }, Error>(apiUrl, openmrsFetch);

  return data?.data;
}

export function useReportDesigns(reportDefinitionUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/designs?reportDefinitionUuid=${reportDefinitionUuid}`;

  const { data, error, isValidating, mutate } = useSWR<{ data: { results: ReportDesign[] } }, Error>(
    reportDefinitionUuid ? apiUrl : null,
    openmrsFetch,
  );

  return {
    reportDesigns: data?.data.results,
    isError: error,
    isValidating: isValidating,
    mutateReportDesigns: mutate,
  };
}

function mapDesignResults(design: any): ReportDesign {
  return {
    name: design.name,
    uuid: design.uuid,
  };
}

export function runReportObservable(
  payload: RunReportRequest,
  abortController: AbortController,
): Observable<FetchResponse<any>> {
  return openmrsObservableFetch(`/ws/rest/v1/reportingrest/runReport`, {
    signal: abortController.signal,
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: payload,
  });
}

export async function cancelReportRequest(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/cancelReport?reportRequestUuid=${reportRequestUuid}`;

  return openmrsFetch(apiUrl, {
    method: 'DELETE',
  });
}

export async function preserveReport(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/preserveReport?reportRequestUuid=${reportRequestUuid}`;

  return openmrsFetch(apiUrl, {
    method: 'POST',
  });
}

export async function downloadReport(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/downloadReport?reportRequestUuid=${reportRequestUuid}`;

  const { data } = await openmrsFetch<any>(apiUrl);

  return data;
}

export async function downloadMultipleReports(reportRequestUuids: string[]) {
  const apiUrl = `/ws/rest/v1/reportingrest/downloadMultipleReports?reportRequestUuids=${reportRequestUuids}`;

  const { data } = await openmrsFetch<any>(apiUrl);

  return data;
}

function mapReportResults(data: any): ReportModel {
  return {
    id: data.uuid,
    reportName: data.parameterizable.name,
    status: data.status,
    requestedBy: data.requestedBy.person.display,
    requestedByUserUuid: data.requestedBy.uuid,
    requestedOn: moment(data.requestDate).format('YYYY-MM-DD HH:mm'),
    outputFormat: data.renderingMode.label,
    parameters: convertParametersToString(data),
    evaluateCompleteDatetime: data.evaluateCompleteDatetime
      ? moment(data.evaluateCompleteDatetime).format('YYYY-MM-DD HH:mm')
      : undefined,
    schedule: data.schedule,
  };
}

function mapScheduledReportResults(data: any): ScheduledReportModel {
  return {
    reportDefinitionUuid: data.reportDefinition.uuid,
    reportRequestUuid: data.reportScheduleRequest?.uuid,
    name: data.reportDefinition.name,
    schedule: data.reportScheduleRequest?.schedule,
  };
}

function convertParametersToString(data: any): string {
  let finalString = '';
  const parameters = data.parameterizable.parameters;
  if (parameters.length > 0) {
    parameters.forEach((parameter) => {
      let value = data.parameterMappings[parameter.name];
      if (parameter.type === 'java.util.Date') {
        value = moment(value).format('YYYY-MM-DD');
      } else if (parameter.type === 'org.openmrs.Location') {
        value = value?.display;
      }
      finalString = finalString + parameter.label + ': ' + value + ', ';
    });

    finalString = finalString.trim();

    if (finalString.charAt(finalString.length - 1) === ',') {
      finalString = finalString.slice(0, -1);
    }
  }

  return finalString;
}
