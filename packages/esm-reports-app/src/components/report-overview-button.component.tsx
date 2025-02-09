import React from 'react';
import { Button } from '@carbon/react';
import styles from './reports.scss';

interface ReportOverviewButtonProps {
  shouldBeDisplayed: boolean;
  label: string;
  icon: any;
  reportRequestUuid: string;
  onClick: () => void;
}

const ReportOverviewButton: React.FC<ReportOverviewButtonProps> = ({ shouldBeDisplayed, label, icon, onClick }) => {
  if (shouldBeDisplayed) {
    return (
      <div className={styles.actionButtonsWrapperDiv}>
        <Button kind="ghost" renderIcon={icon} iconDescription={label} onClick={onClick} className={styles.actionButon}>
          {label}
        </Button>
      </div>
    );
  } else {
    return <div className={styles.actionButtonsWrapperDiv}></div>;
  }
};

export default ReportOverviewButton;
