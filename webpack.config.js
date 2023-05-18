const path = require("path");
const webpack = require('webpack');
const fs = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { version: VERSION } = require("./package.json");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');






module.exports = async (env = {}) => {
    const srcDir = path.resolve(__dirname, "src");
    const isProductionBuild = !!env.production;
    const shouldCleanDist = isProductionBuild || env.shouldCleanDist;

    const BUILD_NUMBER = +(await fs.readFile("./build.txt", {encoding: "utf8"})) + 1;
    
    await fs.writeFile("./build.txt", BUILD_NUMBER.toString());
    

    const config = {
        mode: isProductionBuild ? "production" : "development",
        devtool: isProductionBuild ? "source-map" : "eval",
        entry: {
            client_out: path.resolve(srcDir, "ts", "main.ts")
        },

        devServer: {
            static: {
                directory: path.resolve(__dirname, 'dist'),

            },
            watchFiles: ['src/**/*.ts', 'dist/**/*'],
        },
        output: {
            filename: "[name].js",
            path: path.resolve(__dirname, 'dist'),
            publicPath: isProductionBuild ? '/' : './',
            clean: shouldCleanDist,
        },
        resolve: {
            extensions: ['*', '.ts', '.js', '.json'],
            fallback: { // https://webpack.js.org/configuration/resolve/#resolvefallback
                buffer: require.resolve('buffer'),
                events: require.resolve('events'),
            },
        },
        module: { // https://webpack.js.org/guides/asset-management/#loading-images
            rules: [
                
                {
                    include: path.resolve(srcDir, 'ts'),
                    loader: 'ts-loader',
                },
                {
                    test: /\.(css)$/, // https://stackoverflow.com/questions/53653652/how-to-force-webpack-to-put-the-plain-css-code-into-html-heads-style-tag
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                    ]
                },
                {
                    test: /\.(ttf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: "fonts/[name][ext]"
                    },
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: "img/[name][ext]"
                    },
                },
                
            ]

        },

        plugins: [
            new MiniCssExtractPlugin(),
            new ForkTsCheckerWebpackPlugin(),
            new HtmlWebpackPlugin({
                title: 'Modded cursors.io client', // Cursors
                inject: 'body',
                template: path.resolve(srcDir, 'index.html'),
                favicon: path.resolve(srcDir, 'favicon.ico'),
                minify: "auto"
            }),
            new webpack.EnvironmentPlugin({
                PRODUCTION_BUILD: isProductionBuild,
                BUILD_NUMBER,
                VERSION,
            })
        ]
    };

    if (config.output.clean) {
        console.log(`Cleaning build dir: '${config.output.path}'`);
    }

    console.log(`${config.mode} build\nVersion: ${VERSION}\nBuild: ${BUILD_NUMBER}\n`);

    return config;
}