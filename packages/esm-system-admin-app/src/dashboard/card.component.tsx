import React from 'react';
import { Layer, ClickableTile, type TileProps } from '@carbon/react';
import { ArrowRightIcon } from '@openmrs/esm-framework';
import styles from './card.scss';

export interface LinkCardProps extends TileProps {
  header: string;
  viewLink: string;
  children?: React.ReactNode;
}

// ClickableTile forwards extra props to its underlying anchor, but Carbon's
// ClickableTileProps type omits `target`, so pass it via a spread.
const newTabProps = { target: '_blank', rel: 'noopener noreferrer' };

export const LinkCard: React.FC<LinkCardProps> = ({ header, viewLink, children }) => {
  return (
    <Layer>
      <ClickableTile className={styles.overviewCard} href={viewLink} {...newTabProps}>
        <div>
          <div className={styles.heading}>{header}</div>
          <div className={styles.content}>{children}</div>
        </div>
        <div className={styles.iconWrapper}>
          <ArrowRightIcon size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};
