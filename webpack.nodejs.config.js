const baseConfig = require('./node_modules/@scrypted/sdk/webpack.nodejs.config.js');

if (!baseConfig.externals) {
    baseConfig.externals = {};
}
baseConfig.externals['cpu-features'] = 'commonjs cpu-features';

module.exports = baseConfig;
