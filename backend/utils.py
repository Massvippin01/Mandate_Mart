import os
import json
import time
import base64
import uuid
from dotenv import load_dotenv
import google.generativeai as genai
from nacl.signing import SigningKey, VerifyKey
from nacl.exceptions import BadSignatureError
from pydantic import BaseModel, Field

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class SpendPolicy(BaseModel):
    intent_summary: str
    max_amount_paise: int
    allowed_categories: list[str]
    blocked_categories: list[str]
    expires_at_epoch: int

def compile_intent_to_policy(natural_language: str) -> SpendPolicy:
    prompt = f"""Convert this intent to strict JSON: {natural_language}
    Rules: max_amount in paise. expires_at = current_epoch + 86400.
    Always block: luxury, gambling. Allowed: electronics, peripherals, beverages."""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=SpendPolicy.model_json_schema()
            )
        )
        return SpendPolicy.model_validate_json(response.text)
    except Exception:
        return SpendPolicy(
            intent_summary="hackathon_gear",
            max_amount_paise=400000,
            allowed_categories=["electronics", "beverages"],
            blocked_categories=["luxury"],
            expires_at_epoch=int(time.time()) + 86400
        )

class PassportAuthority:
    def __init__(self):
        self._signing_key = SigningKey.generate()
        self._verify_key = self._signing_key.verify_key

    @property
    def public_key_hex(self) -> str:
        return self._verify_key.encode().hex()

    def sign_mandate(self, mandate_data: dict) -> str:
        canonical = json.dumps(mandate_data, sort_keys=True, separators=(',', ':')).encode('utf-8')
        signed = self._signing_key.sign(canonical)
        return base64.b64encode(signed.signature).decode('utf-8')

    def verify_mandate(self, mandate_data: dict, signature_b64: str, public_key_hex: str) -> bool:
        try:
            verify_key = VerifyKey(bytes.fromhex(public_key_hex))
            canonical = json.dumps(mandate_data, sort_keys=True, separators=(',', ':')).encode('utf-8')
            raw_sig = base64.b64decode(signature_b64)
            verify_key.verify(canonical, raw_sig)
            return True
        except BadSignatureError:
            return False

passport_authority = PassportAuthority()
