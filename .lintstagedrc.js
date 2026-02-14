const lintsStageConfig = {
  '*.{js,ts}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `npm run lint --fix ${filenames.join(' ')}`
  ]
}

export default lintsStageConfig
