#!/usr/bin/env node
import './cli'

const log4js = require('log4js')
export const logger = log4js.getLogger()
logger.level = 'debug'
