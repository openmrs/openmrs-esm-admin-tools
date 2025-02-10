import React from 'react';
import classNames from 'classnames';
import { Header, IconButton } from '@carbon/react';
import { ArrowLeft, Close } from '@carbon/react/icons';
import { getCoreTranslation, useLayoutType } from '@openmrs/esm-framework';
import { closeOverlay, useOverlay } from '../hooks/useOverlay';
import styles from './overlay.scss';

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
            <Header aria-label="Tablet overlay" className={styles.tabletOverlayHeader} onClick={closeOverlay}>
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
                label={getCoreTranslation('close')}
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
