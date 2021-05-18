import * as vscode from 'vscode';
import { Region, Lines, View, Glyph, Application } from 'vscode-extension-common'

export function activate(context: vscode.ExtensionContext) {
    let activeEditor = vscode.window.activeTextEditor;
    // Create a decorator types that we use to decorate indent levels
    let decorationTypes = [];

    // Colors will cycle through, and can be any size that you want
    const colors = vscode.workspace.getConfiguration('indentRainbow')['colors'] || [
        "rgba(255,255,64)",
        "rgba(127,255,127)",
        "rgba(255,127,255)",
        "rgba(79,236,236)"
    ];

    // Loops through colors and creates decoration types for each one
    colors.forEach((color, index) => {
        decorationTypes[index] = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            color: color
        });
    });

    // if (activeEditor && isPlainText()) {
    //     triggerUpdateDecorations();
    // }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (!editor) return
        activeEditor = editor;
        if (!isPlainText()) return

        triggerUpdateDecorations();
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (!isPlainText()) return

        const visibleChanges = Region.contentChangesInVisibleRanges(event.contentChanges, activeEditor.visibleRanges)
        if (visibleChanges.length > 0) {
            triggerUpdateDecorations(visibleChanges);
        }
    }, null, context.subscriptions);

    // vscode.window.onDidChangeTextEditorVisibleRanges(event => {
    //     if (!activeEditor || !isPlainText()) return

    //     if (event.visibleRanges.length > 0) {
    //         triggerUpdateDecorations();
    //     }       
    // }, null, context.subscriptions)

    function isPlainText() {return activeEditor.document.languageId === 'plaintext'}

    let timeout = null;
    function triggerUpdateDecorations(contentChanges?: readonly vscode.TextDocumentContentChangeEvent[]) {
        if (timeout) {clearTimeout(timeout)}

        timeout = setTimeout(()=> {
            timeout = null;
            updateDecorations(activeEditor, decorationTypes, contentChanges)
        }, 100);
    }
}

function updateDecorations(activeEditor:vscode.TextEditor, decorationTypes:vscode.TextEditorDecorationType[], contentChanges: readonly vscode.TextDocumentContentChangeEvent[] = []) {
    if (!activeEditor) {return}

    let decorators = [];
    decorationTypes.forEach(() => {
        let decorator: vscode.DecorationOptions[] = [];
        decorators.push(decorator);
    });

    let linesToDecorate
    if (contentChanges.length === 0) {
        // no specified content changes, so we update all lines in view
        linesToDecorate = Lines.lineNumbersFromRanges(activeEditor.visibleRanges)
    } else {
        linesToDecorate = Lines.linesChanged(contentChanges);
    }

    linesToDecorate.forEach(line => {
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