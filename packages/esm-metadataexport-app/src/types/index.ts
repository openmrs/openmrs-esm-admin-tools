export type MetadataDomain = string;

export interface ExportPackageEntryDto {
  domain: MetadataDomain;
  // Omitted to export every item in the domain.
  itemUuids?: Array<string>;
}

export interface MetadataItem {
  uuid: string;
  display: string;
  domain: MetadataDomain;
  retired: boolean;
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
  dateCreated: number;
  dateStarted: number | null;
  dateCompleted: number | null;
  errorMessage: string | null;
  downloadUrl: string | null;
  manifest: unknown | null;
}

export interface ExportPackage {
  uuid: string;
  name: string;
  description: string;
  retired: boolean;
  dateCreated: number;
  entries: Array<ExportPackageEntry>;
  latestBuild: ExportPackageBuild | null;
}
