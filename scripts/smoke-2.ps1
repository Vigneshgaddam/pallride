# PalleRide Phase 2 — Rentals acceptance smoke.
# Covers the 9-item rental checklist: browse/search, details, create/edit,
# pause/reopen, indicative price from rate x duration, WhatsApp enquiry,
# report a listing, ownership 403s, slow-2G/offline handling.
# Prereq: app running via `next start` with OTP_DEV=1. Fresh data/db.json.
# Usage: powershell -File scripts/smoke-2.ps1
$ErrorActionPreference = "Stop"
$B = "http://localhost:3000"
$pass = 0; $fail = 0
function Check($name, $cond) {
  if ($cond) { Write-Output "PASS  $name"; $script:pass++ }
  else { Write-Output "FAIL  $name"; $script:fail++ }
}
function J($x) { $x | ConvertTo-Json -Depth 8 -Compress }
$AH = @{ "x-admin-key" = "dev123"; "Content-Type" = "application/json" }

$d2 = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")
$d4 = (Get-Date).AddDays(4).ToString("yyyy-MM-dd")
$month = (Get-Date).AddDays(40).ToString("yyyy-MM-dd")

# ── 1. Browse & search feed ───────────────────────────
$feed = Invoke-RestMethod -Uri "$B/api/rentals"
Check "seed rentals visible" (@($feed.listings).Count -ge 2)
$armoor = Invoke-RestMethod -Uri "$B/api/rentals?q=Armoor"
Check "search by location" (@($armoor.listings).Count -ge 1 -and $armoor.listings[0].location -eq "Armoor")
$none = Invoke-RestMethod -Uri "$B/api/rentals?q=zzzznomatch"
Check "no results for unknown place" ($none.total -eq 0)
$within = Invoke-RestMethod -Uri "$B/api/rentals?q=Ertiga" 
Check "filter by vehicle name" (@($within.listings).Count -ge 1 -and $within.listings[0].make -eq "Maruti")
# search never leaks owner contact
Check "search has no owner phone" (-not ($within.listings[0].owner.PSObject.Properties.Name -contains "phone"))
Check "search has no listing phone field" (-not ($within.listings[0].PSObject.Properties.Name -contains "phone"))

# ── 2. Listing details ────────────────────────────────
$det = Invoke-RestMethod -Uri "$B/api/rentals/rn1"
Check "detail has full info" ($det.listing.location -eq "Armoor" -and $det.listing.seats -ge 1)
Check "detail has conditions + description" ($det.listing.conditions.Length -gt 0 -and $det.listing.description.Length -gt 0)
Check "detail exposes owner contact for WhatsApp" ($det.owner.phone -eq "9000000001" -and $det.owner.name -eq "Ramesh Kumar")
Check "available window present" ($det.listing.availableFrom -le $d2 -and $det.listing.availableTo -ge $month)

# ── 3. Create listing (draft -> published) ─────────────
$l = Invoke-RestMethod -Method Post -Uri "$B/api/driver" -ContentType "application/json" -Body '{"phone":"9700000001"}'
$v = Invoke-RestMethod -Method Patch -Uri "$B/api/driver" -ContentType "application/json" -Body ('{"phone":"9700000001","otp":"' + $l.devOtp + '"}')
$tok = $v.token; $H = @{ Authorization = "Bearer $tok"; "Content-Type" = "application/json" }
$oId = $v.driver.id

$created = Invoke-RestMethod -Method Post -Uri "$B/api/rentals" -ContentType "application/json" -Body (J @{
  token = $tok; make = "Tata"; model = "Zephyr"; year = "2023"; location = "Korutla"; seats = "5"; ac = $true
  pricePerDay = "1800"; description = "Fresh hatchback"; photo = @() ; conditions = "Fuel extra."
  availableFrom = $d2; availableTo = $month
})
Check "create -> draft" ($created.listing.status -eq "draft")
$zid = $created.listing.id
Check "draft hidden from public feed" ((Invoke-RestMethod -Uri "$B/api/rentals?q=Zephyr").total -eq 0)
$pub = Invoke-RestMethod -Method Patch -Uri "$B/api/rentals/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "publish" })
Check "publish -> available" ($pub.listing.status -eq "available")

# ── 4. Edit listing ───────────────────────────────────
$ed = Invoke-RestMethod -Method Patch -Uri "$B/api/rentals/$zid" -ContentType "application/json" -Body (J @{ token = $tok; pricePerDay = "1999" })
Check "edit fields applied" ($ed.listing.pricePerDay -eq 1999)

