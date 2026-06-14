Attribute VB_Name = "modIphandeApiClient"
Option Explicit

' -------------------------------------------------------------------------
' iPhande V1 API Client - The Live Bridge
' -------------------------------------------------------------------------

' Resolves the API Base URL from the Settings sheet if available, falling back to production
Private Function GetApiBaseUrl() As String
    On Error Resume Next
    Dim url As String
    url = ThisWorkbook.Sheets("Settings").Range("B2").Value ' Assuming B2 holds the URL
    On Error GoTo 0

    If Len(url) = 0 Then url = "https://iphande-production.up.railway.app/api/v1"
    GetApiBaseUrl = url
End Function

' Resolves the API Auth Token from the Settings sheet
Private Function GetApiAuthToken() As String
    On Error Resume Next
    Dim token As String
    token = ThisWorkbook.Sheets("Settings").Range("B3").Value
    On Error GoTo 0
    GetApiAuthToken = token
End Function

' Centralized HTTP GET helper
Private Function SendHttpGet(endpoint As String) As String
    Dim http As Object
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    
    Dim url As String
    url = GetApiBaseUrl() & endpoint
    
    http.Open "GET", url, False
    http.setRequestHeader "Content-Type", "application/json"
    
    Dim token As String
    token = GetApiAuthToken()
    If Len(token) > 0 Then
        http.setRequestHeader "Authorization", "Bearer " & token
    End If
    
    http.send
    
    If http.Status >= 200 And http.Status < 300 Then
        SendHttpGet = http.responseText
    Else
        Err.Raise vbObjectError + 4, "SendHttpGet", "API Error " & http.Status & ": " & http.responseText
    End If
End Function



' =========================================================================
' 1. CORE HTTP CLIENT
' =========================================================================

' GET /api/v1/profiles?setup_fee_status=pending_review
Public Function FetchPendingReviews() As String
    FetchPendingReviews = SendHttpGet("/profiles?setup_fee_status=pending_review")
End Function

' GET /api/v1/profiles (All Statuses)
Public Function FetchAllProfiles() As String
    FetchAllProfiles = SendHttpGet("/profiles")
End Function

