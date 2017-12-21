'use strict';
import * as vscode from 'vscode';
import * as edit from 'vscode-extension-common'

/**
 * - support custom tree views / palette lists
 * - custom highlighting
 *   - duplicate lines or possibly show in palette and you can jump to them?
 * 
 */


export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('navigator.fixedSpaceUp', () => {
        Array.from(Array(5).keys()).forEach(() => vscode.commands.executeCommand("cursorUp"));
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('navigator.fixedSpaceDown', () => {
        Array.from(Array(5).keys()).forEach(() => vscode.commands.executeCommand("cursorDown"));        
    });
    context.subscriptions.push(disposable);

    // move right until end of line
    disposable = vscode.commands.registerCommand('navigator.wordRightEnd', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const cursorIndex = selection.anchor.character;
        if (textEditor.document.lineAt(selection.anchor.line).text.length !== cursorIndex)
            vscode.commands.executeCommand("cursorWordRight");
    });
    context.subscriptions.push(disposable);

    // move left until begin of line
    disposable = vscode.commands.registerCommand('navigator.wordLeftBegin', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const cursorIndex = selection.anchor.character;
        if (cursorIndex !== 0)
            vscode.commands.executeCommand("cursorWordLeft");
    });
    context.subscriptions.push(disposable);

}

export function deactivate() {
}