import httpx, os
from dotenv import load_dotenv
load_dotenv()
hf_key = os.getenv('HUGGINGFACE_API_KEY')

r = httpx.post(
    'https://router.huggingface.co/hf-inference/models/cybersectony/phishing-email-detection-distilbert_v2.4.1',
    headers={'Authorization': f'Bearer {hf_key}'},
    json={'inputs': 'Your Merkezi Bank account has been suspended. Verify immediately.'},
    timeout=15
)
print('Status:', r.status_code)
print('Response:', r.json())