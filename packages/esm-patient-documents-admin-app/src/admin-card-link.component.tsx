import React, { type KeyboardEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRightIcon, navigate } from '@openmrs/esm-framework';

const configUrl = `${window.spaBase}/visit-summary-config`;

// Navigate client-side on a plain left click; modified clicks fall through
// to the anchor so they open a new tab or window as usual.
function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    navigate({ to: configUrl });
  }
}

const VisitSummaryConfigCardLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <ClickableTile href={configUrl} onClick={handleClick}>
        <div>
          <div className="heading">{t('cardLinkHeading', 'Manage Visit Summary')}</div>
          <div className="content">{t('cardLinkContent', 'Visit Summary Sections')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRightIcon size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};

export default VisitSummaryConfigCardLink;