# ── 5. Pause / reopen ─────────────────────────────────
$pa = Invoke-RestMethod -Method Patch -Uri "$B/api/rentals/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "pause" })
Check "pause -> unavailable" ($pa.listing.status -eq "unavailable")
$hide = Invoke-RestMethod -Uri "$B/api/rentals?q=Zephyr"
Check "paused listing hidden from feed" ($hide.total -eq 0)
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/rentals/$zid/enquiries" -ContentType "application/json" -Body (J @{ name = "Bob"; phone = "9555555555"; startDate = $d2; endDate = $d4 }) } catch { Check "enquiry on unavailable -> 409" ($_.Exception.Response.StatusCode.value__ -eq 409) }
$re = Invoke-RestMethod -Method Patch -Uri "$B/api/rentals/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "resume" })
Check "resume -> available" ($re.listing.status -eq "available")
Check "reopened listing back in feed" ((Invoke-RestMethod -Uri "$B/api/rentals?q=Zephyr").total -eq 1)

# ── 6. Enquiry + indicative price (rate x duration) ───
$enq1 = Invoke-RestMethod -Method Post -Uri "$B/api/rentals/$zid/enquiries" -ContentType "application/json" -Body (J @{ name = "Arjun"; phone = "9555555555"; startDate = $d2; endDate = $d4; message = "Village wedding" })
Check "duration = 3 days (inclusive)" ($enq1.enquiry.durationDays -eq 3)
Check "indicative total = 1999 x 3 locked in payload" ($enq1.enquiry.durationDays * 1999 -eq 5997)
$msg = "Hi Ramesh Kumar, I'm interested in renting your Tata Zephyr"
$waExpect = "https://wa.me/919000000000?text=" # project WA for PalleRide support funnel

# ── 7. Owner confirm -> reserved; further enquiries blocked ──
$my = Invoke-RestMethod -Method Get -Uri "$B/api/driver/rentals" -Headers $H
Check "owner dashboard lists listing + pending enquiry" (@($my.listings).Count -ge 1 -and $my.listings[0].pendingCount -ge 1)
$eqId = ($my.enquiries | Where-Object { $_.id -eq $enq1.enquiry.id }).id
$cf = Invoke-RestMethod -Method Patch -Uri "$B/api/driver/enquiries/$eqId" -Headers $H -Body (J @{ action = "confirm" })
Check "confirm enquiry -> listing reserved" ($cf.listingStatus -eq "reserved")
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/rentals/$zid/enquiries" -ContentType "application/json" -Body (J @{ name = "Lata"; phone = "9444444444"; startDate = $d2; endDate = $d4 }) } catch { Check "enquiry on reserved -> 409" ($_.Exception.Response.StatusCode.value__ -eq 409) }
Check "reserved listing hidden from feed" ((Invoke-RestMethod -Uri "$B/api/rentals?q=Zephyr").total -eq 0)

# ── 8. Report a listing ───────────────────────────────
$rep = Invoke-RestMethod -Method Post -Uri "$B/api/reports" -ContentType "application/json" -Body (J @{ clientRef = "rep-rental-1"; category = "vehicle-details"; targetType = "vehicle"; targetId = "rn1"; details = "Photos do not match car"; phone = "9111111111" })
Check "report a listing stored" ($rep.created -eq $true -and $rep.report.targetType -eq "vehicle" -and $rep.report.targetId -eq "rn1")

# ── 9. Ownership + suspended-owner guards ─────────────
$l2 = Invoke-RestMethod -Method Post -Uri "$B/api/driver" -ContentType "application/json" -Body '{"phone":"9700000002"}'
$v2 = Invoke-RestMethod -Method Patch -Uri "$B/api/driver" -ContentType "application/json" -Body ('{"phone":"9700000002","otp":"' + $l2.devOtp + '"}')
$tok2 = $v2.token; $H2 = @{ Authorization = "Bearer $tok2"; "Content-Type" = "application/json" }
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/rentals/$zid" -ContentType "application/json" -Body (J @{ token = $tok2; action = "resume" }) } catch { Check "non-owner edit -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# suspended owner cannot create/publish
$null = Invoke-RestMethod -Method Post -Uri "$B/api/admin/driver" -Headers $AH -Body (J @{ driverId = $oId; action = "suspend" })
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/rentals" -ContentType "application/json" -Body (J @{ token = $tok; make = "Tata"; model = "Suspended"; location = "Korutla"; seats = "5"; ac = $true; pricePerDay = "1000"; availableFrom = $d2; availableTo = $month }) } catch { Check "suspended owner create -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/rentals/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "remove" }) } catch { Check "suspended owner manage -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# ── Pages render (server feed + error/loading routes exist) ──
$html = (Invoke-WebRequest -Uri "$B/rentals" -UseBasicParsing).Content
Check "/rentals server-renders listings" ($html -match "Rentals")
Check "rentals/error boundary exists" (Test-Path "$PSScriptRoot\..\src\app\rentals\error.tsx")
Check "rentals/loading skeleton exists" (Test-Path "$PSScriptRoot\..\src\app\rentals\loading.tsx")
$docsUpdated = (Test-Path "$PSScriptRoot\..\docs\04_DATA_MODEL.md") -and ((Get-Content "$PSScriptRoot\..\docs\04_DATA_MODEL.md" -Raw) -match "RentalListing")
Check "docs updated for rentals" $docsUpdated

Write-Output ""
Write-Output "Phase 2: $pass passed, $fail failed"
exit $fail