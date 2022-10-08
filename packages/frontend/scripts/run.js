#!/usr/bin/env node

import chalk from 'chalk'
import { formatWebpackMessages } from './utils/format-webpack-messages.js'
import WebpackDevServer from 'webpack-dev-server'
import webpack from 'webpack'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import HtmlWebpackPlugin from 'html-webpack-plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isInteractive = process.stdout.isTTY

const clearConsole = () => {
  process.stdout.write(
    process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
  )
}

const printInstructions = () => {
  console.log()
  console.log("You can now view the template's frontend in the browser.")
  console.log()
  console.log('  http://localhost:9000')
  console.log()
  console.log('Note that the development build is not optimized.')
  console.log('To create a production build, use npm run build')
  console.log()
}

export const main = async () => {
  let compiler
  try {
    compiler = webpack({
      mode: 'development',
      infrastructureLogging: {
        level: 'none',
      },
      stats: 'none',
      entry: join(__dirname, '../playground/app.tsx'),
      resolve: {
        extensions: ['.ts', '.tsx', '...'],
      },
      module: {
        rules: [{ test: /\.tsx?$/, use: 'ts-loader' }],
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: join(__dirname, '../playground/index.html'),
        }),
      ],
    })
  } catch (err) {
    console.log(chalk.red('Failed to compile.'))
    console.log()
    console.log(err.message || err)
    console.log()
    process.exit(0)
  }

  compiler.hooks.invalid.tap('invalid', () => {
    if (isInteractive) clearConsole()
    console.log('Compiling...')
  })

  let isFirstCompile = true

  compiler.hooks.done.tap('done', async (stats) => {
    if (isInteractive) clearConsole()

    const statsData = stats.toJson({
      all: false,
      warnings: true,
      errors: true,
    })

    const messages = formatWebpackMessages(statsData)
    const isSuccessful = !messages.errors.length && !messages.warnings.length
    if (isSuccessful) console.log(chalk.green('Compiled successfully!'))
    if (isSuccessful && (isInteractive || isFirstCompile)) printInstructions()
    isFirstCompile = false

    if (messages.errors.length) {
      if (messages.errors.length > 1) messages.errors.length = 1
      console.log(chalk.red('Failed to compile.\n'))
      console.log(messages.errors.join('\n\n'))
      return
    }

    if (messages.warnings.length) {
      console.log(chalk.yellow('Compiled with warnings.\n'))
      console.log(messages.warnings.join('\n\n'))

      console.log(
        '\nSearch for the ' +
          chalk.underline(chalk.yellow('keywords')) +
          ' to learn more about each warning.'
      )
      console.log(
        'To ignore, add ' +
          chalk.cyan('// eslint-disable-next-line') +
          ' to the line before.\n'
      )
    }
  })

  const devServer = new WebpackDevServer(
    {
      port: 9000,
      open: true,
      compress: true,
    },
    compiler
  )
  await devServer.start()
  if (isInteractive) clearConsole()
  console.log(chalk.cyan('Starting the development server...\n'))
}

main().then().catch(console.error)
