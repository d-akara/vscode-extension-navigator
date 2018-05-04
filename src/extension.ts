'use strict';
import * as vscode from 'vscode';
import {Region, Lines, View} from 'vscode-extension-common'

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

export function activate(context: vscode.ExtensionContext) {
    View.registerIcons(context, 'icons')

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

    const matchesLabel = `${Glyph.SEARCH} Matches`
    const treeManager = View.makeTreeViewManager(context, 'navigation', {children:[{id:'matches', label:matchesLabel, collapsibleState: vscode.TreeItemCollapsibleState.Collapsed}]});

    disposable = vscode.commands.registerCommand('navigator.view.save.matches', () => {
        Region.matchesAsSelections(vscode.window.activeTextEditor)
        .then(selections=> {
            const matchesNode = treeManager.findTreeItem(item => item.id === 'matches')
            matchesNode.label = matchesLabel + ` ${Glyph.TRI_DOT_HORIZONTAL} ` + vscode.window.activeTextEditor.document.getText(selections[0])
            let lines = Lines.linesFromRanges(vscode.window.activeTextEditor.document, selections)
            lines = lines.sort((l1, l2) => l1.lineNumber - l2.lineNumber)
            matchesNode.children = lines.map(line => makeTreeItemFromSelection(line))
            treeManager.update()
        })
    });
    context.subscriptions.push(disposable);
}

export function makeTreeItemFromSelection(line: vscode.TextLine) {
    return {
        label:  (line.lineNumber + 1) + ` ${Glyph.TRI_DOT_VERTICAL} ` + line.text,
        command: {title: 'reveal', command: 'revealLine', arguments: [{lineNumber:line.lineNumber}]},
        //iconPath: View.makeIconPaths('location')
    }
}

namespace Glyph {
    export const CIRCLE_MODIFY = '\u{20dd}' 
    export const DOUBLE_TRIPLE_DASH = '\u{2637}'
    export const CIRCLE_DOT = '\u{2609}'
    export const CIRCLE_LARGE_DOT = '\u{25C9}'
    export const GEAR = '\u{2699}'
    export const TRI_DOT = '\u{2234}'
    export const TRI_DOT_VERTICAL = '\u{22ee}'
    export const TRI_DOT_HORIZONTAL = '\u{22ef}'
    export const DASHES_STACKED = '\u{254f}'
    export const SEARCH = '\u{1f50d}'
    export const TIMER = '\u{1f558}'
}

export function deactivate() {
}