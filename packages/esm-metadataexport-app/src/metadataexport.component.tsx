import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, Tile } from '@carbon/react';
import styles from './metadataexport.scss';

const Metadataexport: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Layer>
        <Tile className={styles.tile}>
          <h1 className={styles.heading}>{t('metadataexportHeading', 'Metadataexport')}</h1>
          <p className={styles.content}>{t('metadataexportDescription', 'Welcome to the Metadataexport page.')}</p>
        </Tile>
      </Layer>
    </div>
  );
};

export default Metadataexport;
