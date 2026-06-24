import json

def summarize_openapi(file_path, name):
    print(f"=== {name} API Summary ===")
    try:
        with open(file_path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
        
        paths = data.get("paths", {})
        print(f"Total Endpoints: {len(paths)}")
        
        tags = set()
        endpoints_by_tag = {}
        for path, methods in paths.items():
            for method, details in methods.items():
                if method.lower() not in ["get", "post", "put", "delete", "patch"]: continue
                path_tags = details.get("tags", ["Untagged"])
                for tag in path_tags:
                    tags.add(tag)
                    if tag not in endpoints_by_tag:
                        endpoints_by_tag[tag] = []
                    endpoints_by_tag[tag].append(f"{method.upper()} {path}")
        
        print("\nTags and Endpoints:")
        for tag in sorted(tags):
            print(f"- [{tag}] ({len(endpoints_by_tag[tag])} endpoints)")
            for ep in endpoints_by_tag[tag][:3]:
                print(f"    * {ep}")
            if len(endpoints_by_tag[tag]) > 3:
                print(f"    * ...and {len(endpoints_by_tag[tag]) - 3} more")
        print("\n")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

summarize_openapi(r"c:\Projects\axis_clean\apps\api\openapi_spec.json", "Axionyx (Truth Engine)")
summarize_openapi(r"c:\Projects\iphande\api\openapi_spec.json", "iPhande (Operational Engine)")
