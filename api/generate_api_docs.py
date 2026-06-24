import json
import os

def generate_markdown(json_path, output_path, title):
    try:
        with open(json_path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
            
        paths = data.get("paths", {})
        
        # Group by tags
        endpoints_by_tag = {}
        for path, methods in paths.items():
            for method, details in methods.items():
                if method.lower() not in ["get", "post", "put", "delete", "patch"]: continue
                tags = details.get("tags", ["Untagged"])
                summary = details.get("summary", "No summary provided.")
                desc = details.get("description", "")
                
                for tag in tags:
                    if tag not in endpoints_by_tag:
                        endpoints_by_tag[tag] = []
                    endpoints_by_tag[tag].append({
                        "method": method.upper(),
                        "path": path,
                        "summary": summary,
                        "description": desc
                    })
                    
        with open(output_path, "w", encoding="utf-8") as out:
            out.write(f"# {title} API Reference\n\n")
            for tag in sorted(endpoints_by_tag.keys()):
                out.write(f"## {tag}\n\n")
                for ep in endpoints_by_tag[tag]:
                    out.write(f"### `{ep['method']} {ep['path']}`\n")
                    out.write(f"**Summary:** {ep['summary']}\n\n")
                    if ep['description']:
                        # keep description brief
                        desc = ep['description'].strip().replace('\n', ' ')
                        if len(desc) > 300:
                            desc = desc[:297] + "..."
                        out.write(f"> {desc}\n\n")
                out.write("---\n\n")
        print(f"Generated {output_path}")
    except Exception as e:
        print(f"Failed to process {json_path}: {e}")

artifact_dir = r"C:\Users\IMBALLY\.gemini\antigravity-ide\brain\2f666baf-b101-4586-8c21-5d705d50b507"

generate_markdown(
    r"c:\Projects\axis_clean\apps\api\openapi_spec.json", 
    os.path.join(artifact_dir, "axionyx_api_reference.md"), 
    "Axionyx (Truth Engine)"
)

generate_markdown(
    r"c:\Projects\iphande\api\openapi_spec.json", 
    os.path.join(artifact_dir, "iphande_api_reference.md"), 
    "iPhande (Operational Engine)"
)
