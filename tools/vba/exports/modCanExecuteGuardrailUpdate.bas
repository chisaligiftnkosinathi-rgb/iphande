Attribute VB_Name = "modCanExecuteGuardrailUpdate"
Option Explicit

' iPhande VBA - CanExecuteCommand Guardrail Update
' Purpose: Wraps existing CanExecuteCommand formula with the CMD002 readiness gate.
' Constraints: Does not execute commands. Preserves prior guardrails.

Public Sub UpdateCanExecuteCommand()
    Dim wsDashboard As Worksheet
    Dim currentFormula As String
    Dim newFormula As String

    On Error Resume Next
    Set wsDashboard = ThisWorkbook.Worksheets("Dashboard")
    On Error GoTo 0

    If wsDashboard Is Nothing Then
        MsgBox "Dashboard sheet not found.", vbCritical
        Exit Sub
    End If

    ' 1. Safely wrap the existing formula
    If wsDashboard.Range("B37").HasFormula Then
        currentFormula = Mid(wsDashboard.Range("B37").Formula, 2) ' Strip the "="
        newFormula = "=AND(" & currentFormula & ", $B$10=TRUE)"
        wsDashboard.Range("B37").Formula = newFormula
    Else
        MsgBox "Dashboard!B37 is currently static or manual (" & wsDashboard.Range("B37").Value & "). Please manually update it to wrap the existing condition with AND(..., $B$10=TRUE).", vbExclamation, "Governance Boundary"
        Exit Sub
    End If

    ' 2. Inject Governance Explanation Nearby (Insert at Row 38 to push Session safely down)
    wsDashboard.Rows(38).Insert Shift:=xlDown
    wsDashboard.Range("A38").Value = "GOVERNANCE NOTE: CanExecuteCommand requires CMD002 readiness, but does not execute CMD002."
    wsDashboard.Range("A38").Font.Italic = True
    wsDashboard.Range("A38").Font.Color = RGB(108, 117, 125) ' Slate Muted

    MsgBox "CanExecuteCommand successfully wrapped to observe CMD002 readiness.", vbInformation, "Steward Governance"
End Sub
