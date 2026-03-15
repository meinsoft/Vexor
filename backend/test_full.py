
import requests, json
BASE = 'http://localhost:8000'

r = requests.post(f'{BASE}/auth/login', json={'email': 'test@vexor.az', 'password': 'Test1234!'})
token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

r2 = requests.post(f'{BASE}/drill/create', json={
    'org_name': 'Kapital Bank',
    'target_emails': ['me5476793@gmail.com']
}, headers=headers)
print('Status:', r2.status_code)
print('Response:', json.dumps(r2.json(), indent=2, ensure_ascii=False))
