'use strict';
import * as path from 'path'
import * as vscode from 'vscode';
import {Region, Lines, View, Glyph, Application} from 'vscode-extension-common'

export function register(context: vscode.ExtensionContext) {
    const matchesLabel = `${Glyph.SEARCH} Matches`
    const treeManager = View.makeTreeViewManager(context, 'navigation');

    const config = vscode.workspace.getConfiguration("navigator.view")
    const LIMIT_RECENT       = config.get('recent.limit')
    const LIMIT_MATCHES      = config.get('matches.limit')
    const RECENT_EDIT_RANGE  = config.get('recent.range') as number

    const levelsRoot = View.addTreeItem(treeManager.rootTreeItem, {label: 'Line Levels',  id: 'levels', collapsibleState: vscode.TreeItemCollapsibleState.Expanded})
    const recentRoot = View.addTreeItem(treeManager.rootTreeItem, {label: 'Recent Edits', id: 'recent', collapsibleState: vscode.TreeItemCollapsibleState.Expanded})

    Application.registerCommand(context, 'navigator.view.matches.add', () => {
        Region.selectionsOrMatchesOrWordSelectionInDocument(vscode.window.activeTextEditor)
              .then(addMatchesSectionToTree)
    });

    function addMatchesSectionToTree(ranges: vscode.Range[]) {
        let countMatches = 0;
        treeManager.removeTreeItems(treeManager.rootTreeItem, treeItem => {
           if (treeItem.contextValue === 'matches') countMatches++
           return countMatches >= LIMIT_MATCHES
        })
        addMatchesSubTree(treeManager.rootTreeItem, ranges);
        treeManager.update()
        treeManager.revealItem(treeManager.findTreeItem(treeItem => treeItem.contextValue === 'matchline' && treeItem.metadata && treeItem.metadata.line === vscode.window.activeTextEditor.selection.active.line))
        // TODO 
        // vscode.commands.executeCommand()  // need command that can give focus to the tree view
        // https://github.com/Microsoft/vscode/issues/49311
    }

    Application.registerCommand(context, 'navigator.view.removeItem', (item: View.TreeItemActionable) => {
        const itemIndex = item.parent.children.indexOf(item)
        item.parent.children.splice(itemIndex, 1)
        treeManager.update()
    });

    vscode.window.onDidChangeTextEditorSelection(event=> {
        // clear decorators if we click in the editor
        View.setLineDecorators(vscode.window.activeTextEditor, View.makeDecoratorLineAttention(), [])
        // set the line levels in the tree
        setLevelsSubTree(levelsRoot)
        treeManager.update()
    })

    View.watchEditors(event => {
        if (adjustMarkersBasedOnEdits(treeManager, event)) treeManager.update()
        // if line within range of already recorded, skip
        // don't make an entry for every edit that is close together
        if (isWithinRecentRangeButNotSameLine(recentRoot.children, event.document, event.editChanges[0].range.start.line, RECENT_EDIT_RANGE)) return
    
        // don't create entries for new empty lines
        if (!event.editChanges[0].text.match(/[^\s^\t]/)) return 

        treeManager.removeTreeItems(recentRoot, (treeItem, index) => {
            // remove items beyond our limit
            if (index >= LIMIT_RECENT) return true
            // editing same line already recorded, then replace the line
            else if (treeItem.metadata.document === event.document && treeItem.metadata.line === event.editChanges[0].range.start.line) return true
            // do not remove
            else false
         })

         // update the recent edits section
        addRecentsSubTree(recentRoot, event.editChanges.map(change => change.range) )
        treeManager.update()
    })
}

interface TreeItemCodeLine extends View.TreeItemActionable {
    metadata: {document: vscode.TextDocument, line: number}
}

function adjustMarkersBasedOnEdits(treeManager: View.ITreeViewManager, changeEvent: View.DocumentWatchEvent): boolean {
    let madeChanges = false
    for (const edit of changeEvent.editChanges) {
        if (edit.linesDeltaCount === 0) continue // no changes. skip to next
        treeManager.forEachTreeItem((treeItem: LineItem) => {
            if (treeItem.contextValue !== 'matchline' && treeItem.contextValue !== 'recentline') return
            if (changeEvent.document !== treeItem.metadata.document) return
            if (edit.linesStart > treeItem.metadata.line) return
            if (edit.linesStart === treeItem.metadata.line && edit.charStart > treeItem.metadata.firstVisibleChar) return
            treeItem.metadata.line += edit.linesDeltaCount
            madeChanges = true
        })
    }
    return madeChanges
}

