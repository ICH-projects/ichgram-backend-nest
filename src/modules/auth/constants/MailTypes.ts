export enum MAIL_TYPES {
  SignupConfirmation = 'signupConfirmation',
  ResetPasswordConfirmation = 'resetPasswordConfirmation',
  ChangeOldEmailConfirmation = 'changeOldEmailConfirmation',
  SetNewEmailConfirmation = 'setNewEmailConfirmation',
  DeleteConfirmation = 'deleteConfirmation',
}

export const mailTemplates: {
  [key in MAIL_TYPES]: { template: string; link: string };
} = {
  signupConfirmation: {
    template: 'signup-confirmation-mail',
    link: `auth/confirm-email`,
  },
  resetPasswordConfirmation: {
    template: 'reset-password-confirmation-mail',
    link: `auth/reset-password`,
  },
  changeOldEmailConfirmation: {
    template: 'change-old-email-confirmation-mail',
    link: `auth/confirm`,
  },
  setNewEmailConfirmation: {
    template: 'set-new-email-confirmation-mail',
    link: `auth/confirm`,
  },
  deleteConfirmation: {
    template: 'delete-confirmation-mail',
    link: `auth/confirm`,
  },
} as const;
