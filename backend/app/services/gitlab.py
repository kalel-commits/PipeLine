import requests
import os
from typing import Dict, Any, Optional
from app.core.config import settings

class GitLabService:
    @staticmethod
    def post_mr_comment(project_id: int, mr_iid: int, message: str) -> bool:
        """Posts a comment to a specific GitLab Merge Request."""
        token = settings.GITLAB_TOKEN
        
        if not token or token == "your_gitlab_personal_access_token":
            print(f"⚠️ [SIMULATION] Would have posted to GitLab MR !{mr_iid}: {message}")
            return False
            
        url = f"https://gitlab.com/api/v4/projects/{project_id}/merge_requests/{mr_iid}/notes"
        headers = {"PRIVATE-TOKEN": token, "Content-Type": "application/json"}
        payload = {"body": message}
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ GitLab API Error: {str(e)}")
            return False

    @staticmethod
    def construct_prediction_message(prediction_result: Dict[str, Any], features: Dict[str, Any]) -> str:
        """Constructs a formatted Markdown message for the GitLab MR."""
        # ... logic from previous iteration ...
        predicted_success = prediction_result.get("prediction") == 1
        confidence = prediction_result.get("confidence", 0.0)
        
        header = "### 🚀 PipelineAI Prediction: **Success**" if predicted_success else "### ⚠️ PipelineAI Prediction: **Failure**"
        body = f"I've analyzed this MR and predict a **{confidence:.1%} chance of {'passing' if predicted_success else 'failing'}**."
        
        return f"{header}\n{body}\n\n_Automated prediction provided by PipelineAI._"

gitlab_service = GitLabService()
