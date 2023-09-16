#!/usr/bin/env node

const fs = require('fs')
const refParser = require('@apidevtools/json-schema-ref-parser')
const jt = require('@tsmx/json-traverse')

const { program, Option } = require('commander')
program
  .name('add-props-flipflop')
  .version(process.env.npm_package_version || '0.0.1')
  .requiredOption('-s, --source <source>', 'Source OpenAPI spec filename')
  .requiredOption('-o, --output <output>', 'Output OpenAPI spec filename')
  .option('-d, --dereferenced <dereferenced>', 'Write dereferenced source OpenAPI spec to this filename')
  .addOption(new Option('-f, --flipto <flipto>', 'set additionalProperties to this value').choices(['true', 'false']))
program.parse(process.argv)
const options = program.opts()

const sourceSpecFilename = options.source
const outputSpecFilename = options.output
const dereferencedSpecFilename = options.dereferenced
const setToValue = options.flipto === 'true' || false

;
(async function () {
  await Promise.resolve(flipFlopAddProp(sourceSpecFilename, outputSpecFilename, dereferencedSpecFilename, setToValue))
}())

async function flipFlopAddProp (sourceSpecFilename, outputSpecFilename, dereferencedSpecFilename, setToValue) {
  if (!fs.existsSync(sourceSpecFilename) || !fs.lstatSync(sourceSpecFilename).isFile()) {
    console.error(`OpenAPI spec ${sourceSpecFilename} does not exist!`)
    return
  }

  const spec = await dereference(sourceSpecFilename)

  if (dereferencedSpecFilename) {
    console.log(`Writing dereferenced source OpenAPI spec to ${dereferencedSpecFilename}`)
    writeSpec(spec, dereferencedSpecFilename)
  }

  traverse(spec, setToValue)

  console.log(`Writing output OpenAPI spec to ${outputSpecFilename}`)
  writeSpec(spec, outputSpecFilename)
}

const writeSpec = (spec, writePath) => {
  try {
    fs.writeFileSync(writePath, JSON.stringify(spec, null, 2))
  } catch (err) {
    console.error(err)
  }
}

async function dereference (specFilename) {
  try {
    const spec = await refParser.dereference(specFilename)
    console.log(`Parsed schema file ${specFilename}`)
    return spec
  } catch (err) {
    console.error(err)
  }
}

function setAdditionalProperties (spec, path, value) {
  let location = spec
  for (const pathElement of path) {
    if (location[pathElement]) {
      location = location[pathElement]
    } else {
      console.error(`INVALID PATH ${path}`)
    }
  }
  location.additionalProperties = value
}

let currentLevel
const levelStacks = []

function traverse (spec, allowAdditionalProperties) {
  console.log('Scanning OpenAPI spec...')
  const callbacks = {
    processValue: (key, value, level, path, isObjectRoot, isArrayElement, cbSetValue) => {
      if (key.toLowerCase() === 'type' && (typeof value === 'string' || value instanceof String) && value.toLowerCase() === 'object') {
        currentLevel.hasObjectType = true
        currentLevel.objectTypePath = path
      }
      if (key.toLowerCase() === 'additionalproperties' && (typeof value === 'boolean' || value instanceof Boolean)) {
        currentLevel.hasAdditionalProperties = true
        currentLevel.additionalPropertiesIsCorrect = (value === allowAdditionalProperties)
      }
    },
    enterLevel: (level, path) => {
      // store current context?
      if (currentLevel) {
        levelStacks.push(currentLevel)
      }
      currentLevel = {
        hasObjectType: false,
        objectTypePath: '',
        hasAdditionalProperties: false,
        additionalPropertiesIsCorrect: false
      }
    },
    exitLevel: (level, path) => {
      if (currentLevel.hasObjectType) {
        if (!currentLevel.hasAdditionalProperties) {
          console.log(`Adding additionalProperties: ${allowAdditionalProperties} to ${currentLevel.objectTypePath}`)
          setAdditionalProperties(spec, currentLevel.objectTypePath, allowAdditionalProperties)
        } else if (currentLevel.additionalPropertiesIsCorrect) {
          // console.log(`ADDITIONAL PROPERTIES IS CORRECT FOR ${currentLevel.objectTypePath}`)
        } else {
          console.log(`Setting additionalProperties: ${allowAdditionalProperties} for ${currentLevel.objectTypePath}`)
          setAdditionalProperties(spec, currentLevel.objectTypePath, allowAdditionalProperties)
        }
      }

      // restore any previous level
      if (levelStacks.length > 0) {
        currentLevel = levelStacks.pop()
      } else {
        currentLevel = undefined
      }
    }
  }

  jt.traverse(spec, callbacks)
  console.log('Scanning complete')
}
