const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        entry: './src/index.ts',
        output: {
            filename: '[name].[contenthash].js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
            publicPath: isProduction ? './' : '/'
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource'
                },
                {
                    test: /\.(wav|mp3|ogg)$/i,
                    type: 'asset/resource'
                }
            ]
        },
        resolve: {
            extensions: ['.ts', '.js']
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: 'index.html',
                inject: 'body'
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { 
                        from: 'assets',
                        to: 'assets'
                    }
                ]
            })
        ],
        devServer: {
            static: [
                {
                    directory: path.join(__dirname, 'assets'),
                    publicPath: '/assets'
                }
            ],
            hot: true,
            compress: true,
            port: 8080,
            host: '0.0.0.0',
            client: {
                overlay: {
                    errors: true,
                    warnings: false
                }
            }
        },
        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            }
        },
        performance: {
            hints: false
        }
    };
};
