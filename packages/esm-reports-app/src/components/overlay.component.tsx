import React from 'react';
import { Header } from '@carbon/react';
import { ArrowLeft, Close } from '@carbon/react/icons';
import { useLayoutType } from '@openmrs/esm-framework';
import { closeOverlay, useOverlay } from '../hooks/useOverlay';
import styles from './overlay.scss';
import { IconButton } from '@carbon/react';
import { t } from 'i18next';
import classNames from 'classnames';

const Overlay: React.FC = () => {
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
                onClick={() => closeOverlay()}
                kind="ghost"
                label={t('close', 'Close')}
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
