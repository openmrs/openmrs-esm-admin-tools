import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';

const OpenConceptLabCardLink: React.FC = () => {
  const { t } = useTranslation();
  const header = t('manageConcepts', 'Manage Concepts');
  return (
    <Layer>
      <ClickableTile id={`clickable-tile-${header}`} href={`${window.spaBase}/ocl`} target="_blank" rel="no-refferer">
        <div>
          <div className="heading">{header}</div>
          <div className="content">{t('openConceptLab', 'Open Concept Lab')}</div>
        </div>
        <div className="iconWrapper">
          <ArrowRight size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};

export default OpenConceptLabCardLink;
