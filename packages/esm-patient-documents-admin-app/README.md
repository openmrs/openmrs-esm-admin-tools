# Patient Documents Admin Module

The `esm-patient-documents-admin-app` package provides the admin configuration UI for the
[patientdocuments](https://github.com/openmrs/openmrs-module-patientdocuments) backend module.
It adds a card to the System Administration page and a page where administrators can:

- Toggle visit summary PDF sections on or off
- Reorder sections
- Save the configuration (persisted as `report.visitSummary.section.<key>.enabled` / `.order` global properties)
- Preview the visit summary PDF generated with the saved configuration
