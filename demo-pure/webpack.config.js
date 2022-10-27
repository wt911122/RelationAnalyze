 const path = require('path');
 const HtmlWebpackPlugin = require('html-webpack-plugin');

 module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, './demo1.js'),
    resolve: {
        modules: [path.resolve(__dirname, '../node_modules'), path.resolve(__dirname, '../node_modules/@joskii/jflow/node_modules')],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './index.html')
        }),
    ],
 };