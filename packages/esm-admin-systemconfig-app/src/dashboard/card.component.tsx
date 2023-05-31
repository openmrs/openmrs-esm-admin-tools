import React from 'react';

import { Layer, TileProps, ClickableTile } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';

import styles from './card.scss';

export interface LinkCardProps extends TileProps {
  header: string;
  viewLink: string;
  children?: React.ReactNode;
}

export const LinkCard: React.FC<LinkCardProps> = ({ header, viewLink, children }) => {
  return (
    <Layer>
      <ClickableTile
        className={styles.overviewCard}
        id={`clickable-tile-${header}`}
        href={viewLink}
        target="_blank"
        rel="no-refferer"
      >
        <div>
          <div className={styles.heading}>{header}</div>
          <div className={styles.content}>{children}</div>
        </div>
        <div className={styles.iconWrapper}>
          <ArrowRight size={16} />
        </div>
      </ClickableTile>
    </Layer>
  );
};
