export default [
  {
    // "cwd": "/Users/lip/ss/dev", // Terminal initial folder ${workspaceFolder} and os user home as defaults
    name: 'test',
    singleInstance: true,
    command: `
      cd tests
      ./runtest.sh
      cd -
    `,
  }
]
