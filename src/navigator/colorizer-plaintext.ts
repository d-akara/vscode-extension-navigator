import * as vscode from 'vscode';
import * as chroma from 'chroma-js'
import { ViewportDecorator, Lines, Region, Disposable } from 'vscode-extension-common'

export function activate(context: vscode.ExtensionContext, config): Disposable {
    const colors = chroma.scale(config.scale).mode(config.colorMode).gamma(config.gamma).colors(config.maxColors)
                         .map(color => chroma(color).brighten(config.brightness).hex())

    const decoratorContainer = ViewportDecorator.makeDecorationContainer()
    colors.forEach((color, index) => {
        decoratorContainer.addType(`color${index}`, {
            isWholeLine: true,
            color: color
        })
    });

    function indentationDecorator(activeEditor: vscode.TextEditor, line: number,  decorationContainer: ViewportDecorator.DecorationContainer) {
        let level = Lines.calculateLineTabSpacing(activeEditor, line)
        if (Math.trunc(level) !== level) return // don't process fractional levels
        level-- // make zero index based. 
        const lineRange = Region.makeRangeLineText(activeEditor.document.lineAt(line))
        const colorNum = level % colors.length
        decorationContainer.addDecorator(`color${colorNum}`, lineRange)
    }

    function rowDecorator(activeEditor: vscode.TextEditor, line: number,  decorationContainer: ViewportDecorator.DecorationContainer) {
        const lineRange = Region.makeRangeLineText(activeEditor.document.lineAt(line))
        const colorNum = line % colors.length
        decorationContainer.addDecorator(`color${colorNum}`, lineRange)
    }

    return ViewportDecorator.activateViewportDecorators(decoratorContainer, shouldDecorateDocument, config.colorMethod==='indentation' ? indentationDecorator : rowDecorator)
}

function shouldDecorateDocument(editor:vscode.TextEditor) {
    return editor.document.languageId === 'plaintext';
}