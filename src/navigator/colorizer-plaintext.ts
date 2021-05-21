import * as vscode from 'vscode';
import * as chroma from 'chroma-js'
import { Region, Lines, View, Glyph, Application } from 'vscode-extension-common'

export function activate(context: vscode.ExtensionContext, config) {
    let activeEditor = vscode.window.activeTextEditor;
    let decorationTypes = [];

    const colors = chroma.scale(config.scale).mode(config.colorMode).gamma(config.gamma).colors(config.maxColors)
                         .map(color => chroma(color).brighten(config.brightness).hex())

    colors.forEach((color, index) => {
        decorationTypes[index] = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            color: color
        });
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor) return
        activeEditor = editor;
        if (!isPlainText()) return

        triggerUpdateDecorations();
    }, null, context.subscriptions);

    vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (!activeEditor || !isPlainText()) return

        if (event.visibleRanges.length > 0) {
            triggerUpdateDecorations();
        }       
    }, null, context.subscriptions)

    function isPlainText() {return activeEditor.document.languageId === 'plaintext'}

    let timeout = null;
    function triggerUpdateDecorations(contentChanges?: readonly vscode.TextDocumentContentChangeEvent[]) {
        if (timeout) {clearTimeout(timeout)}

        timeout = setTimeout(()=> {
            timeout = null;
            updateDecorations(activeEditor, decorationTypes)
        }, 100);
    }
}

function updateDecorations(activeEditor:vscode.TextEditor, decorationTypes:vscode.TextEditorDecorationType[]) {
    if (!activeEditor) {return}

    const decorators:vscode.DecorationOptions[][] = []
    decorationTypes.forEach(() => {
        let decorator: vscode.DecorationOptions[] = [];
        decorators.push(decorator);
    });

    const regionToUpdate = Region.makeExpandedVisibleRange(activeEditor, 50)
    Lines.forEachLineNumberOfRange(regionToUpdate, line => {
        const level = Lines.calculateLineTabSpacing(activeEditor, line)
        addDecorator(activeEditor, line, decorators, level, decorationTypes);
    })

    decorationTypes.forEach((decorationType, index) => {
        activeEditor.setDecorations(decorationType, decorators[index]);
    });
}

function addDecorator(activeEditor: vscode.TextEditor, line: number, decorators: any[], level: number, decorationTypes: vscode.TextEditorDecorationType[]) {
    if (Math.trunc(level) !== level) return // don't process fractional levels
    level-- // make zero index based. 
    const lineRange = Region.makeRangeLineText(activeEditor.document.lineAt(line));
    const decoration = { range: lineRange, hoverMessage: null };
    decorators[level % decorationTypes.length].push(decoration);
}