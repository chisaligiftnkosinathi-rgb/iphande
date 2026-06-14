Attribute VB_Name = "modReadinessAuditSetup"
Option Explicit

' iPhande VBA - Readiness Audit Setup
' Purpose: Builds the manual append-only ReadinessAudit ledger.
' Constraints: No Worksheet_Change events, manual entry only, strict vocabulary.

Public Sub SetupReadinessAudit()
    Dim wsAudit As Worksheet
    Dim loAudit As ListObject

    ' 1. Audit Sheet Setup
    On Error Resume Next
    Set wsAudit = ThisWorkbook.Worksheets("ReadinessAudit")
    If wsAudit Is Nothing Then
        Set wsAudit = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets("StewardReadiness"))
        wsAudit.Name = "ReadinessAudit"
    End If
    On Error GoTo 0

    wsAudit.Cells.Clear ' Clear for idempotent setup
    wsAudit.Range("A1").Value = "STATUS: LOCAL ONLY - NOT CONNECTED TO API"
    wsAudit.Range("A2").Font.Bold = True
    wsAudit.Range("A1").Font.Color = RGB(128, 128, 128)


    ' 2. Establish Governance Note
    wsAudit.Range("A2").Value = "GOVERNANCE NOTE: Audit records readiness changes. It does not enforce readiness. Audit should be deliberate before it becomes automatic."
    wsAudit.Range("A2").Font.Bold = True
    wsAudit.Range("A2").Font.Color = RGB(108, 117, 125) ' Slate Muted

    ' 3. Establish Headers
    wsAudit.Range("A4").Value = "AuditID"
    wsAudit.Range("B4").Value = "ArchetypeKey"
    wsAudit.Range("C4").Value = "ToolKey"
    wsAudit.Range("D4").Value = "ToolLabel"
    wsAudit.Range("E4").Value = "PreviousStatus"
    wsAudit.Range("F4").Value = "NewStatus"
    wsAudit.Range("G4").Value = "ChangedBy"
    wsAudit.Range("H4").Value = "ChangedAt"
    wsAudit.Range("I4").Value = "Reason"
    wsAudit.Range("J4").Value = "EvidenceNote"

    ' 4. Seed blank row for DataBodyRange compatibility
    wsAudit.Range("A5").Value = "" ' Ensures DataBodyRange is not Nothing

    ' 5. Create Governed Table
    ' Use CurrentRegion to include the seeded blank row
    Set loAudit = wsAudit.ListObjects.Add(xlSrcRange, wsAudit.Range("A4").CurrentRegion, , xlYes)
    loAudit.Name = "tblReadinessAudit"

    ' 6. Apply Gentle Data Validation for Statuses
    Dim statusValidationList As String
    statusValidationList = "Not Started, In Review, Ready, Deferred"

    With loAudit.ListColumns("PreviousStatus").DataBodyRange.Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:=statusValidationList
        .IgnoreBlank = True
        .InCellDropdown = True
        .ShowError = False
    End With

    With loAudit.ListColumns("NewStatus").DataBodyRange.Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:=statusValidationList
        .IgnoreBlank = True
        .InCellDropdown = True
        .ShowError = False
    End With

    wsAudit.Columns.AutoFit
    MsgBox "Manual ReadinessAudit ledger successfully established.", vbInformation, "Steward Governance"
End Sub
