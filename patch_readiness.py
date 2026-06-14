import re

# 1. modStewardReadinessSetup.bas
with open('tools/vba/exports/modStewardReadinessSetup.bas', 'r') as f:
    content = f.read()

content = content.replace("wsReadiness.Cells.Clear ' Clear for idempotent setup", 
                          "wsReadiness.Cells.Clear ' Clear for idempotent setup\n    wsReadiness.Range(\"A1\").Value = \"STATUS: LOCAL ONLY - NOT CONNECTED TO API\"\n    wsReadiness.Range(\"A1\").Font.Bold = True\n    wsReadiness.Range(\"A1\").Font.Color = RGB(128, 128, 128)\n")

# Shift headers
content = content.replace('wsReadiness.Range("A1").Value = "ToolKey"', 'wsReadiness.Range("A2").Value = "ToolKey"')
content = content.replace('wsReadiness.Range("B1").Value = "ToolLabel"', 'wsReadiness.Range("B2").Value = "ToolLabel"')
content = content.replace('wsReadiness.Range("C1").Value = "Purpose"', 'wsReadiness.Range("C2").Value = "Purpose"')
content = content.replace('wsReadiness.Range("D1").Value = "SheetName"', 'wsReadiness.Range("D2").Value = "SheetName"')
content = content.replace('wsReadiness.Range("E1").Value = "RequiredForReadiness"', 'wsReadiness.Range("E2").Value = "RequiredForReadiness"')
content = content.replace('wsReadiness.Range("F1").Value = "AppliesToArchetype"', 'wsReadiness.Range("F2").Value = "AppliesToArchetype"')
content = content.replace('wsReadiness.Range("G1").Value = "ReadinessStatus"', 'wsReadiness.Range("G2").Value = "ReadinessStatus"')
content = content.replace('wsReadiness.Range("H1").Value = "StewardNote"', 'wsReadiness.Range("H2").Value = "StewardNote"')
content = content.replace('wsReadiness.Range("I1").Value = "LastReviewedAt"', 'wsReadiness.Range("I2").Value = "LastReviewedAt"')
content = content.replace('wsReadiness.Range("J1").Value = "ContinuityBoundary"', 'wsReadiness.Range("J2").Value = "ContinuityBoundary"')
content = content.replace('wsToolSurfaces.Range("A2:A" & lastRow).Copy Destination:=wsReadiness.Range("A2")', 'wsToolSurfaces.Range("A2:A" & lastRow).Copy Destination:=wsReadiness.Range("A3")')
content = content.replace('xlSrcRange, wsReadiness.Range("A1").CurrentRegion', 'xlSrcRange, wsReadiness.Range("A2").CurrentRegion')

with open('tools/vba/exports/modStewardReadinessSetup.bas', 'w') as f:
    f.write(content)

# 2. modReadinessAuditSetup.bas
with open('tools/vba/exports/modReadinessAuditSetup.bas', 'r') as f:
    content = f.read()

content = content.replace("wsAudit.Cells.Clear ' Clear for idempotent setup", 
                          "wsAudit.Cells.Clear ' Clear for idempotent setup\n    wsAudit.Range(\"A1\").Value = \"STATUS: LOCAL ONLY - NOT CONNECTED TO API\"\n    wsAudit.Range(\"A1\").Font.Bold = True\n    wsAudit.Range(\"A1\").Font.Color = RGB(128, 128, 128)\n")

# Shift governance note
content = content.replace('wsAudit.Range("A1").Value = "GOVERNANCE NOTE', 'wsAudit.Range("A2").Value = "GOVERNANCE NOTE')
content = content.replace('wsAudit.Range("A1").Font.Bold = True', 'wsAudit.Range("A2").Font.Bold = True')
content = content.replace('wsAudit.Range("A1").Font.Color = RGB(108, 117, 125)', 'wsAudit.Range("A2").Font.Color = RGB(108, 117, 125)')

content = content.replace('wsAudit.Range("A3").Value = "AuditID"', 'wsAudit.Range("A4").Value = "AuditID"')
content = content.replace('wsAudit.Range("B3").Value = "ArchetypeKey"', 'wsAudit.Range("B4").Value = "ArchetypeKey"')
content = content.replace('wsAudit.Range("C3").Value = "ToolKey"', 'wsAudit.Range("C4").Value = "ToolKey"')
content = content.replace('wsAudit.Range("D3").Value = "ToolLabel"', 'wsAudit.Range("D4").Value = "ToolLabel"')
content = content.replace('wsAudit.Range("E3").Value = "PreviousStatus"', 'wsAudit.Range("E4").Value = "PreviousStatus"')
content = content.replace('wsAudit.Range("F3").Value = "NewStatus"', 'wsAudit.Range("F4").Value = "NewStatus"')
content = content.replace('wsAudit.Range("G3").Value = "ChangedBy"', 'wsAudit.Range("G4").Value = "ChangedBy"')
content = content.replace('wsAudit.Range("H3").Value = "ChangedAt"', 'wsAudit.Range("H4").Value = "ChangedAt"')
content = content.replace('wsAudit.Range("I3").Value = "Reason"', 'wsAudit.Range("I4").Value = "Reason"')
content = content.replace('wsAudit.Range("J3").Value = "EvidenceNote"', 'wsAudit.Range("J4").Value = "EvidenceNote"')

content = content.replace('wsAudit.Range("A4").Value = ""', 'wsAudit.Range("A5").Value = ""')
content = content.replace('xlSrcRange, wsAudit.Range("A3").CurrentRegion', 'xlSrcRange, wsAudit.Range("A4").CurrentRegion')

with open('tools/vba/exports/modReadinessAuditSetup.bas', 'w') as f:
    f.write(content)

# 3. modAppendReadinessAudit.bas
with open('tools/vba/exports/modAppendReadinessAudit.bas', 'r') as f:
    content = f.read()

content = content.replace('MsgBox "Readiness audit entry appended successfully.', 'MsgBox "STATUS: LOCAL ONLY.\\n\\nReadiness audit entry appended successfully.')

with open('tools/vba/exports/modAppendReadinessAudit.bas', 'w') as f:
    f.write(content)
