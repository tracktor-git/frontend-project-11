const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV ? process.env.NODE_ENV.trim() === 'production' : false;
const DIRNAME = __dirname;

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(DIRNAME, 'dist'),
    clean: true,
    filename: '[name].[hash].js',
  },
  devServer: {
    open: true,
    host: 'localhost',
  },
  plugins: [new HtmlWebpackPlugin({ template: 'index.html' }), new MiniCssExtractPlugin({ filename: '[name].[hash].css' })],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader'],
      },
      {
        test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: 'url-loader?limit=10000',
      },
      {
        test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
        use: 'file-loader',
      },
    ],
  },
};

module.exports = () => {
  config.mode = isProduction ? 'production' : 'development';
  return config;
};
