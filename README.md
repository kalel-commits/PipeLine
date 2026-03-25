<p align="center">
  <img src="frontend/src/assets/logo.png" alt="PipelineAI Logo" width="200" />
</p>

# 🚀 PipelineAI: The Architectural Forecaster for CI/CD

**Predict failures locally, before they ever reach the cloud.**

PipelineAI is a zero-config, predictive developer-experience layer designed for modern engineering teams. It analyzes code changes in real-time within your IDE to identify high-risk commits, saving developer focus, reducing CI/CD costs, and lowering the carbon footprint of software delivery.

---

### 🌟 Why PipelineAI?
*   **Zero-Config Local Intel**: Installs in seconds. Connects automatically to your local working directory.
*   **Explainable Risk (XAI)**: Don't just see a score—see *why*. Integrated **SHAP** charts reveal the exact features (churn, timing, complexity) driving every prediction.
*   **AI Mentor**: Receives context-aware architectural advice powered by sophisticated heuristics (and LLM-ready) to remediate risks instantly.
*   **VCS Native**: Automated risk reporting directly into **GitLab/GitHub** Merge Request comments.
*   **Premium UX**: A "Command Center" dashboard designed for high-performance engineering teams.

---

### 🛠️ Quick Start
1. **Clone & Setup**:
   ```bash
   python -m pip install -r backend/requirements.txt
   cd frontend && npm install
   ```
2. **Start the Engine**:
   - Backend: `python backend/main.py`
   - Frontend: `npm start`
3. **Experience the Magic**: Navigate to `http://localhost:3000/dashboard?demo=high` to see a high-risk prediction lifecycle, complete with SHAP values and AI Mentor suggestions.

---

### 🏗️ Technology Stack
*   **Intelligence**: Scikit-Learn (Random Forest/Ensemble), SHAP (XAI), Heuristic Intelligence
*   **Backend**: FastAPI, SQLAlchemy, Pydantic, Joblib
*   **Frontend**: React, Material UI (Premium Theme), Tailwind CSS (Landing)
*   **Monitoring**: Real-time event auditing and role-based access control.

---

### 🛡️ Enterprise Ready
PipelineAI is built with security at its core, featuring comprehensive **Role-Based Access Control (RBAC)** and **Audit Logging** to ensure compliance in even the most regulated environments.

---
**Build Smarter. Push Greener. Ship with Certainty.**
