
var webpack = require("webpack"),
    path = require("path"),
    fileSystem = require("fs"),
    CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin,
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    WriteFilePlugin = require("write-file-webpack-plugin"),
    TerserPlugin = require("terser-webpack-plugin");

var fileExtensions = ["png"];

var options = {
  mode: 'production',
  entry: {
    main: path.join(__dirname, "src", "js", "main.js"),
    options: path.join(__dirname, "src", "js", "options.js"),
    background: path.join(__dirname, "src", "js", "background.js"),
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].bundle.js"
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          mangle: false,
          ecma: 6,
          output: { 
             ascii_only: true 
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: /node_modules/
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        loader: "file-loader?name=[name].[ext]",
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: require.resolve('@open-wc/webpack-import-meta-loader'),
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      },
      {
        test: /\.svg$/,
        loader: "raw-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(?:js|mjs|cjs)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }]
            ]
          }
        }
      },
      {
        test: /\.(?:js|mjs|cjs)$/,
        include: [
          path.resolve(__dirname, 'src'), 
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: "defaults" }]
            ],
            plugins: [
              [
                '@babel/plugin-proposal-optional-chaining'
              ],
              [
                '@babel/plugin-transform-nullish-coalescing-operator'
              ],
              [
                '@babel/plugin-transform-logical-assignment-operators'
              ],
              [
                '@babel/plugin-transform-private-property-in-object'
              ],
              [
                '@babel/plugin-proposal-class-properties'
              ],
              [
                '@babel/plugin-proposal-throw-expressions'
              ]
            ]
          }
        }
      }
    ]
  },
  resolve: {},
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false
    }),
    new CopyWebpackPlugin([{
      from: "src/manifest.json",
      transform: function (content, path) {
        return Buffer.from(JSON.stringify({
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
          ...JSON.parse(content.toString())
        }))
      }
    }]),
    new CopyWebpackPlugin([{
      from: "src/js/excalidraw/*.woff2",
      to: "fonts/[name].[ext]"
    }]),
    new CopyWebpackPlugin([{
      from: "src/options.html",
      to: "options.html"
    }]),
    new WriteFilePlugin()
  ]
};

module.exports = options;
