import React, { type KeyboardEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRightIcon, navigate } from '@openmrs/esm-framework';

const metadataExportUrl = `${window.spaBase}/metadataexport`;

// Navigate client-side on a plain left click; modified clicks fall through
// to the anchor so they open a new tab or window as usual.
function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    navigate({ to: metadataExportUrl });
  }
}

const MetadataExportCardLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <ClickableTile href={metadataExportUrl} onClick={handleClick}>
        <div>
          <div className="heading">{t('cardLinkHeading', 'Manage Metadata Export')}</div>
          <div className="content">{t('cardLinkContent', 'Metadata Export Packages')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRightIcon size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};

export default MetadataExportCardLink;
