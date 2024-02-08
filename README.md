:wave:	*New to our project? Be sure to review the [OpenMRS 3 Frontend Developer Documentation](https://openmrs.github.io/openmrs-esm-core/#/). You may find the [Map of the Project](https://openmrs.github.io/openmrs-esm-core/#/main/map) especially helpful.* :teacher:	

![Node.js CI](https://github.com/openmrs/openmrs-esm-admin-tools/workflows/Node.js%20CI/badge.svg)

# OpenMRS ESM Admin Tools

## What is this?

openmrs-esm-admin-tools provides microfrontends for various administrative functions and administrative modules in the OpenMRS ecosystem. It provides tools to allow admin users to effectively manage their 3.x installation without needing to drop to the v1 console.

## How do I configure this module?

Please see the [Implementer Documentation](https://wiki.openmrs.org/display/projects/Frontend+3.0+Documentation+for+Implementers#Frontend3.0DocumentationforImplementers-Configuringtheapplication)
for information about configuring modules.

## Setup

See the guidance in the [Developer Documentation](https://o3-dev.docs.openmrs.org/#/getting_started/prerequisites).
This repository uses Yarn.

To start the dev server for a specific package, run

```bash
yarn start --sources 'packages/esm-<package>-app'
```

This will start a dev server for that package.

To start a dev server running all the packages, run

```bash
yarn start-all
```

Note that this is very much not recommended.

## Running tests

To run tests for all packages, run:

```bash
yarn turbo test
```

To run tests in `watch` mode, run:

```bash
yarn turbo test:watch
```

To run tests for a specific package, pass the package name to the `--filter` flag. For example, to run tests for `esm-patient-system-admin-app`, run:

```bash
yarn turbo test --filter="esm-system-admin-app"
```

To run a specific test file, run:

```bash
yarn turbo test -- dashboard
```

The above command will only run tests in the file or files that match the provided string.

You can also run the matching tests from above in watch mode by running:

```bash
yarn turbo test:watch -- dashboard
```

To generate a `coverage` report, run:

```bash
yarn turbo coverage
```

By default, `turbo` will cache test runs. This means that re-running tests wihout changing any of the related files will return the cached logs from the last run. To bypass the cache, run tests with the `force` flag, as follows:

```bash
yarn turbo test --force
```

### E2E tests

To set up environment variables for the project, follow these steps:

1. Create a copy of the .env.example file by running the following command:

  ```bash
  cp example.env .env
  ```
  
2. Open the newly created .env file in the root of the project.

3. Add the environment variables you need.

Note: These variables are currently only used for end-to-end tests.


To run E2E tests, make sure the dev server is running by using:

```sh
yarn start --sources 'packages/esm-*-app/'
```

Then, in a separate terminal, run:

```sh
yarn test-e2e --headed
```

Please read [our e2e docs](e2e/README.md) for more information about E2E testing.

## Deployment

See the
[Frontend Implementer Documentation](https://wiki.openmrs.org/display/projects/Frontend+3.0+Documentation+for+Implementers)
for information about adding microfrontends to a distribution.
