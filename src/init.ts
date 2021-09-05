import { buildConfigFromPackageJson } from './packageJson'
import * as vscode from 'vscode'
import { RunButton } from './types'
import * as path from 'path'

const registerCommand = vscode.commands.registerCommand

const disposables: vscode.Disposable[] = []

const init = async (context: vscode.ExtensionContext) => {
  disposables.forEach(d => d.dispose())
  const config = vscode.workspace.getConfiguration('actionButtons')
  const defaultColor = config.get<string>('defaultColor') || 'white'
  const reloadButton = config.get<string>('reloadButton')
  const loadNpmCommands = config.get<boolean>('loadNpmCommands')
  const cmds = config.get<RunButton[]>('commands')
  const commands = []

  if (reloadButton !== null) {
    loadButton({
      vsCommand: 'extension.refreshButtons',
      name: reloadButton || '↻',
      color: defaultColor,
      command: 'Refreshes the action buttons',
    })
  } else {
    const onCfgChange: vscode.Disposable = vscode.workspace.onDidChangeConfiguration(
      e => {
        if (e.affectsConfiguration('actionButtons')) {
          vscode.commands.executeCommand('extension.refreshButtons')
        }
      }
    )
    context.subscriptions.push(onCfgChange)
    disposables.push(onCfgChange)
  }

  if (cmds && cmds.length) {
    commands.push(...cmds)
  }

  if (loadNpmCommands !== false) {
		commands.push(...(await buildConfigFromPackageJson(defaultColor)))
	}

  console.log({ commands })

  if (commands.length) {
    const terminals: { [name: string]: vscode.Terminal | null } = {}

    commands.forEach(
      ({ cwd, command, name, color, singleInstance, silent = false, clear = true }: RunButton) => {
        const vsCommand = `extension.${name.replace(' ', '')}`
				const rootPath = vscode.workspace.rootPath
				const editor = vscode.window.activeTextEditor
				const fileName = editor?.document.fileName

        const disposable = registerCommand(vsCommand, async () => {
          const vars = {
            // - the path of the folder opened in VS Code
            workspaceFolder: rootPath,

            // - the name of the folder opened in VS Code without any slashes (/)
            workspaceFolderBasename: rootPath ? path.basename(rootPath) : null,

            // - the current opened file
            file: fileName,

            // - the current opened file relative to workspaceFolder
            relativeFile: editor && rootPath ? path.relative(rootPath, fileName!) : null,

            // - the current opened file's basename
            fileBasename: editor ? path.basename(fileName!) : null,

            // - the current opened file's basename with no file extension
            fileBasenameNoExtension: editor ? path.parse(path.basename(fileName!)).name : null,

            // - the current opened file's dirname
            fileDirname: editor ? path.dirname(fileName!) : null,

            // - the current opened file's extension
            fileExtname: editor ? path.parse(path.basename(fileName!)).ext : null,

            // - the task runner's current working directory on startup
            cwd: cwd || rootPath || require('os').homedir(),

            //- the current selected line number in the active file
            lineNumber: editor ? editor.selection.active.line + 1 : null,

            // - the current selected text in the active file
            selectedText: editor ? editor.document.getText(editor.selection) : null,

            // - the path to the running VS Code executable
            execPath: process.execPath,
          }

          let assocTerminal = terminals[vsCommand]

					if (singleInstance && assocTerminal != null) {
            delete terminals[vsCommand]
						assocTerminal.dispose()
						assocTerminal = null
					}

					if (assocTerminal == null) {
            assocTerminal = vscode.window.createTerminal({ name, cwd: vars.cwd })
						terminals[vsCommand] = assocTerminal
          }

					silent || assocTerminal.show()
					clear && assocTerminal.sendText('clear')
					assocTerminal.sendText(interpolateString(command, vars))
        })

        context.subscriptions.push(disposable)

        disposables.push(disposable)

        loadButton({
          vsCommand,
          command,
          name,
          color: color || defaultColor,
        })
      }
    )
  } else {
    vscode.window.setStatusBarMessage(
      'VsCode Action Buttons: You have no run commands.',
      4000
    )
  }
}

function loadButton({ command, name, color, vsCommand }: RunButton) {
  const runButton = vscode.window.createStatusBarItem(1, 0)
  runButton.text = name
  runButton.color = color || 'white'
  runButton.tooltip = command

  runButton.command = vsCommand
  runButton.show()
  disposables.push(runButton)
}

function interpolateString(tpl: string, data: any): string {
  let re = /\$\{([^\}]+)\}/g
  let match
  while ((match = re.exec(tpl))) {
    let path = match[1].split('.').reverse()
    let obj = data[path.pop()!]
    while (path.length) {
			obj = obj[path.pop()!]
		}
    tpl = tpl.replace(match[0], obj)
  }
  return tpl
}

export default init
