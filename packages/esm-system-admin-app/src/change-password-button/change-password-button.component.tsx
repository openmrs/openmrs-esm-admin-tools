import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SwitcherItem } from '@carbon/react';
import { Settings } from '@carbon/react/icons';
import { showModal } from '@openmrs/esm-framework';
import styles from './change-password-button.scss';

export interface ChangePasswordLinkProps {}

const ChangePasswordLink: React.FC<ChangePasswordLinkProps> = () => {
  const { t } = useTranslation();

  const launchChangePasswordModal = useCallback(() => {
    showModal('change-password-modal');
  }, []);

  return (
    <>
      <SwitcherItem aria-label="Switcher Container">
        <div className={styles.changePasswordButton} role="button" onClick={launchChangePasswordModal} tabIndex={0}>
          <Settings size={20} />
          <p>{t('changePassword', 'Change Password')}</p>
        </div>
      </SwitcherItem>
    </>
  );
};

export default ChangePasswordLink;
