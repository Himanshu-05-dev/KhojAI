import os
import re
from typing import Optional, Dict, Any

class LLMClient:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "mock").lower()
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

    def invoke(self, prompt: str) -> str:
        # If API keys are available, real provider invocation can be hooked up
        # For offline / zero-dependency development, provides structured intelligent responses
        return self._fallback_invoke(prompt)

    def _fallback_invoke(self, prompt: str) -> str:
        if "pitch" in prompt.lower() or "cover letter" in prompt.lower():
            return "I am strongly enthusiastic about this opportunity. My technical background in modern software engineering and hands-on track record aligning with your core stack will allow me to deliver immediate impact to your engineering initiatives."
        return "Processed successfully."

llm_client = LLMClient()
