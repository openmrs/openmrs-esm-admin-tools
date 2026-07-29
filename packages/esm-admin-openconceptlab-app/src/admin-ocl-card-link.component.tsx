import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRightIcon, ConfigurableLink } from '@openmrs/esm-framework';
import styles from './admin-ocl-card-link.scss';

const OpenConceptLabCardLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <ConfigurableLink className={styles.cardLink} to={`${window.spaBase}/ocl`}>
        <ClickableTile>
          <div>
            <div className="heading">{t('manageConcepts', 'Manage Concepts')}</div>
            <div className="content">{t('openConceptLab', 'Open Concept Lab')}</div>
          </div>
          <div className="iconWrapper">
            <ArrowRightIcon size={16} />
          </div>
        </ClickableTile>
      </ConfigurableLink>
    </Layer>
  );
};

export default OpenConceptLabCardLink;
