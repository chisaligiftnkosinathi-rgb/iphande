Attribute VB_Name = "modArchetypeRegistry"
Option Explicit

' iPhande VBA - Archetype Registry Setup
' Purpose: Builds the ArchetypeRegistry sheet and binds validation dropdowns.
' Constraints: No command automation, read-only setup.

Public Sub SetupArchetypeRegistryAndValidation()
    Dim wsDashboard As Worksheet
    Dim wsRegistry As Worksheet
    Dim loArchetypes As ListObject
    Dim rngValidationTarget As Range
    Dim validationFormula As String

    ' 1. Establish Registry Sheet
    On Error Resume Next
    Set wsRegistry = ThisWorkbook.Worksheets("ArchetypeRegistry")
    If wsRegistry Is Nothing Then
        Set wsRegistry = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        wsRegistry.Name = "ArchetypeRegistry"
    End If
    On Error GoTo 0

    ' 2. Inform steward to import CSV data into this sheet here (Simulated structure)
    ' (In a full execution, QueryTables or Workbooks.OpenText would load ArchetypeRegistry.csv)
    If wsRegistry.Range("A1").Value = "" Then
        MsgBox "ArchetypeRegistry sheet created. Please import ArchetypeRegistry.csv into cell A1, then run this script again to apply validation.", vbInformation, "Steward Console"
        Exit Sub
    End If

    ' 3. Format as Governed Table
    On Error Resume Next
    Set loArchetypes = wsRegistry.ListObjects("tblArchetypes")
    If loArchetypes Is Nothing Then
        Set loArchetypes = wsRegistry.ListObjects.Add(xlSrcRange, wsRegistry.Range("A1").CurrentRegion, , xlYes)
        loArchetypes.Name = "tblArchetypes"
    End If
    On Error GoTo 0

    ' 4. Bind Data Validation to Dashboard
    Set wsDashboard = ThisWorkbook.Worksheets("Dashboard")

    ' Assume B5 is the designated cell for "Selected Onboarding Archetype" in the Console
    Set rngValidationTarget = wsDashboard.Range("B5")
    wsDashboard.Range("A5").Value = "Selected Archetype"

    validationFormula = "=INDIRECT(""tblArchetypes[ArchetypeKey]"")"

    With rngValidationTarget.Validation
        .Delete
        .Add Type:=xlValidateList, AlertStyle:=xlValidAlertStop, Operator:=xlBetween, Formula1:=validationFormula
        .IgnoreBlank = True
        .InCellDropdown = True
        .ShowError = True
        .ErrorTitle = "Governed Archetype Required"
        .ErrorMessage = "Please select a valid economic archetype from the registry."
    End With

    MsgBox "Archetype validation successfully bound to Dashboard!B5.", vbInformation, "Steward Governance"
End Sub
