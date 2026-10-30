/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type * as vscode from 'vscode';
import { IDebugOutputService } from '../../../platform/debug/common/debugOutputService';
import { IGitService } from '../../../platform/git/common/gitService';
import { ILanguageDiagnosticsService } from '../../../platform/languages/common/languageDiagnosticsService';
import { ITabsAndEditorsService } from '../../../platform/tabs/common/tabsAndEditorsService';
import { ITerminalService } from '../../../platform/terminal/common/terminalService';
import { IWorkspaceService } from '../../../platform/workspace/common/workspaceService';
import { ISerializedDiagnosticRelatedInformation, ISerializedWorkspaceState } from '../../../platform/workspaceState/common/promptContextModel';
import { coalesce } from '../../../util/vs/base/common/arrays';
import { relativePath } from '../../../util/vs/base/common/resources';

export class WorkspaceStateSnapshotHelper {
	/**
	 * Captures the workbench state that internal feedback reports include.
	 *
	 * @param tabAndEditorsService - Service for managing tabs and editors.
	 * @param languageDiagnosticService - Service for providing language diagnostics.
	 * @param workspaceService - Service for workspace management.
	 * @param terminalService - Service for terminal operations.
	 * @param debugOutputService - Service for debug output.
	 * @param gitService - Service for Git operations.
	 */
	constructor(
		@ITabsAndEditorsService private readonly tabAndEditorsService: ITabsAndEditorsService,
		@ILanguageDiagnosticsService private readonly languageDiagnosticService: ILanguageDiagnosticsService,
		@IWorkspaceService private readonly workspaceService: IWorkspaceService,
		@ITerminalService private readonly terminalService: ITerminalService,
		@IDebugOutputService private readonly debugOutputService: IDebugOutputService,
		@IGitService private readonly gitService: IGitService
	) { }

	public async captureWorkspaceStateSnapshot(): Promise<ISerializedWorkspaceState> {
		const workspaceFoldersFilePaths = this.workspaceService.getWorkspaceFolders().map(w => w.fsPath + '/');
		const notebookDocumentFilePaths = this.workspaceService.notebookDocuments.map(d => d.uri.fsPath);
		const activeFileDiagnostics = !this.tabAndEditorsService.activeTextEditor ? [] : this.languageDiagnosticService.getDiagnostics(this.tabAndEditorsService.activeTextEditor.document.uri).map(d => ({
			start: d.range.start,
			end: d.range.end,
			message: d.message,
			severity: d.severity,
			relatedInformation: d.relatedInformation?.map(serializeRelatedInformation)
		}));
		const activeTextEditor = this.tabAndEditorsService.activeTextEditor ? {
			selections: this.tabAndEditorsService.activeTextEditor?.selections.map(s => ({
				anchor: s.anchor,
				active: s.active,
				isReversed: s.isReversed,
			})) ?? [],
			documentFilePath: this.tabAndEditorsService.activeTextEditor?.document.uri.fsPath ?? '',
			visibleRanges: this.tabAndEditorsService.activeTextEditor?.visibleRanges.map(r => ({
				start: r.start,
				end: r.end
			})) ?? [],
			languageId: this.tabAndEditorsService.activeTextEditor?.document.languageId ?? 'javascript',
		} : undefined;
		const terminalLastCommand = this.terminalService.terminalLastCommand ? {
			commandLine: this.terminalService.terminalLastCommand.commandLine,
			cwd: typeof this.terminalService.terminalLastCommand.cwd === 'object' ? this.terminalService.terminalLastCommand.cwd.toString() : this.terminalService.terminalLastCommand.cwd,
			exitCode: this.terminalService.terminalLastCommand.exitCode,
			output: this.terminalService.terminalLastCommand.output,
		} : undefined;
		const workspaceState: ISerializedWorkspaceState = {
			workspaceFoldersFilePaths,
			activeFileDiagnostics,
			activeTextEditor,
			debugConsoleOutput: this.debugOutputService.consoleOutput,
			terminalBuffer: this.terminalService.terminalBuffer,
			terminalLastCommand,
			terminalSelection: this.terminalService.terminalSelection,
			terminalShellType: this.terminalService.terminalShellType,
			repoContexts: this.gitService.repositories,
			notebookDocumentFilePaths,
			textDocumentFilePaths: coalesce(this.workspaceService.textDocuments.map(doc => {
				const parentFolder = this.workspaceService.getWorkspaceFolder(doc.uri);
				return parentFolder ? relativePath(parentFolder, doc.uri) : undefined;
			})),
			activeNotebookEditor: undefined
		};

		return workspaceState;
	}
}

function serializeRelatedInformation(r: vscode.DiagnosticRelatedInformation): ISerializedDiagnosticRelatedInformation {
	return {
		filePath: r.location.uri.fsPath,
		start: r.location.range.start,
		end: r.location.range.end,
		message: r.message
	};
}
