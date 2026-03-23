<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	PipelineAI is a predictive CI/CD intelligence tool built with FastAPI (Python) backend, React (TypeScript/JavaScript) frontend, and a VS Code extension.

- [x] Scaffold the Project
	Project structure exists: `backend/` (FastAPI), `frontend/` (Create React App + Material-UI), `vscode-extension/` (TypeScript), `docker/` and GitHub Actions workflow.

- [x] Customize the Project
	Project is fully customized: ML model (Random Forest + SHAP), Anthropic Claude AI Mentor, sustainability tracker, admin command center, RBAC, and audit logging are all implemented.

- [x] Install Required Extensions
	No extensions required beyond those already defined in `vscode-extension/package.json`.

- [x] Compile the Project
	- Backend: `pip install -r requirements.txt` in `backend/`
	- Frontend: `npm install && npm run build` in `frontend/`
	- VS Code Extension: `npm install && npm run compile` in `vscode-extension/`

- [x] Create and Run Task
	`.vscode/tasks.json` created with tasks: Start Backend, Start Frontend, Build Frontend, Compile VS Code Extension, and Start PipelineAI (Full Stack) as the default build task.

- [x] Launch the Project
	- Backend: `python -m uvicorn main:app --reload` in `backend/` (Port 8000)
	- Frontend: `npm start` in `frontend/` (Port 3000)
	- Demo: `http://localhost:3000/dashboard?demo=high`
	- Use VS Code task "Start PipelineAI (Full Stack)" to launch both servers simultaneously.

- [x] Ensure Documentation is Complete
	README.md exists with full project documentation. This copilot-instructions.md is up to date.

- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
