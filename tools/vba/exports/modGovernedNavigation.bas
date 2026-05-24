Attribute VB_Name = "modGovernedNavigation"
Option Explicit

Public Sub GoToResolvedNavigation()
    Dim dashboard As Worksheet
    Dim targetSheet As Worksheet
    Dim commandId As String
    Dim canExecute As Boolean
    Dim targetSheetName As String
    Dim targetCellAddress As String
    Dim note As String

    Set dashboard = ThisWorkbook.Worksheets("Dashboard")

    commandId = Trim$(CStr(dashboard.Range("B33").Value))
    targetSheetName = Trim$(CStr(dashboard.Range("B17").Value))
    targetCellAddress = Trim$(CStr(dashboard.Range("B18").Value))
    canExecute = (UCase$(Trim$(CStr(dashboard.Range("B37").Value))) = "TRUE")

    If commandId <> "CMD001" Then
        AppendAdminAction "command_refused", "Dashboard", targetSheetName, targetCellAddress, "", "Selected command is not CMD001. Navigation refused."
        MsgBox "Navigation refused: selected command is not CMD001.", vbExclamation, "iPhande Guardrail"
        Exit Sub
    End If

    If Not canExecute Then
        AppendAdminAction "command_refused", "Dashboard", targetSheetName, targetCellAddress, "", "CanExecuteCommand is FALSE. Navigation refused."
        MsgBox "Navigation refused: CanExecuteCommand is FALSE.", vbExclamation, "iPhande Guardrail"
        Exit Sub
    End If

    If targetSheetName = "" Or targetCellAddress = "" Or targetSheetName = "Not found" Or targetCellAddress = "Not found" Then
        AppendAdminAction "navigation_blocked", "Dashboard", targetSheetName, targetCellAddress, "", "Resolved navigation target is missing."
        MsgBox "Navigation blocked: resolved target is missing.", vbExclamation, "iPhande Guardrail"
        Exit Sub
    End If

    On Error Resume Next
    Set targetSheet = ThisWorkbook.Worksheets(targetSheetName)
    On Error GoTo 0

    If targetSheet Is Nothing Then
        AppendAdminAction "navigation_blocked", "Dashboard", targetSheetName, targetCellAddress, "", "Resolved target sheet does not exist."
        MsgBox "Navigation blocked: target sheet does not exist.", vbExclamation, "iPhande Guardrail"
        Exit Sub
    End If

    targetSheet.Activate
    targetSheet.Range(targetCellAddress).Select

    note = "Executed CMD001 navigation to " & targetSheetName & "!" & targetCellAddress
    AppendAdminAction "navigation_executed", "Dashboard", targetSheetName, targetCellAddress, "", note
End Sub

Private Sub AppendAdminAction(ByVal actionType As String, ByVal sourceSheet As String, ByVal targetSheet As String, ByVal targetCell As String, ByVal replayEventId As String, ByVal actionNote As String)
    Dim actions As Worksheet
    Dim dashboard As Worksheet
    Dim nextRow As Long
    Dim nextId As String

    Set actions = ThisWorkbook.Worksheets("AdminActions")
    Set dashboard = ThisWorkbook.Worksheets("Dashboard")

    nextRow = actions.Cells(actions.Rows.Count, 1).End(xlUp).Row + 1
    nextId = "ACT" & Format$(nextRow - 1, "000")

    actions.Cells(nextRow, 1).Value = nextId
    actions.Cells(nextRow, 2).Value = Format$(Now, "yyyy-mm-dd hh:nn:ss")
    actions.Cells(nextRow, 3).Value = "Steward"
    actions.Cells(nextRow, 4).Value = actionType
    actions.Cells(nextRow, 5).Value = sourceSheet
    actions.Cells(nextRow, 6).Value = targetSheet
    actions.Cells(nextRow, 7).Value = targetCell
    actions.Cells(nextRow, 8).Value = dashboard.Range("B7").Value
    actions.Cells(nextRow, 9).Value = dashboard.Range("B8").Value
    actions.Cells(nextRow, 10).Value = replayEventId
    actions.Cells(nextRow, 11).Value = actionNote
End Sub
