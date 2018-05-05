'use strict';
import * as vscode from 'vscode';
import {Region, Lines, View, Glyph, Application} from 'vscode-extension-common'

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

    Application.registerInternalCommandProxy(context)

    Application.registerCommand(context, 'navigator.fixedSpaceUp', () => {
        Array.from(Array(5).keys()).forEach(() => vscode.commands.executeCommand("cursorUp"));
    });

    Application.registerCommand(context, 'navigator.fixedSpaceDown', () => {
        Array.from(Array(5).keys()).forEach(() => vscode.commands.executeCommand("cursorDown"));        
    });

    // move right until end of line
    Application.registerCommand(context, 'navigator.wordRightEnd', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const cursorIndex = selection.anchor.character;
        if (textEditor.document.lineAt(selection.anchor.line).text.length !== cursorIndex)
            vscode.commands.executeCommand("cursorWordRight");
    });

    // move left until begin of line
    Application.registerCommand(context, 'navigator.wordLeftBegin', () => {
        const textEditor = vscode.window.activeTextEditor;
        const selection = textEditor.selection;
        const cursorIndex = selection.anchor.character;
        if (cursorIndex !== 0)
            vscode.commands.executeCommand("cursorWordLeft");
    });

    const matchesLabel = `${Glyph.SEARCH} Matches`
    const treeManager = View.makeTreeViewManager(context, 'navigation', {children:[{id:'matches', label:matchesLabel, collapsibleState: vscode.TreeItemCollapsibleState.Collapsed}]});

    Application.registerCommand(context, 'navigator.view.save.matches', () => {
        Region.matchesAsSelections(vscode.window.activeTextEditor)
        .then(selections=> {
            const matchesSubTree = makeMatchesSubTree(selections);
            (treeManager.rootTreeItem.children as Array<vscode.TreeItem>).push(matchesSubTree)
            treeManager.update()
        })
    });
}

function showLine(lineNumber:number) {
    vscode.commands.executeCommand("revealLine", {lineNumber})
}

export function makeMatchesSubTree(selections: vscode.Selection[]) {
    const matchesNode = {
        label: `Matches ${Glyph.TRI_DOT_HORIZONTAL} ` + vscode.window.activeTextEditor.document.getText(selections[0]),
        children: []
    }

    let lines = Lines.linesFromRanges(vscode.window.activeTextEditor.document, selections)
    lines = lines.sort((l1, l2) => l1.lineNumber - l2.lineNumber)
    matchesNode.children = lines.map(line => makeTreeItemForLine(line))
    return matchesNode
}

export function makeTreeItemForLine(line: vscode.TextLine) {
    return {
        label:  (line.lineNumber + 1) + ` ${Glyph.TRI_DOT_VERTICAL} ` + line.text,
        command: Application.makeCommandProxy(showLine, line.lineNumber)
    }
}

export function deactivate() {
}