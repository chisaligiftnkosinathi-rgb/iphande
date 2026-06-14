import re

with open('tools/vba/exports/modIphandeApiClient.bas', 'r') as f:
    content = f.read()

# Make sure we add headers nicely to existing Syncs
content = re.sub(r'(ws\.Range\("A1"\)\.Resize.*?\.Value = headers)',
                 r'ws.Range("A1").Value = "STATUS: CONNECTED TO API"\n    ws.Range("A1").Font.Bold = True\n    ws.Range("A1").Font.Color = RGB(0, 128, 0)\n    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers',
                 content)
content = re.sub(r'ws\.Range\("A1:I1"\)', 'ws.Range("A2:I2")', content)
content = re.sub(r'ws\.Range\("A1:O1"\)', 'ws.Range("A2:O2")', content)

content = content.replace('rowIdx = 2', 'rowIdx = 3')
content = content.replace('ws.Range("A2").Value = "No pending', 'ws.Range("A3").Value = "No pending')
content = content.replace('ws.Range("A2").Value = "No stewards', 'ws.Range("A3").Value = "No stewards')

new_syncs = '''
' =========================================================================
' OPPORTUNITIES SYNC
' =========================================================================
Public Sub SyncOpportunitiesRegistry()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("OpportunitiesRegistry")
    On Error GoTo ErrorHandler

    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "OpportunitiesRegistry"
    End If

    ws.Cells.Clear
    ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Color = RGB(0, 128, 0)
    
    Dim headers As Variant
    headers = Array("ID", "Profile ID", "Title", "Status", "Province", "City", "Category", "Budget", "Contact Name", "Created At", "Last Synced")
    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A2:K2").Font.Bold = True
    ws.Range("A2:K2").Interior.Color = RGB(232, 223, 208)

    Dim json As String
    json = FetchAllOpportunities()

    If Len(json) <= 2 Then
        ws.Range("A3").Value = "No opportunities found."
        ws.Columns.AutoFit
        Exit Sub
    End If

    Dim records() As String
    records = Split(Mid(json, 3, Len(json) - 4), "},{")

    Dim i As Long, rowIdx As Long
    rowIdx = 3

    For i = LBound(records) To UBound(records)
        ws.Cells(rowIdx, 1).Value = ExtractString(records(i), "id")
        ws.Cells(rowIdx, 2).Value = ExtractString(records(i), "profile_id")
        ws.Cells(rowIdx, 3).Value = ExtractString(records(i), "title")
        ws.Cells(rowIdx, 4).Value = ExtractString(records(i), "status")
        ws.Cells(rowIdx, 5).Value = ExtractString(records(i), "province")
        ws.Cells(rowIdx, 6).Value = ExtractString(records(i), "town_or_city")
        ws.Cells(rowIdx, 7).Value = ExtractString(records(i), "category_key")
        ws.Cells(rowIdx, 8).Value = ExtractString(records(i), "budget_amount")
        ws.Cells(rowIdx, 9).Value = ExtractString(records(i), "contact_name")
        ws.Cells(rowIdx, 10).Value = ExtractString(records(i), "created_at")
        ws.Cells(rowIdx, 11).Value = Now
        rowIdx = rowIdx + 1
    Next i

    ws.Columns.AutoFit
    MsgBox "Opportunities Registry synced.", vbInformation
    Exit Sub
ErrorHandler:
    MsgBox "Failed to sync Opportunities: " & Err.Description, vbCritical
End Sub

' =========================================================================
' QUOTES SYNC
' =========================================================================
Public Sub SyncQuotesRegistry()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("QuotesRegistry")
    On Error GoTo ErrorHandler

    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "QuotesRegistry"
    End If

    ws.Cells.Clear
    ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Color = RGB(0, 128, 0)
    
    Dim headers As Variant
    headers = Array("ID", "Business ID", "Customer Name", "Service Needed", "Status", "Preferred Date", "Created At", "Last Synced")
    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A2:H2").Font.Bold = True
    ws.Range("A2:H2").Interior.Color = RGB(232, 223, 208)

    Dim json As String
    json = FetchAllQuoteRequests()

    If Len(json) <= 2 Then
        ws.Range("A3").Value = "No quote requests found."
        ws.Columns.AutoFit
        Exit Sub
    End If

    Dim records() As String
    records = Split(Mid(json, 3, Len(json) - 4), "},{")

    Dim i As Long, rowIdx As Long
    rowIdx = 3

    For i = LBound(records) To UBound(records)
        ws.Cells(rowIdx, 1).Value = ExtractString(records(i), "id")
        ws.Cells(rowIdx, 2).Value = ExtractString(records(i), "business_owner_id")
        ws.Cells(rowIdx, 3).Value = ExtractString(records(i), "customer_name")
        ws.Cells(rowIdx, 4).Value = ExtractString(records(i), "service_needed")
        ws.Cells(rowIdx, 5).Value = ExtractString(records(i), "status")
        ws.Cells(rowIdx, 6).Value = ExtractString(records(i), "preferred_date")
        ws.Cells(rowIdx, 7).Value = ExtractString(records(i), "created_at")
        ws.Cells(rowIdx, 8).Value = Now
        rowIdx = rowIdx + 1
    Next i

    ws.Columns.AutoFit
    MsgBox "Quotes Registry synced.", vbInformation
    Exit Sub
ErrorHandler:
    MsgBox "Failed to sync Quotes: " & Err.Description, vbCritical
End Sub

' =========================================================================
' REFERRALS SYNC
' =========================================================================
Public Sub SyncReferralsQueue()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("ReferralsQueue")
    On Error GoTo ErrorHandler

    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "ReferralsQueue"
    End If

    ws.Cells.Clear
    ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Color = RGB(0, 128, 0)
    
    Dim headers As Variant
    headers = Array("ID", "Referrer ID", "Referred ID", "Code", "Status", "Reward Amount", "Created At", "Last Synced")
    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A2:H2").Font.Bold = True
    ws.Range("A2:H2").Interior.Color = RGB(232, 223, 208)

    Dim json As String
    json = FetchPendingReferrals()

    If Len(json) <= 2 Then
        ws.Range("A3").Value = "No pending referrals found."
        ws.Columns.AutoFit
        Exit Sub
    End If

    Dim records() As String
    records = Split(Mid(json, 3, Len(json) - 4), "},{")

    Dim i As Long, rowIdx As Long
    rowIdx = 3

    For i = LBound(records) To UBound(records)
        ws.Cells(rowIdx, 1).Value = ExtractString(records(i), "id")
        ws.Cells(rowIdx, 2).Value = ExtractString(records(i), "referrer_profile_id")
        ws.Cells(rowIdx, 3).Value = ExtractString(records(i), "referred_profile_id")
        ws.Cells(rowIdx, 4).Value = ExtractString(records(i), "referral_code")
        ws.Cells(rowIdx, 5).Value = ExtractString(records(i), "status")
        ws.Cells(rowIdx, 6).Value = ExtractString(records(i), "reward_amount")
        ws.Cells(rowIdx, 7).Value = ExtractString(records(i), "created_at")
        ws.Cells(rowIdx, 8).Value = Now
        rowIdx = rowIdx + 1
    Next i

    ws.Columns.AutoFit
    MsgBox "Referrals Queue synced.", vbInformation
    Exit Sub
ErrorHandler:
    MsgBox "Failed to sync Referrals: " & Err.Description, vbCritical
End Sub

' =========================================================================
' EXPENSE SUMMARY SYNC
' =========================================================================
Public Sub SyncExpenseSummary()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("ExpenseSummary")
    On Error GoTo ErrorHandler

    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "ExpenseSummary"
    End If

    ws.Cells.Clear
    ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Color = RGB(0, 128, 0)
    
    Dim headers As Variant
    headers = Array("Summary Output", "Last Synced")
    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A2:B2").Font.Bold = True
    ws.Range("A2:B2").Interior.Color = RGB(232, 223, 208)

    Dim json As String
    json = FetchExpenseSummary()

    ws.Cells(3, 1).Value = json
    ws.Cells(3, 2).Value = Now

    ws.Columns.AutoFit
    MsgBox "Expense Summary synced.", vbInformation
    Exit Sub
ErrorHandler:
    MsgBox "Failed to sync Expense Summary: " & Err.Description, vbCritical
End Sub

' =========================================================================
' CONTINUITY LEDGER SYNC
' =========================================================================
Public Sub SyncContinuityLedger()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("ContinuityLedger")
    On Error GoTo ErrorHandler

    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "ContinuityLedger"
    End If

    ws.Cells.Clear
    ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Color = RGB(0, 128, 0)
    
    Dim headers As Variant
    headers = Array("ID", "Lineage Sequence", "Subject ID", "Subject Type", "Predicate", "State Key", "State Value", "Domain Name", "Timestamp", "Last Synced")
    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A2:J2").Font.Bold = True
    ws.Range("A2:J2").Interior.Color = RGB(232, 223, 208)

    Dim json As String
    json = FetchContinuityEvents()

    If Len(json) <= 2 Then
        ws.Range("A3").Value = "No continuity events found."
        ws.Columns.AutoFit
        Exit Sub
    End If

    Dim records() As String
    records = Split(Mid(json, 3, Len(json) - 4), "},{")

    Dim i As Long, rowIdx As Long
    rowIdx = 3

    For i = LBound(records) To UBound(records)
        ws.Cells(rowIdx, 1).Value = ExtractString(records(i), "id")
        ws.Cells(rowIdx, 2).Value = ExtractString(records(i), "lineage_sequence")
        ws.Cells(rowIdx, 3).Value = ExtractString(records(i), "subject_id")
        ws.Cells(rowIdx, 4).Value = ExtractString(records(i), "subject_type")
        ws.Cells(rowIdx, 5).Value = ExtractString(records(i), "predicate")
        ws.Cells(rowIdx, 6).Value = ExtractString(records(i), "state_key")
        ws.Cells(rowIdx, 7).Value = ExtractString(records(i), "state_value")
        ws.Cells(rowIdx, 8).Value = ExtractString(records(i), "domain_name")
        ws.Cells(rowIdx, 9).Value = ExtractString(records(i), "created_at")
        ws.Cells(rowIdx, 10).Value = Now
        rowIdx = rowIdx + 1
    Next i

    ws.Columns.AutoFit
    MsgBox "Continuity Ledger synced.", vbInformation
    Exit Sub
ErrorHandler:
    MsgBox "Failed to sync Continuity Ledger: " & Err.Description, vbCritical
End Sub
'''
content = content.replace("' =========================================================================\n' 3. UTILITY FUNCTIONS", new_syncs + "\n' =========================================================================\n' 3. UTILITY FUNCTIONS")

with open('tools/vba/exports/modIphandeApiClient.bas', 'w') as f:
    f.write(content)
