'use strict';
import * as path from 'path'
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
    const treeManager = View.makeTreeViewManager(context, 'navigation');

    const config = vscode.workspace.getConfiguration("navigator.view")
    const LIMIT_RECENT  = config.get('recent.limit')
    const LIMIT_MATCHES = config.get('matches.limit')

    View.addTreeItem(treeManager.rootTreeItem, {label: 'Recent Edits', id: 'recent', collapsibleState: vscode.TreeItemCollapsibleState.Expanded})

    Application.registerCommand(context, 'navigator.view.matches.add', () => {
        Region.selectionsOrMatchesOrWordSelectionInDocument(vscode.window.activeTextEditor)
        .then(ranges=> {
            let countMatches = 0;
            treeManager.removeTreeItems(treeManager.rootTreeItem, treeItem => {
               if (treeItem.contextValue === 'matches') countMatches++
               return countMatches >= LIMIT_MATCHES
            })
            addMatchesSubTree(treeManager.rootTreeItem, ranges);
            treeManager.update()
            treeManager.revealItem(treeManager.findTreeItem(treeItem => treeItem.metadata && treeItem.metadata.line === vscode.window.activeTextEditor.selection.active.line))
            // TODO 
            // vscode.commands.executeCommand()  // need command that can give focus to the tree view
            // https://github.com/Microsoft/vscode/issues/49311
        })
    });

    Application.registerCommand(context, 'navigator.view.matches.remove', (item: View.TreeItemActionable) => {
        const itemIndex = item.parent.children.indexOf(item)
        item.parent.children.splice(itemIndex, 1)
        treeManager.update()
    });
}

async function showLine(lineReference: {document: vscode.TextDocument, line: number}) {
    const linePosition = new vscode.Position(lineReference.line, 0);
    const editor = await vscode.window.showTextDocument(lineReference.document, vscode.window.activeTextEditor.viewColumn, true)
    await editor.revealRange(new vscode.Range(linePosition, linePosition), vscode.TextEditorRevealType.InCenterIfOutsideViewport)
    View.setLineDecorators(editor, View.makeDecoratorLineAttention(), [lineReference.document.lineAt(lineReference.line)])
}

export function addMatchesSubTree(parent: View.TreeItemActionable, ranges: vscode.Range[]) {
    const currentDocument = vscode.window.activeTextEditor.document
    const matchesNode = View.addTreeItem(parent, {
        label: `Matches ${Glyph.TRI_DOT_HORIZONTAL} ` + currentDocument.getText(ranges[0]) + ` ${Glyph.DASHES_STACKED} ` + documentName(currentDocument),
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        contextValue: 'matches'
    }, children => children.findIndex(item => item.id === 'recent') + 1) // add after recent

    Lines.linesFromRanges(currentDocument, ranges)
         .sort((l1, l2) => l1.lineNumber - l2.lineNumber)
         .forEach(line => addTreeItemForLine(matchesNode, currentDocument, line))
}

export function addTreeItemForLine(parent: View.TreeItemActionable, document: vscode.TextDocument, line: vscode.TextLine) {
    const lineReference = {document, line: line.lineNumber}
    View.addTreeItem(parent, {
        label:  (line.lineNumber + 1) + ` ${Glyph.TRI_DOT_VERTICAL} ` + line.text,
        command: Application.makeCommandProxy(showLine, lineReference),
        contextValue: 'matchline',
        metadata: lineReference
    })
}

function documentName(document: vscode.TextDocument) {
    return path.basename(document.fileName)
}

export function deactivate() {
}