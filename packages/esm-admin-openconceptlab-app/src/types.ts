export interface Subscription {
  uuid: string;
  url: string;
  token: string;
  subscribedToSnapshot?: boolean;
  validationType?: 'NONE' | 'FULL';
}

export interface Import {
  uuid: string;
  localDateStarted: Date;
  localDateStopped: Date;
  importTime: string;
  errorMessage: string;
  importProgress: number;
  allItemsCount: number;
  errorItemsCount: number;
  ignoredErrorsCount: number;
  updatedItemsCount: number;
  upToDateItemsCount: number;
  retiredItemsCount: number;
  unretiredItemsCount: number;
  status: string;
}
