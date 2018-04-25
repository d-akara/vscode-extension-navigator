'use strict';
import * as vscode from 'vscode';
import {Region} from 'vscode-extension-common'

/**
 * - support custom tree views / palette lists
 * - recent edit locations in tree view
 * - all find matches/highlights in tree view
 * - all matching word under cursor
 * - all parent lines of current
 * - custom highlighting
 *   - duplicate lines or possibly show in palette and you can jump to them?
 * 
 */

const iconPaths = new Map<string, string>()

export function activate(context: vscode.ExtensionContext) {
    registerIcons(context)

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

    const treeItemRoot: TreeItemActionable = {
        label: 'root'
    }

    const emitter = registerTreeDataProvider(context, treeItemRoot);

    disposable = vscode.commands.registerCommand('navigator.view.save.matches', () => {
        Region.matchesAsSelections(vscode.window.activeTextEditor)
        .then(selections=> {
            treeItemRoot.children = selections.map(selection => makeTreeItemFromSelection(selection))
            emitter.fire( )
        })
    });
    context.subscriptions.push(disposable);
}

function registerTreeDataProvider(context: vscode.ExtensionContext, rootTreeItem: TreeItemActionable) {
    let selected;
    const emitter = new vscode.EventEmitter<string | null>();
    const provider = {
        onDidChangeTreeData: emitter.event,
        getChildren: element=> {
            const treeItemActionable = element as TreeItemActionable
            let children = rootTreeItem.children;
            if (element)
                children = treeItemActionable.children
            console.log('getting current selections' + children)
            if (!children) return;

            if (children instanceof Function)
                return Promise.resolve(children())
            else 
                return Promise.resolve(children)
        },
        getTreeItem: treeItem => treeItem
    }
    console.log('registering tree data')
    let disposable = vscode.window.registerTreeDataProvider('navigation', provider)
    context.subscriptions.push(disposable);

    return emitter;
}

function registerIcons(context: vscode.ExtensionContext) {
    iconPaths.set('selection.light', context.asAbsolutePath('icons/light/location.svg'))
    iconPaths.set('selection.dark',  context.asAbsolutePath('icons/dark/location.svg'))
}

function makeIconPath(iconId:string) {
    return {
        light: iconPaths.get(iconId + '.light'),
        dark: iconPaths.get(iconId + '.dark')
    }
}

export interface TreeItemActionable extends vscode.TreeItem {
    children?: TreeItemActionable[] | (()=>Thenable<TreeItemActionable[]>)
}


export function makeTreeItemFromSelection(selection: vscode.Selection) {
    return {
        label: selection.anchor.line + ' - ' + vscode.window.activeTextEditor.document.lineAt(selection.anchor.line).text,
        command: {title: 'reveal', command: 'revealLine', arguments: [{lineNumber:selection.anchor.line}]},
        iconPath: makeIconPath('selection')
    }
}


export function deactivate() {
}