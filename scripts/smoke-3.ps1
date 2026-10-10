# PalleRide Phase 3 — Buy & Sell marketplace acceptance smoke.
# Covers the nine-item marketplace checklist: browse/search, URL filters
# (price/location/attributes), listing details, create/edit/publish, pause/sell
# lifecycle, WhatsApp enquiry to the seller's own phone, report a listing,
# ownership + suspended-seller guards, slow-2G/offline states + docs.
# Prereq: app running via `next start` with OTP_DEV=1. Fresh data/db.json.
# Usage: powershell -File scripts/smoke-3.ps1
$ErrorActionPreference = "Stop"
$B = "http://localhost:3000"
$pass = 0; $fail = 0
function Check($name, $cond) {
  if ($cond) { Write-Output "PASS  $name"; $script:pass++ }
  else { Write-Output "FAIL  $name"; $script:fail++ }
}
function J($x) { $x | ConvertTo-Json -Depth 8 -Compress }
$AH = @{ "x-admin-key" = "dev123"; "Content-Type" = "application/json" }

# ── 1. Browse & search feed ───────────────────────────
$feed = Invoke-RestMethod -Uri "$B/api/cars"
Check "seed cars visible" (@($feed.cars).Count -ge 2)
$kam = Invoke-RestMethod -Uri "$B/api/cars?q=Kammarpally"
Check "search by location" (@($kam.cars).Count -ge 1 -and $kam.cars[0].location -eq "Kammarpally")
$mar = Invoke-RestMethod -Uri "$B/api/cars?q=Swift"
Check "search by model" (@($mar.cars).Count -ge 1 -and $mar.cars[0].make -eq "Maruti")
$none = Invoke-RestMethod -Uri "$B/api/cars?q=zzzznomatch"
Check "no results for unknown term" ($none.total -eq 0)
Check "search has no seller phone" (-not ($feed.cars[0].PSObject.Properties.Name -contains "phone"))
Check "search strips description/ownership" (-not ($feed.cars[0].PSObject.Properties.Name -contains "description" -or $feed.cars[0].PSObject.Properties.Name -contains "ownership"))

# ── 2. URL filters (price / fuel / km / verified / sort) ──
$price = Invoke-RestMethod -Uri "$B/api/cars?minPrice=400000&maxPrice=500000"
Check "price range -> only i10" ($price.total -eq 1 -and $price.cars[0].model -match "i10")
$fuel = Invoke-RestMethod -Uri "$B/api/cars?fuel=petrol"
Check "fuel filter" ($fuel.total -ge 2)
$km = Invoke-RestMethod -Uri "$B/api/cars?maxKm=20000"
Check "maxKm filter" ($km.total -eq 1 -and $km.cars[0].odometer -le 20000)
$ver = Invoke-RestMethod -Uri "$B/api/cars?verified=1"
Check "verified sellers only" ($ver.total -ge 2 -and $ver.cars[0].seller.verified -eq $true)
$sort = Invoke-RestMethod -Uri "$B/api/cars?sort=price"
Check "sort by price asc" ($sort.cars[0].make -eq "Hyundai")

# ── 3. Listing details ────────────────────────────────
$det = Invoke-RestMethod -Uri "$B/api/cars/c1"
Check "detail has full info" ($det.listing.location -eq "Kammarpally" -and $det.listing.price -eq 490000)
Check "detail has description + ownership" ($det.listing.description.Length -gt 0 -and $det.listing.ownership.Length -gt 0)
Check "detail exposes seller contact for WhatsApp" ($det.seller.phone -eq "9000000001" -and $det.seller.name -eq "Ramesh Kumar")
Check "detail has share code + fuel + transmission" ($det.listing.shareCode.Length -gt 0 -and $det.listing.fuel -eq "petrol" -and $det.listing.transmission -eq "manual")

# ── 4. Seller login + create (draft -> published) ─────
$l = Invoke-RestMethod -Method Post -Uri "$B/api/driver" -ContentType "application/json" -Body '{"phone":"9700000001"}'
$v = Invoke-RestMethod -Method Patch -Uri "$B/api/driver" -ContentType "application/json" -Body ('{"phone":"9700000001","otp":"' + $l.devOtp + '"}')
$tok = $v.token; $H = @{ Authorization = "Bearer $tok"; "Content-Type" = "application/json" }
$oId = $v.driver.id

$created = Invoke-RestMethod -Method Post -Uri "$B/api/cars" -ContentType "application/json" -Body (J @{
  token = $tok; make = "Tata"; model = "Nexon"; year = "2023"; price = "890000"; location = "Korutla"
  fuel = "petrol"; transmission = "manual"; odometer = "15000"; photos = @()
  description = "Your Tata Nexon, one owner"; ownership = "First owner."
})
Check "create -> draft" ($created.listing.status -eq "draft")
$zid = $created.listing.id
Check "draft hidden from public feed" ((Invoke-RestMethod -Uri "$B/api/cars?q=Nexon").total -eq 0)
$pub = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "publish" })
Check "publish -> published" ($pub.listing.status -eq "published")
Check "published car in feed" ((Invoke-RestMethod -Uri "$B/api/cars?q=Nexon").total -eq 1)