' PATCH /api/v1/profiles/{profile_id}/setup-fee
Public Function SubmitFeeReview(profileId As String, status As String, Optional note As String = "") As String
    Dim http As Object
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")

    Dim url As String
    url = GetApiBaseUrl() & "/profiles/" & profileId & "/setup-fee"

    ' Safely escape double quotes in the admin note
    Dim safeNote As String
    safeNote = Replace(note, """", "\""")

    Dim payload As String
    payload = "{""setup_fee_status"": """ & status & """"
    If Len(note) > 0 Then
        payload = payload & ", ""setup_fee_review_note"": """ & safeNote & """"
    End If
    payload = payload & "}"

    http.Open "PATCH", url, False
    http.setRequestHeader "Content-Type", "application/json"
    http.send payload

    If http.Status = 200 Then
        SubmitFeeReview = http.responseText
    Else
        Err.Raise vbObjectError + 2, "SubmitFeeReview", "API Error " & http.Status & ": " & http.responseText
    End If
End Function


' GET /api/v1/opportunities
Public Function FetchAllOpportunities() As String
    FetchAllOpportunities = SendHttpGet("/opportunities")
End Function

' GET /api/v1/quote-requests
Public Function FetchAllQuoteRequests() As String
    FetchAllQuoteRequests = SendHttpGet("/quote-requests")
End Function

' GET /api/v1/admin/referrals/pending
Public Function FetchPendingReferrals() As String
    FetchPendingReferrals = SendHttpGet("/admin/referrals/pending")
End Function

' GET /api/v1/expenses/summary
Public Function FetchExpenseSummary() As String
    FetchExpenseSummary = SendHttpGet("/expenses/summary")
End Function

' GET /api/v1/continuity-events/
Public Function FetchContinuityEvents() As String
    FetchContinuityEvents = SendHttpGet("/continuity-events/")
End Function

' =========================================================================
' 2. WORKBOOK UI AUTOMATION
' =========================================================================

' Run this macro to pull data from Railway and build the view
Public Sub SyncRegistrationReview()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("RegistrationReview")
    On Error GoTo ErrorHandler

    ' Create the sheet if it doesn't exist
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "RegistrationReview"
        ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    End If

    ws.Cells.Clear
    Dim headers As Variant
    headers = Array("Profile ID", "Business Name", "Steward Email", "Archetype", "Setup Fee Status", "Proof URL", "Admin Decision", "Review Note", "Last Synced")
    ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Color = RGB(0, 128, 0)
    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A2:I2").Font.Bold = True
    ws.Range("A2:I2").Interior.Color = RGB(232, 223, 208) ' iPhande Sand/Gold

    Dim json As String
    json = FetchPendingReviews()

    ' If array is empty "[]"
    If Len(json) <= 2 Then
        ws.Range("A3").Value = "No pending registrations found. Queue is empty."
        ws.Columns.AutoFit
        Exit Sub
    End If

    ' Lightweight flat JSON parsing for V1
    Dim records() As String
    records = Split(Mid(json, 3, Len(json) - 4), "},{")

    Dim i As Long, rowIdx As Long
    rowIdx = 3

    For i = LBound(records) To UBound(records)
        ws.Cells(rowIdx, 1).Value = ExtractString(records(i), "id")
        ws.Cells(rowIdx, 2).Value = ExtractString(records(i), "name")
        ws.Cells(rowIdx, 3).Value = ExtractString(records(i), "email")
        ws.Cells(rowIdx, 4).Value = ExtractString(records(i), "business_category_key")
        ws.Cells(rowIdx, 5).Value = ExtractString(records(i), "setup_fee_status")

        Dim proofUrl As String
        proofUrl = ExtractString(records(i), "setup_fee_proof_url")
        If Len(proofUrl) > 0 And proofUrl <> "null" Then
            ws.Hyperlinks.Add Anchor:=ws.Cells(rowIdx, 6), Address:=proofUrl, TextToDisplay:="View EFT Slip"
        Else
            ws.Cells(rowIdx, 6).Value = "No Proof Uploaded"
        End If

        ' Pre-fill the recommended action
        ws.Cells(rowIdx, 7).Value = "paid"
        ws.Cells(rowIdx, 8).Value = "Approved via VBA Console"
        ws.Cells(rowIdx, 9).Value = Now

        rowIdx = rowIdx + 1
    Next i

    ws.Columns.AutoFit
    MsgBox "Registration review queue synced from Railway successfully.", vbInformation
    Exit Sub

ErrorHandler:
    MsgBox "Failed to sync registrations: " & Err.Description, vbCritical
End Sub

' Run this macro when your cursor is on a row you want to approve/reject
Public Sub SubmitRegistrationDecision()
    Dim ws As Worksheet
    Set ws = ActiveSheet

    If ws.Name <> "RegistrationReview" Then
        MsgBox "Please run this from the RegistrationReview sheet.", vbExclamation
        Exit Sub
    End If

    Dim rowIdx As Long
    rowIdx = ActiveCell.Row

    If rowIdx = 1 Or IsEmpty(ws.Cells(rowIdx, 1).Value) Then
        MsgBox "Please select a valid registration row to process.", vbExclamation
        Exit Sub
    End If

    Dim profileId As String, status As String, note As String
    profileId = ws.Cells(rowIdx, 1).Value
    status = ws.Cells(rowIdx, 7).Value
    note = ws.Cells(rowIdx, 8).Value

    If status <> "paid" And status <> "rejected" And status <> "waived" Then
        MsgBox "Status must be 'paid', 'rejected', or 'waived'.", vbExclamation
        Exit Sub
    End If

    On Error GoTo ErrorHandler
    Call SubmitFeeReview(profileId, status, note)

    MsgBox "Review submitted successfully! Profile updated on Railway.", vbInformation
    ws.Rows(rowIdx).Delete ' Clear the row upon success to reflect an empty queue
    Exit Sub

ErrorHandler:
    MsgBox "Failed to submit review: " & Err.Description, vbCritical
End Sub

' Run this macro to pull all stewards and build the registry view
Public Sub SyncStewardRegistry()
    On Error GoTo ErrorHandler
    Dim ws As Worksheet
    On Error Resume Next
    Set ws = ThisWorkbook.Sheets("StewardRegistry")
    On Error GoTo ErrorHandler

    ' Create the sheet if it doesn't exist
    If ws Is Nothing Then
        Set ws = ThisWorkbook.Sheets.Add
        ws.Name = "StewardRegistry"
        ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    End If

    ws.Cells.Clear
    Dim headers As Variant
    headers = Array("Profile ID", "Business Name", "Owner ID", "Steward Email", "Archetype", "Business Line", "Setup Fee Status", "Visibility Status", "Slug", "Logo URL", "Cover URL", "Proof Count", "Quote Count", "Recommended Tool", "Last Synced")
    ws.Range("A1").Value = "STATUS: CONNECTED TO API"
    ws.Range("A1").Font.Bold = True
    ws.Range("A1").Font.Color = RGB(0, 128, 0)
    ws.Range("A2").Resize(1, UBound(headers) + 1).Value = headers
    ws.Range("A2:O2").Font.Bold = True
    ws.Range("A2:O2").Interior.Color = RGB(232, 223, 208) ' iPhande Sand/Gold

    Dim json As String
    json = FetchAllProfiles()

    ' If array is empty "[]"
    If Len(json) <= 2 Then
        ws.Range("A3").Value = "No stewards found in the registry."
        ws.Columns.AutoFit
        Exit Sub
    End If

    ' Lightweight flat JSON parsing for V1
    Dim records() As String
    records = Split(Mid(json, 3, Len(json) - 4), "},{")

    Dim i As Long, rowIdx As Long
    rowIdx = 3

    For i = LBound(records) To UBound(records)
        ws.Cells(rowIdx, 1).Value = ExtractString(records(i), "id")
        ws.Cells(rowIdx, 2).Value = ExtractString(records(i), "name")
        ws.Cells(rowIdx, 3).Value = ExtractString(records(i), "owner_id")
        ws.Cells(rowIdx, 4).Value = ExtractString(records(i), "email")

        Dim archetype As String
        archetype = ExtractString(records(i), "business_category_key")
        ws.Cells(rowIdx, 5).Value = archetype
        ws.Cells(rowIdx, 6).Value = ExtractString(records(i), "business_line")
        ws.Cells(rowIdx, 7).Value = ExtractString(records(i), "setup_fee_status")
        ws.Cells(rowIdx, 8).Value = ExtractString(records(i), "is_public")
        ws.Cells(rowIdx, 9).Value = ExtractString(records(i), "slug")
        ws.Cells(rowIdx, 10).Value = ExtractString(records(i), "logo_url")
        ws.Cells(rowIdx, 11).Value = ExtractString(records(i), "cover_photo_url")

        ' Proof Count (approximate by counting commas in the URL array string)
        Dim proofUrls As String
        proofUrls = ExtractString(records(i), "supporting_image_urls")
        If Len(proofUrls) > 0 And proofUrls <> "null" Then
            ws.Cells(rowIdx, 12).Value = Len(proofUrls) - Len(Replace(proofUrls, ",", "")) + 1
        Else
            ws.Cells(rowIdx, 12).Value = 0
        End If

        ' Quote Count placeholder (to be populated later via Quote API)
        ws.Cells(rowIdx, 13).Value = 0

        ' Recommend Tool based on archetype
        Dim recommendedTool As String
        Select Case LCase(archetype)
            Case "automotive", "plumbing", "electrical"
                recommendedTool = "QuoteRequests"
            Case "catering", "cleaning", "events"
                recommendedTool = "Scheduling/Booking"
            Case "funeral", "faith", "community"
                recommendedTool = "StewardshipLedger"
            Case "spaza", "retail", "wholesale"
                recommendedTool = "InventoryLedger"
            Case Else
                recommendedTool = "VisibilityProfile"
        End Select
        ws.Cells(rowIdx, 14).Value = recommendedTool

        ws.Cells(rowIdx, 15).Value = Now

        rowIdx = rowIdx + 1
    Next i

    ws.Columns.AutoFit
    MsgBox "Steward Registry synced from Railway successfully.", vbInformation
    Exit Sub

ErrorHandler:
    MsgBox "Failed to sync Steward Registry: " & Err.Description, vbCritical
End Sub


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

' =========================================================================
' 3. UTILITY FUNCTIONS
' =========================================================================

' A lightweight regex-free JSON string extractor for simple, flat API arrays
Private Function ExtractString(jsonBlock As String, key As String) As String
    Dim searchKey As String, startPos As Long, endPos As Long
    searchKey = """" & key & """:"""
    startPos = InStr(jsonBlock, searchKey)

    If startPos > 0 Then
        startPos = startPos + Len(searchKey)
        endPos = InStr(startPos, jsonBlock, """")
        ExtractString = Mid(jsonBlock, startPos, endPos - startPos)
    Else
        ' Check for non-string values (nulls, booleans, numbers)
        searchKey = """" & key & """:"
        startPos = InStr(jsonBlock, searchKey)
        If startPos > 0 Then
            startPos = startPos + Len(searchKey)
            Dim endPosComma As Long: endPosComma = InStr(startPos, jsonBlock, ",")
            Dim endPosBrace As Long: endPosBrace = InStr(startPos, jsonBlock, "}")
            If endPosComma > 0 And endPosComma < endPosBrace Then
                endPos = endPosComma
            Else
                endPos = endPosBrace
            End If
            If endPos = 0 Then endPos = Len(jsonBlock) + 1
            ExtractString = Replace(Mid(jsonBlock, startPos, endPos - startPos), """", "")
        End If
    End If
End Function
