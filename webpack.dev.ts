const webpack = require('webpack');
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const path = require('path');
const common = require('./webpack.common.ts');

module.exports = merge(common, {
	mode: 'development',
	devtool: 'source-map',
	entry: [
		'webpack/hot/poll?100',
	],
	externals: [
		nodeExternals({
			whitelist: ['webpack/hot/poll?100']
		})
	],
	output: {
		path: path.join(__dirname, '.tmp'),
	},
	plugins: [new webpack.HotModuleReplacementPlugin()],
});
