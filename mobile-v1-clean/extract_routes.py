import os, glob, re

def analyze():
    files = glob.glob('app/**/*.tsx', recursive=True)
    for f in sorted(files):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        endpoints = re.findall(r'(?:fetchWithAuth|fetch)\s*\(\s*([\'\"\`].*?[\'\"\`])', content)
        routes = re.findall(r'router\.(?:push|replace|navigate)\s*\(\s*([\'\"\`].*?[\'\"\`])', content)
        links = re.findall(r'href=\{?(.*?)\}?', content)
        
        if endpoints or routes or links:
            print(f'\n--- {f} ---')
            if endpoints: print('API:', set(endpoints))
            if routes: print('ROUTES:', set(routes))
            if links: print('LINKS:', set(links))

analyze()
