'use strict';
import * as vscode from 'vscode';
import * as edit from 'vscode-extension-common'

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('navigator.skipSpaceUp', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const line = edit.nextPositionUpWithTextRightOfPosition(textEditor, selection.anchor.line, selection.anchor.character);
        textEditor.selection = new vscode.Selection(line.line, line.character, line.line, line.character);
        textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.Default);        
    });
    context.subscriptions.push(disposable);
    
    disposable = vscode.commands.registerCommand('navigator.skipSpaceDown', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const line = edit.nextPositionDownWithTextRightOfPosition(textEditor, selection.anchor.line, selection.anchor.character);
        textEditor.selection = new vscode.Selection(line.line, line.character, line.line, line.character);
        textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.Default);        
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('navigator.contiguousSpaceUp', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;        
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('navigator.contiguousSpaceDown', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;        
    });
    context.subscriptions.push(disposable);
 
    disposable = vscode.commands.registerCommand('navigator.fixedSpaceUp', () => {
        Array.from(Array(10).keys()).forEach(() => vscode.commands.executeCommand("cursorUp"));
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('navigator.fixedSpaceDown', () => {
        Array.from(Array(10).keys()).forEach(() => vscode.commands.executeCommand("cursorDown"));        
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('navigator.fixedSpaceRight', () => {
        Array.from(Array(10).keys()).forEach(() => vscode.commands.executeCommand("cursorRight"));
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('navigator.fixedSpaceLeft', () => {
        Array.from(Array(10).keys()).forEach(() => vscode.commands.executeCommand("cursorLeft"));
    });
    context.subscriptions.push(disposable);

}

export function deactivate() {
}