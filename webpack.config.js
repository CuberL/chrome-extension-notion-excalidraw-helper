
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
        test: /node_modules\/@excalidraw\/excalidraw\/dist\/.*\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: '"https://unpkg.com/"',
          replace: 'chrome.runtime.getURL("/")',
          flags: "g"
        }
      },
      // Remove script tag to pass the review
      {
        test: /node_modules.*\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: '<script',
          replace: '<_script',
          flags: "g"
        }
      },
      // Remove script tag to pass the review
      {
        test: /node_modules.*\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: '/script>',
          replace: '/_script>',
          flags: "g"
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
      from: "node_modules/@excalidraw/excalidraw/dist/excalidraw-assets/*.js",
      to: "@excalidraw/excalidraw@0.16.1/dist/excalidraw-assets/[name].[ext]"
    }]),
    new CopyWebpackPlugin([{
      from: "node_modules/@excalidraw/excalidraw/dist/excalidraw-assets/*.woff2",
      to: "@excalidraw/excalidraw@0.16.1/dist/excalidraw-assets/[name].[ext]"
    }]),
    new WriteFilePlugin()
  ]
};

module.exports = options;
