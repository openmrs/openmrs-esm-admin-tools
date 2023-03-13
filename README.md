:wave:	*New to our project? Be sure to review the [OpenMRS 3 Frontend Developer Documentation](https://openmrs.github.io/openmrs-esm-core/#/). You may find the [Map of the Project](https://openmrs.github.io/openmrs-esm-core/#/main/map) especially helpful.* :teacher:	

![Node.js CI](https://github.com/openmrs/openmrs-esm-admin-tools/workflows/Node.js%20CI/badge.svg)

# OpenMRS ESM Admin Tools

## What is this?

openmrs-esm-admin-tools provides microfrontends for various administrative functions and administrative modules in the OpenMRS ecosystem. It provides tools to allow admin users to effectively manage their 3.x installation without needing to drop to the v1 console.

Please note that at this time, these microfrontends currently aren't deployed or running anywhere.

## Setup

See the guidance in the [Developer Documentation](https://o3-dev.docs.openmrs.org/#/getting_started/prerequisites).
This repository uses Yarn and Lerna.

To start the dev server for a specific package, run

```bash
yarn start --sources 'packages/esm-admin-<package>-app'
```

This will start a dev server for that package.

To start a dev server running all the packages, run

```bash
yarn start-all
```

Note that this is very much not recommended.

## How do I configure this module?

Please see the [Implementer Documentation](https://wiki.openmrs.org/display/projects/Frontend+3.0+Documentation+for+Implementers#Frontend3.0DocumentationforImplementers-Configuringtheapplication)
for information about configuring modules.

## Deployment

See the
[Frontend Implementer Documentation](https://wiki.openmrs.org/display/projects/Frontend+3.0+Documentation+for+Implementers)
for information about adding microfrontends to a distribution.
