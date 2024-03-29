module.exports = {
	entry: [
		'./src/index.ts'
	],
	target: 'node',
	node: {
		__dirname: false,
		__filename: false,
	},
	module: {
		rules: [
			{
				test: /.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		]
	},
	resolve: {
		extensions: ['.ts', '.js'],
		alias: {
			'@': require('path').resolve(__dirname, 'src'),
		},
	},
	output: {
		filename: 'index.js'
	},
	experiments: {
		topLevelAwait: true,
	}
};
