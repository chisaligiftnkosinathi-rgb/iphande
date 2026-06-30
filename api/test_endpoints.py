import requests

print("Health:")
print(requests.get('http://127.0.0.1:8000/api/v1/health').json())
print("Version:")
print(requests.get('http://127.0.0.1:8000/api/v1/version').json())
print("Protected (403/401):")
print(requests.get('http://127.0.0.1:8000/api/v1/profiles/me').json())
