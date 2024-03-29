export const mockSubscription = {
  url: 'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/1',
  token: 'Cff4906d8f4890fb08E287f6179781F6165C',
  subscribedToSnapshot: false,
  validationType: 'FULL',
};

export const mockPreviousImports = [
  {
    uuid: 'f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8',
    localDateStarted: new Date('2022-08-08T13:51:54.000+0000'),
    localDateStopped: new Date('2022-08-08T13:55:54.000+0000'),
    importTime: '8 seconds',
    importProgress: 100,
    errorMessage: null,
    allItemsCount: 0,
    addedItemsCount: 0,
    errorItemsCount: 0,
    ignoredErrorsCount: 0,
    updatedItemsCount: 0,
    upToDateItemsCount: 0,
    retiredItemsCount: 0,
    unretiredItemsCount: 0,
    status: '0 items fetched',
  },
  {
    uuid: 'c053762d-e4d5-4433-a0f4-30aad91e12ca',
    localDateStarted: new Date('2022-08-09T13:51:54.000+0000'),
    localDateStopped: new Date('2022-08-09T13:52:31.000+0000'),
    importTime: '37 seconds',
    importProgress: 100,
    errorMessage: 'Errors found',
    allItemsCount: 1016,
    addedItemsCount: 970,
    errorItemsCount: 44,
    ignoredErrorsCount: 0,
    updatedItemsCount: 0,
    upToDateItemsCount: 0,
    retiredItemsCount: 2,
    unretiredItemsCount: 0,
    status: 'Errors found',
  },
  {
    uuid: 'b8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8',
    localDateStarted: new Date('2022-08-10T13:51:54.000+0000'),
    localDateStopped: new Date('2022-08-10T13:52:31.000+0000'),
    importTime: '10 seconds',
    importProgress: 100,
    errorMessage: null,
    allItemsCount: 10,
    addedItemsCount: 9,
    errorItemsCount: 0,
    ignoredErrorsCount: 0,
    updatedItemsCount: 0,
    upToDateItemsCount: 0,
    retiredItemsCount: 1,
    unretiredItemsCount: 0,
    status: '9 items fetched',
  },
];

export const mockImportItems = [
  {
    uuid: 'f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8',
    errorMessage: 'Cannot save mapping /orgs/CIEL/sources/CIEL/mappings/234354',
    type: 'MAPPING',
    versionUrl:
      'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/1/items/f8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8',
    updatedOn: new Date('2022-08-07T13:51:54.000+0000'),
    state: 'ERROR',
  },
  {
    uuid: 'c053762d-e4d5-4433-a0f4-30aad91e12ca',
    errorMessage: 'Cannot save mapping /orgs/CIEL/sources/CIEL/mappings/345278',
    type: 'MAPPING',
    versionUrl:
      'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/1/items/c053762d-e4d5-4433-a0f4-30aad91e12ca',
    updatedOn: new Date('2022-08-07T13:51:54.000+0000'),
    state: 'ERROR',
  },
  {
    uuid: 'b8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8',
    errorMessage: 'Cannot save mapping /orgs/CIEL/sources/CIEL/mappings/338345',
    type: 'MAPPING',
    versionUrl:
      'https://api.openconceptlab.org/orgs/openmrs/collections/DemoQueueConcepts/1/items/b8f8f8f8-f8f8-f8f8-f8f8-f8f8f8f8f8f8',
    updatedOn: new Date('2022-08-07T13:51:54.000+0000'),
    state: 'ERROR',
  },
];
