
const path = require("path");
const webpack = require('webpack');
const fs = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');


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
        
        console.log("release build\n");
    } else {
        if (env.devclean) {
            console.log(`Cleaning build dir: '${config.output.path}'`);
            await fs.remove(config.output.path);
        }
        
        config.mode = "development";
        config.devtool = "source-map";
        
        console.log("development build\n");
    }
    config.output.publicPath = './'; // change that later
    config.plugins.push(new webpack.DefinePlugin({
        'PRODUCTION_BUILD': JSON.stringify(!!env.release)
    }));

    let build = +(await fs.readFile("./build.txt", {encoding: "utf8"})) + 1;
    await fs.writeFile("./build.txt", build);
    console.log("build " + build);
    
    return config;
}