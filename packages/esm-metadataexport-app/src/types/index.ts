export type MetadataDomain = string;

export interface ExportPackageEntryDto {
  domain: MetadataDomain;
}

export interface ExportPackageRequest {
  name: string;
  description: string;
  entries: Array<ExportPackageEntryDto>;
}

export interface ExportPackageEntry {
  domain: MetadataDomain;
  itemUuids: Array<string>;
}

export type ExportBuildStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ExportPackageBuild {
  uuid: string;
  packageUuid: string;
  version: number;
  status: ExportBuildStatus;
  dateCreated: string;
  dateStarted: string | null;
  dateCompleted: string | null;
  errorMessage: string | null;
  downloadUrl: string | null;
  manifest: unknown | null;
}

export interface ExportPackage {
  uuid: string;
  name: string;
  description: string;
  retired: boolean;
  dateCreated: string;
  entries: Array<ExportPackageEntry>;
  latestBuild: ExportPackageBuild | null;
}
