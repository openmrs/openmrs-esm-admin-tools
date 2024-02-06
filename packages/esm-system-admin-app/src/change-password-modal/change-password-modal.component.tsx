import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalBody, ModalFooter, ModalHeader, Tile, PasswordInput, Form, Layer } from '@carbon/react';
import { navigate, showSnackbar } from '@openmrs/esm-framework';
import styles from './change-password-modal.scss';
import { performPasswordChange } from './change-password-model.resource';

interface ChangePasswordModalProps {
  close(): void;
}

export default function ChangePasswordModal({ close }: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const oldPasswordInputRef = useRef<HTMLInputElement>(null);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [newPasswordError, setNewPasswordErr] = useState('');
  const [oldPasswordError, setOldPasswordErr] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isOldPasswordInvalid, setIsOldPasswordInvalid] = useState<boolean>(true);
  const [isNewPasswordInvalid, setIsNewPasswordInvalid] = useState<boolean>(true);
  const [isConfirmPasswordInvalid, setIsConfirmPasswordInvalid] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleValidation = useCallback(
    (passwordInputValue, passwordInputFieldName) => {
      if (passwordInputFieldName === 'newPassword') {
        const uppercaseRegExp = /(?=.*?[A-Z])/;
        const lowercaseRegExp = /(?=.*?[a-z])/;
        const digitsRegExp = /(?=.*?[0-9])/;
        const minLengthRegExp = /.{8,}/;
        const passwordLength = passwordInputValue.length;
        const uppercasePassword = uppercaseRegExp.test(passwordInputValue);
        const lowercasePassword = lowercaseRegExp.test(passwordInputValue);
        const digitsPassword = digitsRegExp.test(passwordInputValue);
        const minLengthPassword = minLengthRegExp.test(passwordInputValue);
        let errMsg = '';
        if (passwordLength === 0) {
          errMsg = t('passwordRequired', 'Your password cannot be blank. Please enter a password.');
        } else if (!uppercasePassword) {
          errMsg = t('atLeastOneUppercaseLetterRequired', 'Your password must contain at least one uppercase letter (A-Z)');
        } else if (!lowercasePassword) {
          errMsg = t('atLeastOneLowercaseLetterRequired', 'Your password must contain at least one lowercase letter (a-z)');
        } else if (!digitsPassword) {
          errMsg = t('atLeastOneNumberRequired', 'Your password must include at least one number (0-9).');
        } else if (!minLengthPassword) {
          errMsg = t('minCharacterLengthRequired', 'Your password must contain at least 8 characters.');
        } else if (passwordInput.oldPassword.length > 0 && passwordInput.newPassword === passwordInput.oldPassword) {
          errMsg = t('newPasswordMustNotBeTheSameAsOld', 'New password must not be the same as password');
        } else {
          errMsg = '';
          setIsNewPasswordInvalid(false);
        }
        setNewPasswordErr(errMsg);
      } else if (
        passwordInputFieldName === 'confirmPassword' ||
        (passwordInputFieldName === 'newPassword' && passwordInput.confirmPassword.length > 0)
      ) {
        if (passwordInput.confirmPassword !== passwordInput.newPassword) {
          setConfirmPasswordError(t('confirmPasswordMustBeTheSameAsNew', 'Confirm password must be the same as new'));
        } else {
          setConfirmPasswordError('');
          setIsConfirmPasswordInvalid(false);
        }
      } else {
        if (passwordInput.newPassword.length > 0 && passwordInput.newPassword === passwordInput.oldPassword) {
          setOldPasswordErr(t('oldPasswordMustNotBeTheSameAsNew', 'Old password must not be the same as new'));
        } else {
          setOldPasswordErr('');
          setIsOldPasswordInvalid(false);
        }
      }
    },
    [passwordInput.confirmPassword, passwordInput.newPassword, passwordInput.oldPassword, t],
  );

  useEffect(() => {
    if (passwordInput.oldPassword !== '') {
      handleValidation(passwordInput.oldPassword, 'oldPassword');
    }
    if (passwordInput.newPassword !== '') {
      handleValidation(passwordInput.newPassword, 'newPassword');
    }
    if (passwordInput.confirmPassword !== '') {
      handleValidation(passwordInput.confirmPassword, 'confirmPassword');
    }
  }, [handleValidation, passwordInput]);

  const handlePasswordChange = (event) => {
    const passwordInputValue = event.target.value.trim();
    const passwordInputFieldName = event.target.name;
    const NewPasswordInput = { ...passwordInput, [passwordInputFieldName]: passwordInputValue };
    setPasswordInput(NewPasswordInput);
  };

  const handleSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      setIsSavingPassword(true);
      performPasswordChange(passwordInput.oldPassword, passwordInput.confirmPassword)
        .then(() => {
          close();
          navigate({ to: `\${openmrsSpaBase}/logout` });
          showSnackbar({
            isLowContrast: true,
            kind: 'success',
            subtitle: t('userPasswordUpdated', 'User password updated successfully'),
            title: t('userPassword', 'User password'),
          });
        })
        .catch((error) => {
          setIsSavingPassword(false);
          showSnackbar({
            title: t('invalidPasswordCredentials', 'Invalid password provided'),
            kind: 'error',
            isLowContrast: false,
            subtitle: error?.message,
          });
        });
    },
    [close, passwordInput.confirmPassword, passwordInput.oldPassword, t],
  );

  return (
    <>
      <ModalHeader closeModal={close} title={t('changePassword', 'Change Password')} />
      <ModalBody>
        <Tile>
          <Form onSubmit={handleSubmit} ref={formRef}>
            <div className={styles['input-group']}>
              <Layer>
                <PasswordInput
                  id="oldPassword"
                  invalid={oldPasswordError.length > 0}
                  invalidText={oldPasswordError}
                  labelText={t('oldPassword', 'Old Password')}
                  name="oldPassword"
                  value={passwordInput.oldPassword}
                  onChange={handlePasswordChange}
                  ref={oldPasswordInputRef}
                  required
                  showPasswordLabel="Show old password"
                />
              </Layer>
              <Layer>
                <PasswordInput
                  id="newPassword"
                  invalid={newPasswordError.length > 0}
                  invalidText={newPasswordError}
                  labelText={t('newPassword', 'New Password')}
                  name="newPassword"
                  value={passwordInput.newPassword}
                  onChange={handlePasswordChange}
                  ref={newPasswordInputRef}
                  required
                  showPasswordLabel="Show new password"
                />
              </Layer>
              <Layer>
                <PasswordInput
                  id="confirmPassword"
                  invalid={confirmPasswordError.length > 0}
                  invalidText={confirmPasswordError}
                  labelText={t('confirmPassword', 'Confirm Password')}
                  name="confirmPassword"
                  value={passwordInput.confirmPassword}
                  onChange={handlePasswordChange}
                  ref={confirmPasswordInputRef}
                  required
                  showPasswordLabel="Show confirm password"
                />
              </Layer>
            </div>
          </Form>
        </Tile>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={close}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSavingPassword || isNewPasswordInvalid || isConfirmPasswordInvalid || isOldPasswordInvalid}
        >
          {t('updatePassword', 'Update Password')}
        </Button>
      </ModalFooter>
    </>
  );
}
