import React from 'react';
import classNames from 'classnames';
import { IconButton, Header } from '@carbon/react';
import { ArrowLeft, Close } from '@carbon/react/icons';
import { useTranslation } from 'react-i18next';
import { useLayoutType } from '@openmrs/esm-framework';
import { closeOverlay, useOverlay } from '../hooks/useOverlay';
import styles from './overlay.scss';

const Overlay: React.FC = () => {
  const { t } = useTranslation();
  const { header, component, isOverlayOpen } = useOverlay();
  const layout = useLayoutType();

  return (
    <>
      {isOverlayOpen && (
        <div
          className={classNames({
            [styles.desktopOverlay]: layout !== 'tablet',
            [styles.tabletOverlay]: layout === 'tablet',
          })}
        >
          {layout === 'tablet' && (
            <Header onClick={() => closeOverlay()} aria-label="Tablet overlay" className={styles.tabletOverlayHeader}>
              <IconButton>
                <ArrowLeft size={16} />
              </IconButton>
              <div className={styles.headerContent}>{header}</div>
            </Header>
          )}

          {layout !== 'tablet' && (
            <div className={styles.desktopHeader}>
              <div className={styles.headerContent}>{header}</div>
              <IconButton
                className={styles.closePanelButton}
                kind="ghost"
                label={t('close', 'Close')}
                onClick={closeOverlay}
              >
                <Close size={16} />
              </IconButton>
            </div>
          )}
          {component}
        </div>
      )}
    </>
  );
};

export default Overlay;
