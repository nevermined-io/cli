#!/usr/bin/env node
import './cli'
import * as log4js from 'log4js'

export const logger = log4js.getLogger()
logger.level = 'debug'
