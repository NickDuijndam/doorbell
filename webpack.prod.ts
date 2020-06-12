const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.ts');

module.exports = merge(common, {
	mode: 'production',
	externals: [nodeExternals()],
	output: {
		path: path.join(__dirname, 'dist'),
	},
	plugins: [
	        new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
	],
});
