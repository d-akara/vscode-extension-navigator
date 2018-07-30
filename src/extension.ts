'use strict';
import * as path from 'path'
import * as vscode from 'vscode';
import * as navigator from './navigator/navigator'
import {Region, Lines, View, Glyph, Application} from 'vscode-extension-common'

/**
 * Future Features
 * 
 * - activate on startup so that recent edits will be populated when first open
 * - regex matches with 2 inputs, 1) regex filter for lines 2) regex filter for text to display in tree view
 * - add palette quick pick lists for sections in tree views
 * 
 * - add marker for specific line, optional with comment.  Apply comment as end of line decorator
 * - Watch For... active or dynamic markers matching a string/regex
 * - view of all markers of current document only.  ungrouped.
 * 
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

    // register the navigator tree view
    navigator.register(context)
}

export function deactivate() {
}