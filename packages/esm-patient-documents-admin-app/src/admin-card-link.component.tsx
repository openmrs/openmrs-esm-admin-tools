import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, ClickableTile } from '@carbon/react';
import { ArrowRightIcon } from '@openmrs/esm-framework';
import styles from './admin-card-link.scss';

const VisitSummaryConfigCardLink: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Layer>
      <a className={styles.cardLink} href={`${window.spaBase}/visit-summary-config`}>
        <ClickableTile>
          <div>
            <div className="heading">{t('cardLinkHeading', 'Manage Visit Summary')}</div>
            <div className="content">{t('cardLinkContent', 'Visit Summary Sections')}</div>
          </div>
          <div className="iconWrapper">
            <ArrowRightIcon size={16} />
          </div>
        </ClickableTile>
      </a>
    </Layer>
  );
};

export default VisitSummaryConfigCardLink;
