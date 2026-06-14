Attribute VB_Name = "modReadinessStagingSetup"
Option Explicit

' iPhande VBA - Readiness Audit Staging Setup
' Purpose: Builds the visible staging area for the append helper on ReadinessAudit.
' Constraints: No UserForms. Visible input cells only.

Public Sub SetupReadinessStagingArea()
    Dim wsAudit As Worksheet
    Dim btnAppend As Button

    On Error Resume Next
    Set wsAudit = ThisWorkbook.Worksheets("ReadinessAudit")
    On Error GoTo 0

    If wsAudit Is Nothing Then
        MsgBox "ReadinessAudit sheet not found. Please run SetupReadinessAudit first.", vbCritical
        Exit Sub
    End If

    ' 1. Build Staging Labels
    wsAudit.Range("L3").Value = "Append Readiness Review Entry"
    wsAudit.Range("L3").Font.Bold = True
    wsAudit.Range("L5").Value = "ToolKey"
    wsAudit.Range("L6").Value = "PreviousStatus"
    wsAudit.Range("L7").Value = "NewStatus"
    wsAudit.Range("L8").Value = "ChangedBy"
    wsAudit.Range("L9").Value = "Reason"
    wsAudit.Range("L10").Value = "EvidenceNote"

    ' 2. Format Input Area
    wsAudit.Range("M5:M10").Interior.Color = RGB(250, 250, 250) ' Very light gray
    wsAudit.Range("M5:M10").Borders.LineStyle = xlContinuous
    wsAudit.Range("M5:M10").Borders.Color = RGB(200, 200, 200)

    ' 3. Apply Validation to ToolKey
    With wsAudit.Range("M5").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:="=INDIRECT(""tblToolSurfaces[ToolKey]"")"
        .IgnoreBlank = True
        .InCellDropdown = True
        .ShowError = False
    End With

    ' 4. Apply Validation to Statuses
    With wsAudit.Range("M6:M7").Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:="Not Started, In Review, Ready, Deferred"
        .IgnoreBlank = True
        .InCellDropdown = True
        .ShowError = False
    End With

    wsAudit.Columns("L:M").AutoFit

    MsgBox "Staging area established. Please manually insert a Form Button near L12 and assign the 'AppendReadinessEntry' macro.", vbInformation, "Steward Governance"
End Sub
