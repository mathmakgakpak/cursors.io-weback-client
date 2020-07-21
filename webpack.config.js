
const path = require("path");
const webpack = require('webpack');
const fs = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const packageJSON = require("./package.json");
let VERSION = packageJSON.version;
function addToVersion(version, number = 1) { // dumb
    let zeros = version.split(".");
    for(let i = 0; i < zeros.length; i++) if(zeros[i] != 0) {
        zeros = zeros.slice(0, i).join(".");;
        break;
    }
    return zeros + "." + (+version.split(".").join("") + number).toString().split("").join(".");
}

const srcDir = path.resolve(__dirname, "src");

const config = {
    entry: {
        client_out: path.resolve(srcDir, "ts", "main.ts")
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, 'build'),
        publicPath: '/'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [/*{
            test: /\.(ts|js)x?$/,
            include: path.resolve(srcDir, 'ts'),
            loader: 'babel-loader',
            query: {
                presets: [
                    [
                        "@babel/preset-env",
                        {
                            //debug: true,
                            useBuiltIns: "usage",
                            corejs: 3
                        },
                    ],

                ]
            }
        },*/
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
            include: path.resolve(srcDir, 'img'),
            use: [{
                loader: 'file-loader',
                options: {
                    outputPath: 'img/',
                    name: '[name].[ext]'
                }
            }]
        },
        /*{
            include: path.resolve(srcDir, 'css'),
            use: [{
                loader: 'css-loader',
                options: {
                    importLoaders: 1
                }
            }, {
                loader: 'postcss-loader'
            }]
        }*/
        ]

    },

    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'cursors.io client by mathias377', // Cursors
            inject: 'head',
            template: path.resolve(srcDir, 'index.ejs'),
            favicon: path.resolve(srcDir, 'favicon.ico')
        }),
        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer'
        })
    ]
};

module.exports = async (env = {}) => {
    if (env.release) {
        config.mode = "production";
        config.output.filename = '[name].[hash].js';
        
        console.log(`Cleaning build dir: '${config.output.path}'`);
        await fs.remove(config.output.path);
        
        packageJSON.version = VERSION = addToVersion(VERSION);
        
        await fs.writeFile("./package.json", JSON.stringify(packageJSON, null, 2));
    } else {
        if (env.devclean) {
            console.log(`Cleaning build dir: '${config.output.path}'`);
            await fs.remove(config.output.path);
        }
        
        config.mode = "development";
        config.devtool = "source-map";
    }
    config.output.publicPath = './'; // change that later

    const BUILD = +(await fs.readFile("./build.txt", {encoding: "utf8"})) + 1;
    await fs.writeFile("./build.txt", BUILD);

    console.log(`${!!env.release ? "release" : "development"} build\nVersion: ${VERSION}\nBuild: ${BUILD}\n`);

    config.plugins.push(new webpack.DefinePlugin({
        PRODUCTION_BUILD: JSON.stringify(!!env.release),
        BUILD,
        VERSION: JSON.stringify(VERSION)
    }));

    
    return config;
}