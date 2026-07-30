import React, { type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRightIcon, navigate } from '@openmrs/esm-framework';

const oclUrl = `${window.spaBase}/ocl`;

// Navigate client-side on a plain left click; modified clicks fall through
// to the anchor so they open a new tab or window as usual.
function handleClick(event: MouseEvent) {
  if (event.button === 0 && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    navigate({ to: oclUrl });
  }
}

const OpenConceptLabCardLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <ClickableTile href={oclUrl} onClick={handleClick}>
        <div>
          <div className="heading">{t('manageConcepts', 'Manage Concepts')}</div>
          <div className="content">{t('openConceptLab', 'Open Concept Lab')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRightIcon size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};

export default OpenConceptLabCardLink;
