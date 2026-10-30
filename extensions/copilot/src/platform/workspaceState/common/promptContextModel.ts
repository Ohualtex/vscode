/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as vscode from 'vscode';
import { RepoContext } from '../../git/common/gitService';


/**
 * Snapshot of the workbench state that internal feedback reports include.
 */
export interface ISerializedWorkspaceState {
	readonly workspaceFoldersFilePaths: string[] | undefined;
	readonly repoContexts: Array<RepoContext | undefined> | undefined;
	readonly activeTextEditor: {
		selections: { anchor: vscode.Position; active: vscode.Position; isReversed: boolean }[];
		documentFilePath: string;
		visibleRanges: { start: vscode.Position; end: vscode.Position }[];
		languageId: string;
	} | undefined;
	readonly notebookDocumentFilePaths: string[] | undefined;
	readonly activeFileDiagnostics: {
		start: vscode.Position;
		end: vscode.Position;
		message: string;
		severity?: vscode.DiagnosticSeverity;
		relatedInformation?: ISerializedDiagnosticRelatedInformation[];
	}[];
	readonly debugConsoleOutput: string;
	readonly terminalBuffer: string;
	readonly terminalLastCommand: {
		commandLine: string | undefined;
		cwd: string | undefined;
		exitCode: number | undefined;
		output: string | undefined;
	} | undefined;
	readonly terminalSelection: string;
	readonly terminalShellType: string;
	readonly activeNotebookEditor: {
		selections: { start: number; end: number }[];
		documentFilePath: string;
	} | undefined;
	readonly textDocumentFilePaths: string[];
}

export interface ISerializedDiagnosticRelatedInformation {
	readonly message: string;
	readonly start: vscode.Position;
	readonly end: vscode.Position;
	readonly filePath: string;
}
