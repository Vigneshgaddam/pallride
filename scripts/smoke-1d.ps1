# PalleRide Phase 1D — Trust, Safety & Ratings acceptance smoke.
# Prereq: app running via `next start` with OTP_DEV=1 (dev OTPs + admin key dev123).
# Usage: powershell -File scripts/smoke-1d.ps1
$ErrorActionPreference = "Stop"
$B = "http://localhost:3000"
$pass = 0; $fail = 0
function Check($name, $cond) {
  if ($cond) { Write-Output "PASS  $name"; $script:pass++ }
  else { Write-Output "FAIL  $name"; $script:fail++ }
}
function J($x) { $x | ConvertTo-Json -Depth 8 -Compress }
$AH = @{ "x-admin-key" = "dev123"; "Content-Type" = "application/json" }

# Fresh driver for verification-state tests
$l = Invoke-RestMethod -Method Post -Uri "$B/api/driver" -ContentType "application/json" -Body '{"phone":"9800000001"}'
$v = Invoke-RestMethod -Method Patch -Uri "$B/api/driver" -ContentType "application/json" -Body ('{"phone":"9800000001","otp":"' + $l.devOtp + '"}')
$tok = $v.token; $H = @{ Authorization = "Bearer $tok"; "Content-Type" = "application/json" }
$dId = $v.driver.id

# ── 1. Verification states ─────────────────────────────
$me = Invoke-RestMethod -Method Get -Uri "$B/api/driver" -Headers $H
Check "fresh driver verification=none" ($me.driver.verification -eq "none")
Check "fresh driver status=active" ($me.driver.status -eq "active")
Check "no badge before approval (verified=false)" (-not $me.driver.verified)

$null = Invoke-RestMethod -Method Patch -Uri "$B/api/driver" -Headers $H -Body (J @{ name = "Safety Test"; serviceAreas = @("Korutla") })
$null = Invoke-RestMethod -Method Post -Uri "$B/api/driver/vehicles" -Headers $H -Body (J @{ model = "Swift"; year = "2020"; regNumber = "TS14XY9999"; seats = "4" })
$sub = Invoke-RestMethod -Method Post -Uri "$B/api/driver/verification" -Headers $H
Check "submit -> under_review" ($sub.driver.verification -eq "under_review")

$cr = Invoke-RestMethod -Method Post -Uri "$B/api/admin/driver" -Headers $AH -Body (J @{ driverId = $dId; action = "changes" })
Check "admin changes -> changes_required" ($cr.driver.verification -eq "changes_required")
$ap = Invoke-RestMethod -Method Post -Uri "$B/api/admin/driver" -Headers $AH -Body (J @{ driverId = $dId; action = "approve" })
Check "admin approve -> approved + verified" ($ap.driver.verification -eq "approved" -and $ap.driver.verified -eq $true)

# publish blocked when suspended/rejected
$null = Invoke-RestMethod -Method Post -Uri "$B/api/admin/driver" -Headers $AH -Body (J @{ driverId = $dId; action = "suspend" })
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/trips" -ContentType "application/json" -Body (J @{ token = $tok; from = "A"; to = "B"; date = "2026-10-20"; time = "09:00"; priceLo = "100"; seatsTotal = "4" }) } catch { Check "suspended driver publish -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }
$null = Invoke-RestMethod -Method Post -Uri "$B/api/admin/driver" -Headers $AH -Body (J @{ driverId = $dId; action = "activate" })
Check "reactivate -> active" ((Invoke-RestMethod -Method Get -Uri "$B/api/driver" -Headers $H).driver.status -eq "active")

# ── 2. Eligible ratings ────────────────────────────────
$pub = Invoke-RestMethod -Method Post -Uri "$B/api/trips" -ContentType "application/json" -Body (J @{ token = $tok; from = "Korutla"; to = "Airport"; date = "2026-10-20"; time = "05:00"; priceLo = "500"; seatsTotal = "4"; publish = $true })
$tid = $pub.trip.id
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/trips/$tid/ratings" -ContentType "application/json" -Body (J @{ phone = "9111111111"; stars = 5 }) } catch { Check "rate unpublished/published trip -> 409" ($_.Exception.Response.StatusCode.value__ -eq 409) }
$null = Invoke-RestMethod -Method Patch -Uri "$B/api/trips/$tid" -ContentType "application/json" -Body (J @{ token = $tok; action = "start" })
$null = Invoke-RestMethod -Method Patch -Uri "$B/api/trips/$tid" -ContentType "application/json" -Body (J @{ token = $tok; action = "complete" })
# driver is 9800000001 — self rating must fail
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/trips/$tid/ratings" -ContentType "application/json" -Body (J @{ phone = "9800000001"; stars = 5 }) } catch { Check "self-rating -> 400" ($_.Exception.Response.StatusCode.value__ -eq 400) }
$rt = Invoke-RestMethod -Method Post -Uri "$B/api/trips/$tid/ratings" -ContentType "application/json" -Body (J @{ phone = "9111111111"; stars = 5; driving = 5; comment = "Nice ride"; })
Check "rating -> review pending moderation" ($rt.reviewStatus -eq "pending")
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/trips/$tid/ratings" -ContentType "application/json" -Body (J @{ phone = "9111111111"; stars = 4 }) } catch { Check "duplicate rating -> 409" ($_.Exception.Response.StatusCode.value__ -eq 409) }
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/trips/$tid/ratings" -ContentType "application/json" -Body (J @{ phone = "9333333333"; stars = 9 }) } catch { Check "invalid stars -> 400" ($_.Exception.Response.StatusCode.value__ -eq 400) }
$cats = Invoke-RestMethod -Method Get -Uri "$B/api/driver/ratings" -Headers $H
Check "backend category averages present" ($null -ne $cats.categories -and $cats.categories.driving -gt 0)

