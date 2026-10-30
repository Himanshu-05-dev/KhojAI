import os
import re
import json
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

def strip_think_tags(text: str) -> str:
    """Strips DeepSeek-R1 chain-of-thought <think>...</think> tags cleanly."""
    if not text:
        return ""
    cleaned = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.DOTALL)
    return cleaned.strip()

class LLMClient:
    """
    Unified LLM Client supporting DeepSeek-R1, NVIDIA NIM, OpenRouter,
    OpenAI, and deterministic zero-cost fallbacks.
    """
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "nvidia").lower()
        self.nvidia_key = os.getenv("NVIDIA_API_KEY")
        self.nvidia_model = os.getenv("NVIDIA_MODEL", "deepseek-ai/deepseek-r1")
        self.nvidia_base_url = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")

    def invoke(self, prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 1500) -> str:
        # 1. NVIDIA NIM / DeepSeek-R1 Provider
        if self.provider == "nvidia" or (self.nvidia_key and self.provider not in ["openai", "gemini", "openrouter"]):
            if self.nvidia_key:
                try:
                    from openai import OpenAI
                    client = OpenAI(
                        base_url=self.nvidia_base_url,
                        api_key=self.nvidia_key,
                        timeout=30.0,
                    )
                    messages = []
                    if system_prompt:
                        messages.append({"role": "system", "content": system_prompt})
                    messages.append({"role": "user", "content": prompt})

                    logger.info(f"Invoking LLM model: {self.nvidia_model}")
                    completion = client.chat.completions.create(
                        model=self.nvidia_model,
                        messages=messages,
                        temperature=0.2,
                        max_tokens=max_tokens,
                    )
                    raw_content = completion.choices[0].message.content or ""
                    clean_content = strip_think_tags(raw_content)
                    if clean_content:
                        return clean_content
                except Exception as e:
                    logger.warning(f"NVIDIA / DeepSeek NIM invocation failed: {e}. Falling back to deterministic engine.")

        # 2. OpenRouter Provider (Supports free deepseek/deepseek-r1:free)
        if self.provider == "openrouter" or (self.openrouter_key and not self.nvidia_key):
            try:
                from openai import OpenAI
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=self.openrouter_key,
                    timeout=30.0,
                )
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                model = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-r1:free")
                completion = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=max_tokens,
                )
                raw_content = completion.choices[0].message.content or ""
                clean_content = strip_think_tags(raw_content)
                if clean_content:
                    return clean_content
            except Exception as e:
                logger.warning(f"OpenRouter invocation failed: {e}. Falling back.")

        # 3. OpenAI Fallback
        if self.provider == "openai" and self.openai_key:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=self.openai_key, timeout=25.0)
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                completion = client.chat.completions.create(
                    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    messages=messages,
                    temperature=0.2,
                    max_tokens=max_tokens,
                )
                raw_content = completion.choices[0].message.content or ""
                clean_content = strip_think_tags(raw_content)
                if clean_content:
                    return clean_content
            except Exception as e:
                logger.warning(f"OpenAI invocation failed: {e}. Falling back.")

        # 4. Fallback Heuristics
        return self._fallback_invoke(prompt)

    def extract_json(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Invokes the model and parses JSON response safely."""
        try:
            full_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON wrapped in a codeblock or directly as JSON object. Do not include extra conversational text."
            raw = self.invoke(full_prompt, system_prompt=system_prompt)
            clean = strip_think_tags(raw)
            # Find json block
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', clean)
            if json_match:
                clean = json_match.group(1)
            # Try parse
            return json.loads(clean.strip())
        except Exception as e:
            logger.debug(f"JSON extraction failed: {e}")
            return None

    def _fallback_invoke(self, prompt: str) -> str:
        if "pitch" in prompt.lower() or "cover letter" in prompt.lower():
            return (
                "I am strongly enthusiastic about this opportunity. My technical background in modern software "
                "engineering and hands-on track record aligning with your core stack will allow me to deliver "
                "immediate impact to your engineering initiatives."
            )
        return "Processed successfully."

llm_client = LLMClient()
