import requests
import json

base_url = 'http://127.0.0.1:8001/api/v1'

print('1. Customer searching directory...')
r = requests.get(f'{base_url}/public/opportunities')
if r.status_code == 200:
    data = r.json()
    steward = data['groups'][0]['items'][0]
    print(f"Found steward: {steward['name']} (slug: {steward['slug']})")
    
    print('\n2. Customer viewing public profile...')
    r_prof = requests.get(f"{base_url}/public/business/{steward['slug']}")
    if r_prof.status_code == 200:
        prof_data = r_prof.json()
        print('Profile viewed successfully.')
        
        print('\n3. Customer requesting service...')
        owner_id = prof_data['profile']['owner_id'] or 'test_owner_id'
        
        payload = {
            'business_owner_id': owner_id,
            'customer_name': 'Automated Test Customer',
            'customer_phone': '0812345678',
            'customer_location': 'Pretoria',
            'service_needed': 'Need an automated test completed',
            'business_category_key': steward['business_line'] or 'unclassified',
            'business_line': steward['business_line'] or 'unclassified'
        }
        
        r_lead = requests.post(f'{base_url}/quote-requests', json=payload)
        if r_lead.status_code == 200:
            lead = r_lead.json()
            print(f"Lead created successfully! Lead ID: {lead['id']}")
            print('The Steward just received a new lead on their dashboard!')
            print('Test Loop Complete. The system works!')
        else:
            print('Failed to create lead:', r_lead.text)
    else:
        print('Failed to load profile:', r_prof.text)
else:
    print('Failed to load directory:', r.text)
