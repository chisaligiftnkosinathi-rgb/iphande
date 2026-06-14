import os
import re

FILES = [
    ("app/tools/inventory-tracker.tsx", "Steward Tools", "Inventory Tracker", "Record materials, stock, and costs securely.", "Formula: Quantity × Unit Cost"),
    ("app/tools/calculator.tsx", "Steward Tools", "Quote Builder", "Prepare quick service quotes for customers.", "Formula: Sum of line items + VAT"),
    ("app/tools/proof-of-work.tsx", "Steward Tools", "Proof of Work", "Record completed work and customer outcomes.", None),
    ("app/tools/documents.tsx", "Steward Tools", "Documents Tracker", "View saved quotes and business documents.", None),
    ("app/tools/referrals.tsx", "Steward Tools", "Referral Program", "Invite stewards and earn rewards.", None),
    ("app/expenses/index.tsx", "Steward Planner", "Expense Tracker", "Track business expenses and view summaries.", None),
    ("app/expenses/create.tsx", "Steward Planner", "Record Expense", "Log a new business expense.", "Formula: Actual amount recorded"),
    ("app/public/advertise.tsx", "Public Ecosystem", "Advertise", "Share your opportunity with the community.", None),
    ("app/profile/settings.tsx", "Account", "Settings", "Manage your steward profile settings.", None),
    ("app/support/index.tsx", "Help Center", "Support", "Get help and guidance for your business.", None),
    ("app/support/giving.tsx", "Help Center", "Voluntary Giving", "Contribute to the steward ecosystem.", None),
    ("app/legal/index.tsx", "Legal", "Legal & Privacy", "Important terms and conditions.", None),
    ("app/legal/privacy.tsx", "Legal", "Privacy Policy", "How we protect your data.", None),
    ("app/legal/acknowledgements.tsx", "Legal", "Acknowledgements", "Open source credits and attributions.", None),
    ("app/admin/payments.tsx", "Admin", "Payment Review", "Review platform payments.", None),
]

BASE_DIR = "c:/Projects/iphande/mobile-v1-clean"

def process_file(filepath, eyebrow, title, subtitle, formula):
    full_path = os.path.join(BASE_DIR, filepath)
    if not os.path.exists(full_path):
        print(f"File not found: {filepath}")
        return

    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Add PageHeader import
    if "PageHeader" not in content:
        # Find last import
        imports = re.findall(r"^import\s+.*?;$", content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            content = content.replace(last_import, f"{last_import}\nimport {{ PageHeader }} from '../../src/components/PageHeader';")
        else:
            content = f"import {{ PageHeader }} from '../../src/components/PageHeader';\n" + content

    # Replace <View style={styles.header}>...</View> with PageHeader
    header_pattern = re.compile(r"<View\s+style=\{styles\.header\}>.*?</View>", re.DOTALL)
    
    page_header_code = f"""<PageHeader 
                eyebrow="{eyebrow}" 
                title="{title}" 
                subtitle="{subtitle}" 
            />"""
    
    content = header_pattern.sub(page_header_code, content)

    # Insert formula helper
    if formula and formula not in content:
        # We look for something like <Text style={styles.sectionTitle}>Ledger</Text> or similar where it makes sense
        # E.g. in inventory: <Text style={styles.sectionTitle}>Item Details</Text>
        # Let's just insert it after the first sectionTitle
        section_pattern = re.compile(r"(<Text\s+style=\{styles\.sectionTitle\}>[^<]+</Text>)")
        match = section_pattern.search(content)
        if match:
            if "formulaHelper" not in content:
                # Add formulaHelper to styles
                content = content.replace("sectionTitle: {", "formulaHelper: { fontSize: 13, color: '#6B7280', marginBottom: 16, fontStyle: 'italic' },\n    sectionTitle: {")
            
            replacement = match.group(1) + f"\n                    <Text style={{styles.formulaHelper}}>{formula}</Text>"
            content = content.replace(match.group(1), replacement, 1)

    # Replace styles to match Wave 2 design specs
    # Container background: #F9FAFB -> #F8FAFC
    content = content.replace("backgroundColor: '#F9FAFB'", "backgroundColor: '#F8FAFC'")
    
    # Remove header style since it's no longer used
    content = re.sub(r"header:\s*\{[^}]*\},\s*", "", content)
    content = re.sub(r"kicker:\s*\{[^}]*\},\s*", "", content)
    content = re.sub(r"title:\s*\{[^}]*\},\s*", "", content)
    content = re.sub(r"subtitle:\s*\{[^}]*\},\s*", "", content)

    # Card border radius 12 -> 16, mb 20 -> 24
    content = re.sub(r"card:\s*\{([^}]*)borderRadius:\s*12([^}]*)marginBottom:\s*20([^}]*)\}", r"card: {\1borderRadius: 16\2marginBottom: 24\3}", content)
    
    # Input border radius 8 -> 12, padding 12 -> 14, bg -> #FFFFFF, border #E5E7EB -> #D1D5DB
    content = re.sub(r"input:\s*\{([^}]*)backgroundColor:\s*'#F9FAFB'([^}]*)borderColor:\s*'#E5E7EB'([^}]*)borderRadius:\s*8([^}]*)padding:\s*12([^}]*)\}", 
                     r"input: {\1backgroundColor: '#FFFFFF'\2borderColor: '#D1D5DB'\3borderRadius: 12\4padding: 14\5}", content)
    
    # derivedBox
    content = re.sub(r"derivedBox:\s*\{([^}]*)backgroundColor:\s*'#F3F4F6'([^}]*)borderRadius:\s*8([^}]*)\}", r"derivedBox: {\1backgroundColor: '#F8FAFC'\2borderRadius: 12\3}", content)

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Updated {filepath}")

for f in FILES:
    process_file(*f)
