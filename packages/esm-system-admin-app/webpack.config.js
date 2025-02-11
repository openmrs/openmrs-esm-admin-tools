// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const config = (module.exports = require('openmrs/default-webpack-config'));
config.overrides.resolve = {
  extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss', '.json'],
  alias: {
    '@tools': path.resolve(__dirname, 'tools/'),
  },
};
module.exports = config;
