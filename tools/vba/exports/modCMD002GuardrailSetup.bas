Attribute VB_Name = "modCMD002GuardrailSetup"
Option Explicit

' iPhande VBA - CMD002 Readiness Guardrail Setup
' Purpose: Applies formula-driven CMD002 readiness guardrails to the Dashboard.
' Constraints: Formula-only visibility. No execution triggers.

Public Sub SetupCMD002ReadinessGuardrail()
    Dim wsDashboard As Worksheet

    On Error Resume Next
    Set wsDashboard = ThisWorkbook.Worksheets("Dashboard")
    On Error GoTo 0

    If wsDashboard Is Nothing Then
        MsgBox "Dashboard sheet not found.", vbCritical
        Exit Sub
    End If

    ' 1. Set up Labels in Column A
    wsDashboard.Range("A8").Value = "Required Tools Count"
    wsDashboard.Range("A9").Value = "Ready Required Tools Count"
    wsDashboard.Range("A10").Value = "CMD002 Ready?"
    wsDashboard.Range("A11").Value = "CMD002 Readiness Explanation"

    ' 2. Apply Formulas in Column B
    wsDashboard.Range("B8").Formula = "=COUNTIFS(tblReadinessChecklist[AppliesToArchetype],TRUE,tblReadinessChecklist[RequiredForReadiness],TRUE)"
    wsDashboard.Range("B9").Formula = "=COUNTIFS(tblReadinessChecklist[AppliesToArchetype],TRUE,tblReadinessChecklist[RequiredForReadiness],TRUE,tblReadinessChecklist[ReadinessStatus],""Ready"")"
    wsDashboard.Range("B10").Formula = "=AND(B8>0,B8=B9)"
    wsDashboard.Range("B11").Formula = "=IF(B10,""CMD002 readiness prepared by steward declaration."",""CMD002 not ready: required readiness items remain incomplete."")"

    ' 3. Add Governance Note
    wsDashboard.Range("A12").Value = "GOVERNANCE NOTE: Readiness enables review. It does not execute commands."
    wsDashboard.Range("A12:B12").Merge
    wsDashboard.Range("A12").Font.Italic = True
    wsDashboard.Range("A12").Font.Color = RGB(108, 117, 125) ' Slate Muted

    wsDashboard.Columns("A:B").AutoFit

    MsgBox "CMD002 formula-only readiness guardrail established on Dashboard!B8:B11.", vbInformation, "Steward Governance"
End Sub
