'use strict';
import * as vscode from 'vscode';
import {Region, View} from 'vscode-extension-common'

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

    const treeManager = View.makeTreeViewManager(context, 'navigation');

    disposable = vscode.commands.registerCommand('navigator.view.save.matches', () => {
        Region.matchesAsSelections(vscode.window.activeTextEditor)
        .then(selections=> {
            treeManager.rootTreeItem.children = selections.map(selection => makeTreeItemFromSelection(selection))
            treeManager.update()
        })
    });
    context.subscriptions.push(disposable);
}

export function makeTreeItemFromSelection(selection: vscode.Selection) {
    return {
        label:  selection.anchor.line + ` ${Glyph.TRIANGLE_RIGHT_SMALL} ` + vscode.window.activeTextEditor.document.lineAt(selection.anchor.line).text,
        command: {title: 'reveal', command: 'revealLine', arguments: [{lineNumber:selection.anchor.line}]},
        //iconPath: View.makeIconPaths('location')
    }
}

namespace Glyph {
    export const ARROW_RIGHT = '\u{279c}'
    export const CIRLCE_SOLID = '\u{2b24}'
    export const CIRLCE_DOTTED = '\u{25cc}'
    export const SQUARE_SOLID = '\u2b1c'
    export const HEXAGON_SOLID = '\u{2b23}'
    export const TRIANGLE_RIGHT_SMALL = '\u{25b9}'
    export const CIRCLE_MODIFY = '\u{20dd}' 
}

export function deactivate() {
}