const path = require("path");
const webpack = require('webpack');
const fs = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const readWholeDir = require("./readwholedir.js");

const packageJSON = require("./package.json");
let VERSION = packageJSON.version;
let BUILD = packageJSON.build;

function addToVersion(version, number = 1) { // dumb
    let zeros = version.split(".");
    for(let i = 0; i < zeros.length; i++) if(zeros[i] != 0) {
        zeros = zeros.slice(0, i).join(".");
        break;
    }
    return zeros + "." + (+version.split(".").join("") + number).toString().split("").join(".");
}

const srcDir = path.resolve(__dirname, "src");

module.exports = async (env = {}) => {
    const PRODUCTION_BUILD = !!env.production;

    if (PRODUCTION_BUILD) packageJSON.version = VERSION = addToVersion(VERSION);
    

    /*const BUILD = +(await fs.readFile("./build.txt", {encoding: "utf8"})) + 1;
    await fs.writeFile("./build.txt", BUILD.toString());*/

    packageJSON.build = ++BUILD;

    await fs.writeFile("./package.json", JSON.stringify(packageJSON, null, 2));

    const config = {
        mode: PRODUCTION_BUILD ? "production" : "development",
        devtool: PRODUCTION_BUILD ? undefined : "source-map",
        entry: {
            client_out: path.resolve(srcDir, "ts", "main.ts")
        },
        devServer: {
            static: {
              directory: path.resolve(__dirname, 'build'),
              
            },
            watchFiles: ['src/**/*.ts', 'build/**/*'],
          },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, 'build'),
            publicPath: PRODUCTION_BUILD ? '/' : './'
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json']
        },
        module: {
            rules: [
            {
                include: path.resolve(srcDir, 'ts'),
                loader: 'ts-loader',
              },
            {
                include: path.resolve(srcDir, 'fonts'),
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: 'fonts/',
                        name: '[name].[ext]'
                    }
                }]
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [{
                    loader: 'file-loader',
                    options: {
                        outputPath: 'img/',
                        name: '[name].[ext]'
                    }
                }]
            }
            ]
    
        },
    
        plugins: [
            new ForkTsCheckerWebpackPlugin(),
            new HtmlWebpackPlugin({
                title: 'cursors.io client by mathias377', // Cursors
                inject: 'body',
                template: path.resolve(srcDir, 'index.ejs'),
                favicon: path.resolve(srcDir, 'favicon.ico'),
                minify: PRODUCTION_BUILD ? {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                    minifyCSS: true
                  } : {}
            }),
            new webpack.EnvironmentPlugin({
                PRODUCTION_BUILD,
                BUILD,
                VERSION,
                SRC_FILES: await readWholeDir(srcDir)
            })
        ]
    };

    if(PRODUCTION_BUILD || env.devclean) {
        console.log(`Cleaning build dir: '${config.output.path}'`);
        await fs.remove(config.output.path);
    }

    console.log(`${config.mode} build\nVersion: ${VERSION}\nBuild: ${BUILD}\n`);

    return config;
}