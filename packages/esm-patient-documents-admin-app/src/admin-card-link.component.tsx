import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRightIcon } from '@openmrs/esm-framework';

const VisitSummaryConfigCardLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <ClickableTile href={`${window.spaBase}/visit-summary-config`}>
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
