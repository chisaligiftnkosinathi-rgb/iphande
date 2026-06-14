Attribute VB_Name = "modToolSurfaceRegistry"
Option Explicit

' iPhande VBA - Tool Surface Registry Setup
' Purpose: Builds the ToolSurfaceRegistry sheet to house the governed tool dictionary.
' Constraints: No command automation, read-only setup.

Public Sub SetupToolSurfaceRegistry()
    Dim wsRegistry As Worksheet
    Dim loSurfaces As ListObject

    ' 1. Establish Registry Sheet
    On Error Resume Next
    Set wsRegistry = ThisWorkbook.Worksheets("ToolSurfaceRegistry")
    If wsRegistry Is Nothing Then
        Set wsRegistry = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        wsRegistry.Name = "ToolSurfaceRegistry"
    End If
    On Error GoTo 0

    ' 2. Inform steward to import CSV data into this sheet here
    If wsRegistry.Range("A1").Value = "" Then
        MsgBox "ToolSurfaceRegistry sheet created. Please import ToolSurfaceRegistry.csv into cell A1, then run this script again to format the table.", vbInformation, "Steward Console"
        Exit Sub
    End If

    ' 3. Format as Governed Table
    On Error Resume Next
    Set loSurfaces = wsRegistry.ListObjects("tblToolSurfaces")
    If loSurfaces Is Nothing Then
        Set loSurfaces = wsRegistry.ListObjects.Add(xlSrcRange, wsRegistry.Range("A1").CurrentRegion, , xlYes)
        loSurfaces.Name = "tblToolSurfaces"
    End If
    On Error GoTo 0

    MsgBox "ToolSurfaceRegistry successfully established as tblToolSurfaces.", vbInformation, "Steward Governance"
End Sub
