const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.ts');

module.exports = merge(common, {
	mode: 'production',
	output: {
		path: path.join(__dirname, 'dist'),
	},
});