function isWithinRecentRangeButNotSameLine(recents: View.TreeItemActionable[], document: vscode.TextDocument, line: number, editRange: number) {
    if (!recents) return false
    const existingRecentWithinRange = recents.find(recent => document === recent.metadata.document && Math.abs(recent.metadata.line - line) <= editRange && (recent.metadata.line - line) != 0)
    return typeof existingRecentWithinRange === 'object'
}

async function showLine(lineReference: LineReference) {
    const linePosition = new vscode.Position(lineReference.line, 0);
    const editor = await vscode.window.showTextDocument(lineReference.document, vscode.window.activeTextEditor.viewColumn, true)
    await editor.revealRange(new vscode.Range(linePosition, linePosition), vscode.TextEditorRevealType.InCenterIfOutsideViewport)
    View.setLineDecorators(editor, View.makeDecoratorLineAttention(), [lineReference.document.lineAt(lineReference.line)])
}

export function addMatchesSubTree(parent: View.TreeItemActionable, ranges: vscode.Range[]) {
    const currentDocument = vscode.window.activeTextEditor.document
    const matchesNode = View.addTreeItem(parent, {
        label: `Matches ${Glyph.TRI_DOT_HORIZONTAL} ` + documentName(currentDocument) + ` ${Glyph.TRI_DOT} ` + currentDocument.getText(ranges[0]),
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        contextValue: 'matches'
    }, children => children.findIndex(item => item.id === 'recent') + 1) // add after recent

    Lines.linesFromRanges(currentDocument, ranges)
         .sort((l1, l2) => l1.lineNumber - l2.lineNumber)
         .forEach(line => addTreeItemForLine(matchesNode, currentDocument, line, 'matchline'))
}

function addRecentsSubTree(parent: View.TreeItemActionable, ranges: vscode.Range[]) {
    const currentDocument = vscode.window.activeTextEditor.document

    Lines.linesFromRanges(currentDocument, ranges)
         .sort((l1, l2) => l1.lineNumber - l2.lineNumber)
         .forEach(line => addTreeItemForRecentEdit(parent, currentDocument, line))
}

function setLevelsSubTree(parent: View.TreeItemActionable) {
    const cursorLine = vscode.window.activeTextEditor.selection.anchor.line
    const currentDocument = vscode.window.activeTextEditor.document
    const tabSize = vscode.window.activeTextEditor.options.tabSize
    const linesByLevel = Lines.findLinesByLevelToRoot(currentDocument, cursorLine, +tabSize)

    // clear current levels
    parent.children = []
    // add items for each parent level
    // TODO - need separate context value for these line references
    linesByLevel.sort((l1, l2) => l1.lineNumber - l2.lineNumber)
                .forEach(line => addTreeItemForLine(parent, currentDocument, line, 'levelline'))
}

type LineReference = {document: vscode.TextDocument, line: number, text: string, firstVisibleChar: number}
interface LineItem extends View.TreeItemActionable {
    metadata: LineReference
}

function addTreeItemForRecentEdit(parent: View.TreeItemActionable, document: vscode.TextDocument, line: vscode.TextLine) {
    const labelResolver:View.TreeItemUpdateRender = item => {
        const builder = View.makeLabelHighlightBuilder()
        item.label = builder.t(documentName(item.metadata.document)).t(` ${Glyph.TRI_DOT_VERTICAL} ` + (item.metadata.line + 1) + ` ${Glyph.TRI_DOT_VERTICAL} `).label()
        item.description = item.metadata.text
    }
    makeTreeLineItem(parent, document, line, 0, 'recentline', labelResolver)
}

function addTreeItemForLine(parent: View.TreeItemActionable, document: vscode.TextDocument, line: vscode.TextLine, contextValue: string) {
    const labelResolver =  (item: LineItem) => {
        item.label = (item.metadata.line + 1) + ` ${Glyph.TRI_DOT_VERTICAL} `
        item.description = item.metadata.text 
    }
    makeTreeLineItem(parent, document, line, -1, contextValue, labelResolver)
}

function makeTreeLineItem(parent: View.TreeItemActionable, document: vscode.TextDocument, line: vscode.TextLine, position:number, contextValue, labelResolver: View.TreeItemUpdateRender) {
    const lineReference:LineReference = {document, line: line.lineNumber, text: line.text.trim(), firstVisibleChar: line.firstNonWhitespaceCharacterIndex}
    View.addTreeItem(parent, {
        updateRender:  labelResolver,
        command: Application.makeCommandProxy(showLine, lineReference),
        contextValue,
        metadata: lineReference
    }, position)  
}

function documentName(document: vscode.TextDocument) {
    return path.basename(document.fileName)
}