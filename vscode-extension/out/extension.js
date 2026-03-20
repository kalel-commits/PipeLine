"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const axios = require('axios');
let lastSyncedCommit = null;
let myStatusBarItem;
function activate(context) {
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.text = "PipelineAI: Syncing...";
    myStatusBarItem.command = 'pipelineai.showDashboard';
    myStatusBarItem.show();
    context.subscriptions.push(myStatusBarItem);
    // Initial Sync
    parseIncrementalGitHistory(myStatusBarItem);
    // Register simple Sync Command
    const disposableSync = vscode.commands.registerCommand('pipelineai.sync', () => {
        parseIncrementalGitHistory(myStatusBarItem);
    });
    context.subscriptions.push(disposableSync);
    // Register Webview Dashboard Command
    let disposableDashboard = vscode.commands.registerCommand('pipelineai.showDashboard', async () => {
        const panel = vscode.window.createWebviewPanel('pipelineAIDashboard', 'PipelineAI Dashboard', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
            portMapping: [{ webviewPort: 3000, extensionHostPort: 3000 }]
        });
        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>PipelineAI Dashboard</title>
                <style>
                    body, html { margin: 0; padding: 0; min-height: 100vh; background-color: white; }
                    iframe { width: 100%; height: 100vh; border: none; }
                </style>
            </head>
            <body>
                <iframe src="http://localhost:3000" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
            </body>
            </html>
        `;
    });
    context.subscriptions.push(disposableDashboard);
}
function parseIncrementalGitHistory(statusBar) {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspacePath) {
        statusBar.text = 'PipelineAI: No Workspace';
        return;
    }
    let command = lastSyncedCommit
        ? `git log ${lastSyncedCommit}..HEAD --pretty=format:"%H|%an|%ad|%s" --numstat`
        : `git log --pretty=format:"%H|%an|%ad|%s" --numstat`;
    (0, child_process_1.exec)(command, { cwd: workspacePath, maxBuffer: 1024 * 1024 * 10 }, async (err, stdout) => {
        if (err || !stdout.trim()) {
            statusBar.text = `Pipeline Risk: Low 🟢 (Synced)`;
            return;
        }
        const commits = [];
        const blocks = stdout.split('\n\n');
        blocks.forEach(block => {
            const lines = block.split('\n');
            if (lines.length === 0 || !lines[0].includes('|'))
                return;
            const [hash, author, date, message] = lines[0].split('|');
            let added = 0, removed = 0, files_changed = 0;
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split('\t');
                if (parts.length === 3) {
                    added += parseInt(parts[0]) || 0;
                    removed += parseInt(parts[1]) || 0;
                    files_changed++;
                }
            }
            commits.push({ hash, author, date, message, added, removed, files_changed });
        });
        if (commits.length > 0) {
            lastSyncedCommit = commits[0].hash;
            statusBar.text = "Pipeline Risk: Training Model ⏳";
            try {
                // Fetch to background Auto-Sync ML route
                await axios.post('http://127.0.0.1:8000/dataset/auto-sync', commits);
                statusBar.text = "Pipeline Risk: Checking...";
                // Predict Latest
                const res = await axios.get('http://127.0.0.1:8000/predict/latest');
                const risk = res.data.risk;
                statusBar.text = `Pipeline Risk: ${risk > 0.6 ? "High 🔴" : "Low 🟢"}`;
                if (risk > 0.6) {
                    vscode.window.showWarningMessage(`⚠️ High Risk Commit! Top reason: ${res.data.reason}`, "View Dashboard").then(selection => {
                        if (selection === "View Dashboard") {
                            vscode.commands.executeCommand('pipelineai.showDashboard');
                        }
                    });
                }
                else {
                    vscode.window.showInformationMessage("Pipeline Risk is Low. Synced successfully!");
                }
            }
            catch (error) {
                statusBar.text = `PipelineAI: Error - ${error.message || "Backend Offline"}`;
            }
        }
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map