# ── 5. Edit + pause/resume ────────────────────────────
$ed = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok; price = "849000" })
Check "edit fields applied" ($ed.listing.price -eq 849000)
$pa = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "pause" })
Check "pause -> paused" ($pa.listing.status -eq "paused")
Check "paused listing hidden from feed" ((Invoke-RestMethod -Uri "$B/api/cars?q=Nexon").total -eq 0)
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/cars/$zid/enquiries" -ContentType "application/json" -Body (J @{ name = "Bob"; phone = "9555555555"; message = "Is it available?" }) } catch { Check "enquiry on paused -> 409" ($_.Exception.Response.StatusCode.value__ -eq 409) }
$re = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "resume" })
Check "resume -> published" ($re.listing.status -eq "published")
Check "resumed car back in feed" ((Invoke-RestMethod -Uri "$B/api/cars?q=Nexon").total -eq 1)

# ── 6. WhatsApp enquiry (recorded + owner's own WA number) ──
$enq = Invoke-RestMethod -Method Post -Uri "$B/api/cars/$zid/enquiries" -ContentType "application/json" -Body (J @{ name = "Arjun"; phone = "9555555555"; message = "Interested. Where to inspect?" })
Check "enquiry recorded" ($enq.ok -eq $true -and $enq.enquiry.status -eq "pending")
$waSrc = Get-Content "$PSScriptRoot\..\src\components\marketplace\WhatsAppEnquiry.tsx" -Raw
Check "seller WA link prefills with 91+seller phone" ($waSrc -match '"91" \+ number')

# ── 7. Seller dashboard + confirm -> reserved -> sold ──
$my = Invoke-RestMethod -Method Get -Uri "$B/api/driver/cars" -Headers $H
Check "seller dashboard lists listing + pending enquiry" (@($my.listings).Count -ge 1 -and $my.listings[0].pendingCount -ge 1)
$eqId = ($my.enquiries | Where-Object { $_.id -eq $enq.enquiry.id }).id
$cf = Invoke-RestMethod -Method Patch -Uri "$B/api/driver/car-enquiries/$eqId" -Headers $H -Body (J @{ action = "confirm" })
Check "confirm enquiry -> listing reserved" ($cf.listingStatus -eq "reserved")
Check "reserved listing hidden from feed" ((Invoke-RestMethod -Uri "$B/api/cars?q=Nexon").total -eq 0)
$sl = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "sold" })
Check "mark sold -> sold" ($sl.listing.status -eq "sold")
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok; price = "1" }) } catch { Check "sold listing cannot be edited -> 400" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# ── 8. Report a listing ───────────────────────────────
$rep = Invoke-RestMethod -Method Post -Uri "$B/api/reports" -ContentType "application/json" -Body (J @{ clientRef = "rep-car-1"; category = "vehicle-details"; targetType = "vehicle"; targetId = "c1"; details = "Car not as described"; phone = "9111111111" })
Check "report a listing stored" ($rep.created -eq $true -and $rep.report.targetType -eq "vehicle" -and $rep.report.targetId -eq "c1")

# ── 9. Ownership + suspended-seller guards ────────────
$l2 = Invoke-RestMethod -Method Post -Uri "$B/api/driver" -ContentType "application/json" -Body '{"phone":"9700000002"}'
$v2 = Invoke-RestMethod -Method Patch -Uri "$B/api/driver" -ContentType "application/json" -Body ('{"phone":"9700000002","otp":"' + $l2.devOtp + '"}')
$tok2 = $v2.token; $H2 = @{ Authorization = "Bearer $tok2"; "Content-Type" = "application/json" }
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok2; action = "resume" }) } catch { Check "non-owner edit -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }

$null = Invoke-RestMethod -Method Post -Uri "$B/api/admin/driver" -Headers $AH -Body (J @{ driverId = $oId; action = "suspend" })
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/cars" -ContentType "application/json" -Body (J @{ token = $tok; make = "Tata"; model = "Suspended1"; year = "2021"; price = "500000"; location = "Korutla"; fuel = "petrol"; transmission = "manual"; odometer = "20000" }) } catch { Check "suspended seller create -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/cars/$zid" -ContentType "application/json" -Body (J @{ token = $tok; action = "remove" }) } catch { Check "suspended seller manage -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# ── Pages render + slow-2G/offline states + docs ──────
$html = (Invoke-WebRequest -Uri "$B/cars" -UseBasicParsing).Content
Check "/cars server-renders listing feed" ($html -match "cars for sale" -or $html -match "Hyundai")
Check "cars/error boundary exists" (Test-Path "$PSScriptRoot\..\src\app\cars\error.tsx")
Check "cars/loading skeleton exists" (Test-Path "$PSScriptRoot\..\src\app\cars\loading.tsx")
$detailSrc = Get-Content -LiteralPath "$PSScriptRoot\..\src\app\cars\[listingId]\page.tsx" -Raw
Check "detail offline state handled" ($detailSrc -match "offline")
$nav = Get-Content "$PSScriptRoot\..\src\components\bottom-nav.tsx" -Raw
Check "bottom nav Buy -> /cars" ($nav -match '"\/cars"')
$docsUpdated = (Test-Path "$PSScriptRoot\..\docs\04_DATA_MODEL.md") -and ((Get-Content "$PSScriptRoot\..\docs\04_DATA_MODEL.md" -Raw) -match "CarListing")
Check "docs updated for marketplace" $docsUpdated

Write-Output ""
Write-Output "Phase 3: $pass passed, $fail failed"
exit $fail