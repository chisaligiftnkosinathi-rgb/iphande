import re

with open('tools/vba/exports/modIphandeApiClient.bas', 'r') as f:
    content = f.read()

# 1. Add GetApiAuthToken and SendHttpGet
helper_code = '''
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

'''
content = content.replace("GetApiBaseUrl = url\nEnd Function", "GetApiBaseUrl = url\nEnd Function\n" + helper_code)

# 2. Refactor existing to use SendHttpGet
content = re.sub(
    r"' GET /api/v1/profiles\?setup_fee_status=pending_review.*?End Function",
    "' GET /api/v1/profiles?setup_fee_status=pending_review\nPublic Function FetchPendingReviews() As String\n    FetchPendingReviews = SendHttpGet(\"/profiles?setup_fee_status=pending_review\")\nEnd Function",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"' GET /api/v1/profiles \(All Statuses\).*?End Function",
    "' GET /api/v1/profiles (All Statuses)\nPublic Function FetchAllProfiles() As String\n    FetchAllProfiles = SendHttpGet(\"/profiles\")\nEnd Function",
    content,
    flags=re.DOTALL
)

# 3. Add new wrappers
new_wrappers = '''
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
'''
content = content.replace("' =========================================================================\n' 2. WORKBOOK UI AUTOMATION", new_wrappers + "\n' =========================================================================\n' 2. WORKBOOK UI AUTOMATION")

# Add "CONNECTED TO API" to existing UI automation sheets
content = content.replace('ws.Name = "RegistrationReview"', 'ws.Name = "RegistrationReview"\n        ws.Range("A1").Value = "STATUS: CONNECTED TO API"')
content = content.replace('ws.Name = "StewardRegistry"', 'ws.Name = "StewardRegistry"\n        ws.Range("A1").Value = "STATUS: CONNECTED TO API"')
# Shift header rows by 1 because we added the status to A1?
# Wait, let's just make the script write the whole file manually.

with open('tools/vba/exports/modIphandeApiClient.bas', 'w') as f:
    f.write(content)
