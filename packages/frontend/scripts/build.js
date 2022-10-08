#!/usr/bin/env node

import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFile, rm } from 'fs/promises'
import { long as longCommitHash } from 'git-rev-sync'
import chalk from 'chalk'
import webpack from 'webpack'
import ora from 'ora'
import { createRequire } from 'module'
import TerserPlugin from 'terser-webpack-plugin'
import { formatWebpackMessages } from './utils/format-webpack-messages.js'

// TODO: support different React versions
const main = async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const require = createRequire(import.meta.url)

  const outDir = join(__dirname, '../dist')
  let spinner = ora()
  spinner.start(`Removing previous ${chalk.blue('dist')} folder`)
  await rm(outDir, { recursive: true, force: true })
  spinner.succeed(`Previous ${chalk.blue('dist')} folder removed`)

  spinner = ora()
  spinner.start(`Building ${chalk.blue('federated modules')}`)
  const commitHash = longCommitHash(join(__dirname, '../'))
  await new Promise((resolve, reject) => {
    webpack(
      {
        mode: 'production',
        devtool: false,
        entry: {
          [`${commitHash}creationForm`]: join(
            __dirname,
            '../src/set-public-path.ts'
          ),
          [`${commitHash}page`]: join(__dirname, '../src/set-public-path.ts'),
        },
        output: {
          filename: '[name].js',
          path: join(__dirname, '../dist'),
        },
        resolve: {
          extensions: ['.ts', '.tsx', '...'],
        },
        module: {
          rules: [{ test: /\.tsx?$/, use: 'ts-loader' }],
        },
        optimization: {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                format: {
                  comments: false,
                },
              },
              extractComments: false,
            }),
          ],
        },
        plugins: [
          new webpack.container.ModuleFederationPlugin({
            name: `${commitHash}creationForm`,
            library: { type: 'window', name: `${commitHash}creationForm` },
            exposes: {
              './component': join(__dirname, '../src/creation-form/index.tsx'),
              './i18n': join(__dirname, '../src/creation-form/i18n/index.ts'),
              './set-public-path': join(__dirname, '../src/set-public-path.ts'),
            },
            shared: {
              '@carrot-kpi/react': '^0.1.2',
              '@carrot-kpi/sdk': '^1.0.0',
              ethers: '^5.7.1',
              react: { requiredVersion: '^18.2.0', singleton: true },
              'react-dom': { requiredVersion: '^18.2.0', singleton: true },
              wagmi: '^0.6.7',
            },
          }),
          new webpack.container.ModuleFederationPlugin({
            name: `${commitHash}page`,
            library: { type: 'window', name: `${commitHash}page` },
            exposes: {
              './component': join(__dirname, '../src/page/index.tsx'),
              './i18n': join(__dirname, '../src/page/i18n/index.ts'),
              './set-public-path': join(__dirname, '../src/set-public-path.ts'),
            },
            shared: {
              '@carrot-kpi/react': '^0.1.2',
              '@carrot-kpi/sdk': '^1.0.0',
              ethers: '^5.7.1',
              react: { requiredVersion: '^18.2.0', singleton: true },
              'react-dom': { requiredVersion: '^18.2.0', singleton: true },
              wagmi: '^0.6.7',
            },
          }),
        ],
      },
      (error, stats) => {
        if (error) {
          spinner.fail('Failed to build federated modules')
          console.log()
          console.log(error.message || error)
          console.log()
          process.exit(0)
        }

        const statsData = stats.toJson({
          all: false,
          warnings: true,
          errors: true,
        })

        const messages = formatWebpackMessages(statsData)

        if (messages.errors.length) {
          if (messages.errors.length > 1) messages.errors.length = 1
          spinner.fail('Failed to build federated modules')
          console.log()
          console.log(messages.errors.join('\n\n'))
          process.exit(0)
        }

        if (messages.warnings.length) {
          spinner.warn('Federated modules built with warnings.')
          console.log()
          console.log(messages.warnings.join('\n\n'))
          resolve()
          return
        }

        spinner.succeed(`${chalk.blue('Federated modules')} built`)
        resolve()
      }
    )
  })

  spinner = ora(`Building ${chalk.blue('base.json')}`)
  const partialBase = require('../src/base.json')
  await writeFile(
    join(outDir, 'base.json'),
    JSON.stringify({
      ...partialBase,
      commitHash,
    })
  )
  spinner.succeed(`${chalk.blue('base.json')} built`)
}

main().then().catch(console.error)