# ── 3. Report + block flows (with slow-network dedupe) ─
$rep1 = Invoke-RestMethod -Method Post -Uri "$B/api/reports" -ContentType "application/json" -Body (J @{ clientRef = "abc123"; category = "unsafe-driving"; targetType = "driver"; targetId = $dId; details = "Swerving on highway"; phone = "9111111111" })
Check "report created" ($rep1.created -eq $true -and $rep1.report.status -eq "open")
$rep2 = Invoke-RestMethod -Method Post -Uri "$B/api/reports" -ContentType "application/json" -Body (J @{ clientRef = "abc123"; category = "unsafe-driving"; targetType = "driver"; targetId = $dId; details = "Swerving on highway"; phone = "9111111111" })
Check "retry same clientRef does NOT duplicate" ($rep2.created -eq $false -and $rep2.report.id -eq $rep1.report.id)
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/reports" -ContentType "application/json" -Body (J @{ category = "other"; details = ""; phone = "9111111111" }) } catch { Check "empty details report -> 400" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# Block + effect on booking
$bl = Invoke-RestMethod -Method Post -Uri "$B/api/block" -ContentType "application/json" -Body (J @{ phone = "9800000001"; targetPhone = "9222222222" })
Check "block created" ($null -ne $bl.block.id)
$blockTrip = Invoke-RestMethod -Method Post -Uri "$B/api/trips" -ContentType "application/json" -Body (J @{ token = $tok; from = "Korutla"; to = "Warangal"; date = "2026-10-22"; time = "08:00"; priceLo = "120"; seatsTotal = "4"; publish = $true })
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/trips/$($blockTrip.trip.id)/requests" -ContentType "application/json" -Body (J @{ name = "Pass"; phone = "9222222222"; seats = @(1) }) } catch { Check "blocked passenger booking -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }
$rm = Invoke-RestMethod -Method Delete -Uri "$B/api/block" -ContentType "application/json" -Body (J @{ phone = "9800000001"; targetPhone = "9222222222" })
Check "unblock works" ($rm.removed -eq $true)

# ── 4. Admin review of reports + reviews ───────────────
$adm = Invoke-RestMethod -Method Get -Uri "$B/api/admin/reports" -Headers $AH
Check "admin sees reports" (@($adm.reports).Count -ge 1)
$res = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/$($rep1.report.id)" -Headers $AH -Body (J @{ action = "resolve" })
Check "admin resolve report" ($res.report.status -eq "resolved")
$inc = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/$($rep1.report.id)" -Headers $AH -Body (J @{ action = "escalate" })
Check "escalate creates SafetyIncident" ($null -ne $inc.incident -and $inc.incident.reportId -eq $rep1.report.id)
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/$($rep1.report.id)" -Headers $AH -Body (J @{ action = "resolve" }) } catch { Check "admin without key -> 403" ($_.Exception.Response.StatusCode.value__ -eq 403) }

$pend = Invoke-RestMethod -Method Get -Uri "$B/api/admin/reviews" -Headers $AH
Check "pending reviews visible to admin" (@($pend.reviews).Count -ge 1)
$review = $pend.reviews | Where-Object { $_.tripId -eq $tid } | Select-Object -First 1
$app = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reviews/$($review.id)" -Headers $AH -Body (J @{ action = "approve" })
Check "approve review" ($app.review.status -eq "approved")
$prof = Invoke-RestMethod -Uri "$B/api/drivers/$dId"
Check "approved review public on profile" (@($prof.reviews | Where-Object { $_.comment -eq "Nice ride" }).Count -eq 1)

# ── 5. Private information is protected ────────────────
Check "profile has no phone" (-not ($prof.driver.PSObject.Properties.Name -contains "phone"))
Check "profile has no regNumber" (-not ($prof.driver.PSObject.Properties.Name -contains "regNumber"))
Check "trips feed has no driverPhone" (-not ($pub.trip.PSObject.Properties.Name -contains "driverPhone"))

# ── 6. Emergency 112 accessible ───────────────────────
$safetyHtml = (Invoke-WebRequest -Uri "$B/safety" -UseBasicParsing).Content
Check "/safety links to tel:112" ($safetyHtml -match "tel:112")

# ── 8. Documentation updated ──────────────────────────
Check "docs/04_DATA_MODEL.md exists" (Test-Path "$PSScriptRoot\..\docs\04_DATA_MODEL.md")

Write-Output ""
Write-Output "Phase 1D: $pass passed, $fail failed"
exit $fail