Attribute VB_Name = "modStewardReadinessSetup"
Option Explicit

' iPhande VBA - Steward Readiness Setup
' Purpose: Builds the StewardReadiness sheet and formula-driven visibility.
' Constraints: No operational automation, no hidden rows, formula-first visibility.

Public Sub SetupStewardReadiness()
    Dim wsDashboard As Worksheet
    Dim wsReadiness As Worksheet
    Dim wsToolSurfaces As Worksheet
    Dim loReadiness As ListObject
    Dim lastRow As Long

    ' 1. Dashboard Resolution Setup
    On Error Resume Next
    Set wsDashboard = ThisWorkbook.Worksheets("Dashboard")
    On Error GoTo 0
    If wsDashboard Is Nothing Then
        MsgBox "Dashboard sheet not found. Setup aborted.", vbCritical
        Exit Sub
    End If

    wsDashboard.Range("A6").Value = "Resolved Core Screens"
    wsDashboard.Range("B6").Formula = "=IFERROR(VLOOKUP(B5, tblArchetypes, 6, FALSE), """")"

    ' 2. Readiness Sheet Setup
    On Error Resume Next
    Set wsReadiness = ThisWorkbook.Worksheets("StewardReadiness")
    If wsReadiness Is Nothing Then
        Set wsReadiness = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets("ToolSurfaceRegistry"))
        wsReadiness.Name = "StewardReadiness"
    End If
    Set wsToolSurfaces = ThisWorkbook.Worksheets("ToolSurfaceRegistry")
    On Error GoTo 0

    If wsToolSurfaces Is Nothing Then
        MsgBox "ToolSurfaceRegistry must be setup first.", vbCritical
        Exit Sub
    End If

    wsReadiness.Cells.Clear ' Clear for idempotent setup
    wsReadiness.Range("A1").Value = "STATUS: LOCAL ONLY - NOT CONNECTED TO API"
    wsReadiness.Range("A1").Font.Bold = True
    wsReadiness.Range("A1").Font.Color = RGB(128, 128, 128)


    ' 3. Establish Headers
    wsReadiness.Range("A2").Value = "ToolKey"
    wsReadiness.Range("B2").Value = "ToolLabel"
    wsReadiness.Range("C2").Value = "Purpose"
    wsReadiness.Range("D2").Value = "SheetName"
    wsReadiness.Range("E2").Value = "RequiredForReadiness"
    wsReadiness.Range("F2").Value = "AppliesToArchetype"
    wsReadiness.Range("G2").Value = "ReadinessStatus"
    wsReadiness.Range("H2").Value = "StewardNote"
    wsReadiness.Range("I2").Value = "LastReviewedAt"
    wsReadiness.Range("J2").Value = "ContinuityBoundary"

    ' 4. Inherit All Available ToolKeys
    lastRow = wsToolSurfaces.Cells(wsToolSurfaces.Rows.Count, "A").End(xlUp).Row
    If lastRow > 1 Then
        wsToolSurfaces.Range("A2:A" & lastRow).Copy Destination:=wsReadiness.Range("A3")
    End If

    ' 5. Idempotency guard for the governed table
    On Error Resume Next
    Set loReadiness = wsReadiness.ListObjects("tblReadinessChecklist")
    On Error GoTo 0
    If Not loReadiness Is Nothing Then
        loReadiness.Delete
    End If

    ' 6. Create Governed Table
    Set loReadiness = wsReadiness.ListObjects.Add(xlSrcRange, wsReadiness.Range("A2").CurrentRegion, , xlYes)
    loReadiness.Name = "tblReadinessChecklist"

    ' 7. Apply Formula Projection
    loReadiness.ListColumns("ToolLabel").DataBodyRange.Formula = "=IFERROR(VLOOKUP([@ToolKey], tblToolSurfaces, 2, FALSE), """")"
    loReadiness.ListColumns("Purpose").DataBodyRange.Formula = "=IFERROR(VLOOKUP([@ToolKey], tblToolSurfaces, 3, FALSE), """")"
    loReadiness.ListColumns("SheetName").DataBodyRange.Formula = "=IFERROR(VLOOKUP([@ToolKey], tblToolSurfaces, 4, FALSE), """")"
    loReadiness.ListColumns("RequiredForReadiness").DataBodyRange.Formula = "=IFERROR(VLOOKUP([@ToolKey], tblToolSurfaces, 6, FALSE), FALSE)"
    loReadiness.ListColumns("ContinuityBoundary").DataBodyRange.Formula = "=IFERROR(VLOOKUP([@ToolKey], tblToolSurfaces, 7, FALSE), """")"

    ' Bounded SEARCH with SUBSTITUTE to ignore whitespace variations in the CSV
    loReadiness.ListColumns("AppliesToArchetype").DataBodyRange.Formula = "=ISNUMBER(SEARCH("",""&[@SheetName]&"","", "",""&SUBSTITUTE(Dashboard!$B$6,"" "","""")&"",""))"

    ' 8. Apply Gentle Data Validation
    With loReadiness.ListColumns("ReadinessStatus").DataBodyRange.Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:="Not Started, In Review, Ready, Deferred"
        .IgnoreBlank = True
        .InCellDropdown = True
        .ShowError = False ' Allow typing notes but guide toward vocabulary
    End With

    ' 9. Apply Gentle Conditional Formatting (Illumination, not punishment)
    loReadiness.DataBodyRange.FormatConditions.Delete

    ' Rule 1: Dim Irrelevant Tools (Font gray, Background very light gray)
    With loReadiness.DataBodyRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=$F2=FALSE")
        .Font.Color = RGB(166, 166, 166)
        .Interior.Color = RGB(242, 242, 242)
        .StopIfTrue = False
    End With

    ' Rule 2: Illuminate Required Path (Font bold, Background soft green)
    With loReadiness.DataBodyRange.FormatConditions.Add(Type:=xlExpression, Formula1:="=AND($F2=TRUE, $E2=TRUE)")
        .Font.Bold = True
        .Interior.Color = RGB(230, 245, 230)
        .StopIfTrue = False
    End With

    wsReadiness.Columns.AutoFit
    MsgBox "StewardReadiness formula projection and gentle visibility established.", vbInformation, "Steward Governance"
End Sub
