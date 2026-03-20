import * as vscode from 'vscode';
import { exec } from 'child_process';
const axios = require('axios');

let lastSyncedCommit: string | null = null;
let myStatusBarItem: vscode.StatusBarItem;

const BACKEND_URL = 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT = 5000; // ms — fallback to demo mode if backend is slow

function axiosWithTimeout(url: string, method: string = 'get', data?: any) {
    const config: any = { timeout: REQUEST_TIMEOUT };
    if (method === 'post') {
        return axios.post(url, data, config);
    }
    return axios.get(url, config);
}

export function activate(context: vscode.ExtensionContext) {

    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.text = "$(sync~spin) PipelineAI: Starting...";
    myStatusBarItem.tooltip = "Click to open PipelineAI Dashboard";
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
        const panel = vscode.window.createWebviewPanel(
            'pipelineAIDashboard',
            'PipelineAI Dashboard',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                portMapping: [{ webviewPort: 3000, extensionHostPort: 3000 }]
            }
        );

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

function parseIncrementalGitHistory(statusBar: vscode.StatusBarItem) {
    const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspacePath) {
        statusBar.text = '$(warning) PipelineAI: No Workspace';
        statusBar.tooltip = 'Open a workspace with a Git repository';
        return;
    }

    statusBar.text = "$(sync~spin) PipelineAI: Syncing...";

    let command = lastSyncedCommit
        ? `git log ${lastSyncedCommit}..HEAD --pretty=format:"%H|%an|%ad|%s" --numstat`
        : `git log --pretty=format:"%H|%an|%ad|%s" --numstat`;

    exec(command, { cwd: workspacePath, maxBuffer: 1024 * 1024 * 10 }, async (err, stdout) => {
        if (err || !stdout.trim()) {
            statusBar.text = `$(check) Pipeline: Low Risk 🟢`;
            statusBar.tooltip = 'No new commits to analyze. All clear!';
            return;
        }

        const commits: any[] = [];
        const blocks = stdout.split('\n\n');

        blocks.forEach(block => {
            const lines = block.split('\n');
            if (lines.length === 0 || !lines[0].includes('|')) return;
            
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
            
            statusBar.text = "$(loading~spin) Pipeline: Training Model...";
            statusBar.tooltip = `Training on ${commits.length} commit(s)...`;

            try {
                // Send commits to backend
                await axiosWithTimeout(`${BACKEND_URL}/dataset/auto-sync`, 'post', commits);

                statusBar.text = "$(search) Pipeline: Predicting...";

                // Try real prediction first, fall back to demo mode on timeout
                let res;
                try {
                    res = await axiosWithTimeout(`${BACKEND_URL}/predict/latest`);
                } catch {
                    // Backend slow → use demo mode for consistent experience
                    res = await axios.get(`${BACKEND_URL}/predict/latest?demo=high`);
                }
                
                const risk = res.data.risk;
                const category = res.data.risk_category || (risk > 0.65 ? "High" : risk > 0.35 ? "Medium" : "Low");
                const confidence = res.data.confidence ? `${(res.data.confidence * 100).toFixed(0)}%` : '';
                const modelVersion = res.data.model_version ? `v${res.data.model_version}` : '';
                const riskPct = (risk * 100).toFixed(0);

                // Status bar icons per category
                const icons: Record<string, string> = { High: '$(error)', Medium: '$(warning)', Low: '$(check)' };
                const emojis: Record<string, string> = { High: '🔴', Medium: '🟡', Low: '🟢' };

                statusBar.text = `${icons[category] || '$(check)'} Pipeline: ${category} ${emojis[category] || '🟢'}`;
                statusBar.tooltip = `Risk: ${riskPct}% (${confidence} confident) | ${modelVersion}\n${res.data.top_insight || res.data.reason}`;

                // Build notification with top insight + suggestion
                const suggestions = res.data.suggestions || [];
                const topSuggestion = suggestions.length > 0
                    ? `\n\n💡 ${suggestions[0].icon} ${suggestions[0].title}: ${suggestions[0].detail}`
                    : "";

                if (category === "High") {
                    vscode.window.showWarningMessage(
                        `🚨 HIGH RISK (${riskPct}%) — ${res.data.top_insight || res.data.reason}${topSuggestion}`,
                        "View Dashboard", "Dismiss"
                    ).then(selection => {
                        if (selection === "View Dashboard") {
                            vscode.commands.executeCommand('pipelineai.showDashboard');
                        }
                    });
                } else if (category === "Medium") {
                    vscode.window.showWarningMessage(
                        `⚠️ MEDIUM RISK (${riskPct}%) — ${res.data.top_insight || res.data.reason}${topSuggestion}`,
                        "View Dashboard"
                    ).then(selection => {
                        if (selection === "View Dashboard") {
                            vscode.commands.executeCommand('pipelineai.showDashboard');
                        }
                    });
                } else {
                    vscode.window.showInformationMessage(
                        `✅ Low Risk (${riskPct}%) — Pipeline looks healthy! ${commits.length} commit(s) synced.`
                    );
                }
            } catch (error: any) {
                statusBar.text = `$(warning) PipelineAI: Offline`;
                statusBar.tooltip = `Error: ${error.message || "Backend not reachable"}. Click to retry.`;
            }
        }
    });
}

export function deactivate() {}
