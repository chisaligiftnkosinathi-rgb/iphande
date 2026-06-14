Attribute VB_Name = "modAppendReadinessAudit"
Option Explicit

' iPhande VBA - Append Readiness Entry Helper
' Purpose: Reads the visible staging area and appends exactly one row to tblReadinessAudit.
' Constraints: No inference, no mutation of readiness, no API calls.

Public Sub AppendReadinessEntry()
    Dim wsAudit As Worksheet
    Dim wsDashboard As Worksheet
    Dim wsTools As Worksheet
    Dim loAudit As ListObject
    Dim newRow As ListRow

    ' Input Variables
    Dim inToolKey As String
    Dim inPrevStatus As String
    Dim inNewStatus As String
    Dim inChangedBy As String
    Dim inReason As String
    Dim inEvidence As String

    ' Auto-generated / Looked-up Variables
    Dim outAuditID As String
    Dim outArchetype As String
    Dim outToolLabel As String
    Dim lookupResult As Variant

    Set wsAudit = ThisWorkbook.Worksheets("ReadinessAudit")
    Set wsDashboard = ThisWorkbook.Worksheets("Dashboard")
    Set wsTools = ThisWorkbook.Worksheets("ToolSurfaceRegistry")
    Set loAudit = wsAudit.ListObjects("tblReadinessAudit")

    ' 1. Read Staging Area
    inToolKey = Trim(wsAudit.Range("M5").Value)
    inPrevStatus = Trim(wsAudit.Range("M6").Value)
    inNewStatus = Trim(wsAudit.Range("M7").Value)
    inChangedBy = Trim(wsAudit.Range("M8").Value)
    inReason = Trim(wsAudit.Range("M9").Value)
    inEvidence = Trim(wsAudit.Range("M10").Value)

    ' 2. Guardrails: Require explicit declaration
    If inToolKey = "" Or inNewStatus = "" Or inChangedBy = "" Or inReason = "" Then
        MsgBox "Cannot append: ToolKey, NewStatus, ChangedBy, and Reason are required fields.", vbExclamation, "Governance Boundary"
        Exit Sub
    End If

    ' 3. Hydrate Context Safely
    outArchetype = wsDashboard.Range("B5").Value

    lookupResult = Application.VLookup(inToolKey, wsTools.Range("tblToolSurfaces"), 2, False)
    If IsError(lookupResult) Then
        outToolLabel = "Unknown Tool"
    Else
        outToolLabel = CStr(lookupResult)
    End If

    outAuditID = "AUD-" & Format(Now, "YYYYMMDD-HHNNSS")

    ' 4. Append to Table (Mutation Boundary)
    Set newRow = loAudit.ListRows.Add(AlwaysInsert:=True)

    newRow.Range(1, loAudit.ListColumns("AuditID").Index).Value = outAuditID
    newRow.Range(1, loAudit.ListColumns("ArchetypeKey").Index).Value = outArchetype
    newRow.Range(1, loAudit.ListColumns("ToolKey").Index).Value = inToolKey
    newRow.Range(1, loAudit.ListColumns("ToolLabel").Index).Value = outToolLabel
    newRow.Range(1, loAudit.ListColumns("PreviousStatus").Index).Value = inPrevStatus
    newRow.Range(1, loAudit.ListColumns("NewStatus").Index).Value = inNewStatus
    newRow.Range(1, loAudit.ListColumns("ChangedBy").Index).Value = inChangedBy
    newRow.Range(1, loAudit.ListColumns("ChangedAt").Index).Value = Now
    newRow.Range(1, loAudit.ListColumns("Reason").Index).Value = inReason
    newRow.Range(1, loAudit.ListColumns("EvidenceNote").Index).Value = inEvidence

    ' 5. Clear Staging Inputs (Reducing Friction)
    wsAudit.Range("M5:M10").ClearContents

    ' Success
    MsgBox "STATUS: LOCAL ONLY.\n\nReadiness audit entry appended successfully. Please remember to update the StewardReadiness checklist status directly if you have not already.", vbInformation, "Append Complete"

End Sub
