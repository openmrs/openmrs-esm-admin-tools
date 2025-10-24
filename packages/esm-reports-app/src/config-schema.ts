import { Type } from '@openmrs/esm-framework';

export const configSchema = {
  enableParameterValidation: {
    _type: Type.Boolean,
    _description: 'Whether to enable validation for required report parameters before running reports',
    _default: true,
  },
};

export type Config = {
  enableParameterValidation: boolean;
};
