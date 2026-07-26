import os
import logging
from typing import AsyncGenerator, List, Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("app.services.gemini")

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.client = None
        self.genai_legacy = None
        
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Configured Google GenAI SDK Client successfully.")
            except Exception as err:
                logger.info(f"Using google.generativeai legacy fallback ({err}).")
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=self.api_key)
                self.genai_legacy = legacy_genai
        else:
            logger.warning("No GEMINI_API_KEY configured. Running in demo response mode.")

    def _get_candidate_models(self, requested_model: Optional[str] = None) -> List[str]:
        candidates = []
        if requested_model:
            candidates.append(requested_model)
            
        fallback_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
        for m in fallback_models:
            if m not in candidates:
                candidates.append(m)
        return candidates

    def _build_prompt_parts(self, prompt: str, attachments: Optional[List[Any]] = None, legacy: bool = False) -> List[Any]:
        import base64
        parts = []
        if attachments:
            for att in attachments:
                if hasattr(att, 'content') and att.content:
                    try:
                        data = base64.b64decode(att.content)
                        if legacy:
                            parts.append({"mime_type": att.type, "data": data})
                        else:
                            parts.append({"inline_data": {"mime_type": att.type, "data": data}})
                    except Exception as e:
                        logger.error(f"Failed to decode attachment: {e}")
        parts.append({"text": prompt} if not legacy else prompt)
        return parts

    def generate_response(self, prompt: str, history: Optional[List[Dict[str, str]]] = None, model_name: Optional[str] = None, attachments: Optional[List[Any]] = None, temperature: float = 0.7, max_tokens: int = 2048) -> str:
        """Synchronous/standard response generator with automatic model fallback."""
        if not self.api_key:
            return f"🤖 [Demo AI] Hello! I received your message: '{prompt}'. Configure GEMINI_API_KEY in backend/app/.env for live Gemini AI responses."

        models_to_try = self._get_candidate_models(model_name)
        last_error = ""

        for model_id in models_to_try:
            try:
                if self.client:
                    from google.genai import types
                    config = types.GenerateContentConfig(temperature=temperature, max_output_tokens=max_tokens)
                    if history:
                        contents = []
                        for msg in history:
                            role = "user" if msg.get("sender") == "user" else "model"
                            contents.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=False)
                        contents.append({"role": "user", "parts": prompt_parts})
                        res = self.client.models.generate_content(model=model_id, contents=contents, config=config)
                    else:
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=False)
                        res = self.client.models.generate_content(model=model_id, contents=prompt_parts, config=config)
                    if res and res.text:
                        return res.text
                elif self.genai_legacy:
                    import google.generativeai as legacy_genai
                    config = legacy_genai.types.GenerationConfig(temperature=temperature, max_output_tokens=max_tokens)
                    model = self.genai_legacy.GenerativeModel(model_id, generation_config=config)
                    if history:
                        formatted_history = []
                        for msg in history:
                            role = "user" if msg.get("sender") == "user" else "model"
                            formatted_history.append({"role": role, "parts": [msg.get("text", "")]})
                        chat = model.start_chat(history=formatted_history)
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=True)
                        res = chat.send_message(prompt_parts)
                    else:
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=True)
                        res = model.generate_content(prompt_parts)
                    if res and res.text:
                        return res.text
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Model {model_id} failed: {last_error}. Trying next fallback candidate...")

        # If rate limited (429), return a friendly note
        if "429" in last_error or "Quota exceeded" in last_error:
            return "🤖 Hello! Gemini API quota rate limit reached for this free tier key temporarily. Please try again in a moment."

        return f"🤖 AI Assistant: Thank you for your message! ({prompt})"

    async def generate_stream_response(self, prompt: str, history: Optional[List[Dict[str, str]]] = None, model_name: Optional[str] = None, attachments: Optional[List[Any]] = None, temperature: float = 0.7, max_tokens: int = 2048) -> AsyncGenerator[str, None]:
        """Asynchronous streaming response generator for SSE with model fallback."""
        if not self.api_key:
            demo_text = f"🤖 [Demo Mode Stream] Stream response for: '{prompt}'."
            for word in demo_text.split(" "):
                yield word + " "
            return

        models_to_try = self._get_candidate_models(model_name)
        last_error = ""

        for model_id in models_to_try:
            try:
                if self.client:
                    from google.genai import types
                    config = types.GenerateContentConfig(temperature=temperature, max_output_tokens=max_tokens)
                    if history:
                        contents = []
                        for msg in history:
                            role = "user" if msg.get("sender") == "user" else "model"
                            contents.append({"role": role, "parts": [{"text": msg.get("text", "")}]})
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=False)
                        contents.append({"role": "user", "parts": prompt_parts})
                        response = self.client.models.generate_content_stream(model=model_id, contents=contents, config=config)
                    else:
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=False)
                        response = self.client.models.generate_content_stream(model=model_id, contents=prompt_parts, config=config)

                    has_yielded = False
                    for chunk in response:
                        if chunk.text:
                            has_yielded = True
                            yield chunk.text
                    if has_yielded:
                        return
                elif self.genai_legacy:
                    import google.generativeai as legacy_genai
                    config = legacy_genai.types.GenerationConfig(temperature=temperature, max_output_tokens=max_tokens)
                    model = self.genai_legacy.GenerativeModel(model_id, generation_config=config)
                    if history:
                        formatted_history = []
                        for msg in history:
                            role = "user" if msg.get("sender") == "user" else "model"
                            formatted_history.append({"role": role, "parts": [msg.get("text", "")]})
                        chat = model.start_chat(history=formatted_history)
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=True)
                        response = chat.send_message(prompt_parts, stream=True)
                    else:
                        prompt_parts = self._build_prompt_parts(prompt, attachments, legacy=True)
                        response = model.generate_content(prompt_parts, stream=True)

                    has_yielded = False
                    for chunk in response:
                        if chunk.text:
                            has_yielded = True
                            yield chunk.text
                    if has_yielded:
                        return
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Stream model {model_id} failed: {last_error}.")

        yield f"🤖 AI Assistant: Received your prompt '{prompt}'."

gemini_service = GeminiService()