import * as vscode from 'vscode'
import init from './init'

export function activate(context: vscode.ExtensionContext) {
	init(context)

  let disposable = vscode.commands.registerCommand(
		'extension.refreshButtons',
		() => init(context)
	)

	context.subscriptions.push(disposable)
}

export function deactivate() {}
