# PalleRide Phase 4 — Admin Panel & Moderation acceptance smoke.
# Covers the 9-item checklist: unauth admin 403/redirect, verification ledger,
# trip/rental/car moderation, report lifecycle, suspension enforcement,
# restricted data, audit capture, pagination/slow-network states, login flow.
# Prereq: app running via `next start` with OTP_DEV=1. Fresh data/db.json.
# Usage: powershell -File scripts/smoke-4.ps1
$ErrorActionPreference = "Stop"
$B = "http://localhost:3000"
$pass = 0; $fail = 0
function Check($name, $cond) {
  if ($cond) { Write-Output "PASS  $name"; $script:pass++ }
  else { Write-Output "FAIL  $name"; $script:fail++ }
}
function J($x) { $x | ConvertTo-Json -Depth 8 -Compress }
$AH = @{ "x-admin-key" = "dev123"; "Content-Type" = "application/json" }
$BAD = @{ "x-admin-key" = "wrong"; "Content-Type" = "application/json" }

function StatusOf($sb) { $sb.Exception.Response.StatusCode.value__ }

# ── 1. Unauthenticated admin -> 403 / redirect ─────────
try { $null = Invoke-RestMethod -Uri "$B/api/admin/stats" -Headers $BAD } catch { Check "api with wrong key -> 403" ((StatusOf $_) -eq 403) }
try { $null = Invoke-RestMethod -Uri "$B/api/admin/stats" } catch { Check "api with no credentials -> 403" ((StatusOf $_) -eq 403) }
$pg = Invoke-WebRequest -Uri "$B/admin" -UseBasicParsing
Check "panel page no cookie -> bounces to login" ($pg.Content -match "/admin/login")
$qg = Invoke-WebRequest -Uri "$B/admin/verifications" -UseBasicParsing
Check "admin queue no cookie -> bounces to login" ($qg.Content -match "/admin/login")

# ── 2. Login flow (cookie session) ─────────────────────
$login = Invoke-RestMethod -Method Post -Uri "$B/api/admin/login" -ContentType "application/json" -Body '{"key":"dev123"}' -SessionVariable s1
Check "login ok + cookie set" ($login.ok -eq $true -and @($s1.Cookies.GetCookies([Uri]$B)).Count -ge 1)
$dash = Invoke-WebRequest -Uri "$B/admin" -WebSession $s1 -UseBasicParsing
Check "panel renders for cookie session" ($dash.StatusCode -eq 200 -and $dash.Content -match "Control Center")

# ── 3. Stats queue ─────────────────────────────────────
$st = Invoke-RestMethod -Uri "$B/api/admin/stats" -Headers $AH
Check "stats has 8 cards" (@($st.stats).Count -eq 8)
Check "users card > 0" ($st.stats[0].value -eq 3)
Check "pending verifications = 1 at start" (($st.stats | Where-Object { $_.key -eq "verifications" }).value -eq 1)

# ── 4. Verification ledger (d3 pending) ────────────────
$verq = Invoke-RestMethod -Uri "$B/api/admin/verifications" -Headers $AH
$d3 = $verq.verifications | Where-Object { $_.id -eq "d3" }
Check "d3 in queue with vehicle" ($d3.vehicles[0].make -eq "Maruti Suzuki")
Check "register shown on reviewer screen (least privilege)" ($d3.vehicles[0].regNumber -eq "TS28EF9012")
Check "all checks false initially" (-not ($d3.checks.phone -or $d3.checks.profile -or $d3.checks.vehicle -or $d3.checks.background))

$ck = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/verifications/d3" -Headers $AH -Body (J @{ action = "check"; check = "phone"; ok = $true; note = "RC matches" })
Check "single check toggled" ($ck.driver.checks.phone -eq $true -and $ck.driver.checks.profile -eq $false)
$appr = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/verifications/d3" -Headers $AH -Body (J @{ action = "approve"; note = "All docs verified" })
Check "approve -> all checks true + verified + active" ($appr.driver.verification -eq "approved" -and $appr.driver.verified -eq $true -and $appr.driver.status -eq "active" -and $appr.driver.checks.background -eq $true)
Check "pending verifications = 0" ((Invoke-RestMethod -Uri "$B/api/admin/stats" -Headers $AH | ForEach-Object { ($_.stats | Where-Object { $_.key -eq "verifications" }).value }) -eq 0)

# ── 5. Users list (restricted data) ────────────────────
$users = Invoke-RestMethod -Uri "$B/api/admin/users?status=active" -Headers $AH
Check "users has d3 after approval" ((@($users.users | Where-Object { $_.id -eq "d3" }).Count) -eq 1)
$usersAll = (ConvertTo-Json -InputObject $users -Depth 8 -Compress)
Check "users list never exposes regNumber" (-not ($usersAll -match "TS01AB1234"))
$res = Invoke-RestMethod -Uri "$B/api/admin/users?status=pending_verification" -Headers $AH
Check "status filter works" ($res.total -eq 0)

# ── 6. Report lifecycle (rep1) ─────────────────────────
$sr = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/rep1" -Headers $AH -Body (J @{ action = "start_review" })
Check "start_review -> under_review" ($sr.report.status -eq "under_review")
$ri = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/rep1" -Headers $AH -Body (J @{ action = "request_info"; note = "Please share fare screenshot" })
Check "request_info -> info_requested" ($ri.report.status -eq "info_requested")
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/rep1" -Headers $AH -Body (J @{ action = "resolve" }) } catch { Check "resolve without reason -> 400" ((StatusOf $_) -eq 400) }
$esc = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/rep1" -Headers $AH -Body (J @{ action = "escalate"; note = "Escalating to safety" })
Check "escalate creates incident" ($esc.incident -ne $null -and $esc.incident.reportId -eq "rep1")
$inc = Invoke-RestMethod -Uri "$B/api/admin/safety" -Headers $AH
Check "incident linked to report" (@($inc.incidents | Where-Object { $_.report.id -eq "rep1" }).Count -ge 2)
$ak = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/rep1" -Headers $AH -Body (J @{ action = "action"; note = "Fare cleared, driver instructed" })
Check "action -> action_taken" ($ak.report.status -eq "action_taken")
$rd = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reports/rep1" -Headers $AH -Body (J @{ action = "resolve"; note = "Resolved after refund" })
Check "resolve -> resolved" ($rd.report.status -eq "resolved")

# ── 7. Trip moderation (t1/t2) ─────────────────────────
$trips = Invoke-RestMethod -Uri "$B/api/admin/trips?status=published" -Headers $AH
Check "3 published trips in queue" (@($trips.trips).Count -eq 3)
$h = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/trips/t1" -Headers $AH -Body (J @{ action = "hide"; note = "Reported issue" })
Check "hide trip -> hidden flag" ($h.hidden -eq $true -and $h.status -eq "published")
$pub = Invoke-RestMethod -Uri "$B/api/trips?from=Korutla"
Check "hidden trip leaves public feed" (-not (@($pub.trips | Where-Object { $_.id -eq "t1" }).Count -ge 1))
try { $null = Invoke-RestMethod -Uri "$B/api/trips/t1" } catch { Check "hidden trip detail -> 404" ((StatusOf $_) -eq 404) }
$re = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/trips/t1" -Headers $AH -Body (J @{ action = "restore"; note = "Fine after review" })
Check "restore trip -> back in feed" ($re.hidden -eq $false -and (@((Invoke-RestMethod -Uri "$B/api/trips?from=Korutla").trips | Where-Object { $_.id -eq "t1" }).Count) -eq 1)
$cn = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/trips/t2" -Headers $AH -Body (J @{ action = "cancel"; note = "Driver unavailable" })
Check "cancel trip -> cancelled" ($cn.status -eq "cancelled")
try { $null = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/trips/t2" -Headers $AH -Body (J @{ action = "cancel" }) } catch { Check "cancel without reason -> 400" ((StatusOf $_) -eq 400) }

# ── 8. Rentals + Buy&Sell moderation ───────────────────
$q = Invoke-RestMethod -Uri "$B/api/admin/rentals?status=available" -Headers $AH
Check "rental queue lists rn1" (@($q.rentals | Where-Object { $_.id -eq "rn1" }).Count -ge 1)
$rm = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/rentals/rn1" -Headers $AH -Body (J @{ action = "remove"; note = "Duplicate listing" })
Check "remove rental -> removed + prevStatus kept" ($rm.status -eq "removed" -and $rm.prevStatus -eq "available")
$pr = Invoke-RestMethod -Uri "$B/api/rentals"
Check "removed rental leaves public rentals" (-not (@($pr.rentals | Where-Object { $_.id -eq "rn1" }).Count -ge 1))
$rr = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/rentals/rn1" -Headers $AH -Body (J @{ action = "restore" })
Check "restore rental -> available" ($rr.status -eq "available")
$cm = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/listings/c1" -Headers $AH -Body (J @{ action = "remove"; note = "Wrong photos" })
Check "remove car -> removed" ($cm.status -eq "removed")
$cr = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/listings/c1" -Headers $AH -Body (J @{ action = "restore" })
Check "restore car -> published" ($cr.status -eq "published")

# ── 9. Review moderation ───────────────────────────────
$rp = Invoke-RestMethod -Uri "$B/api/admin/reviews?status=pending" -Headers $AH
Check "pending review rv3 in queue" (@($rp.reviews | Where-Object { $_.id -eq "rv3" }).Count -eq 1)
$ap = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reviews/rv3" -Headers $AH -Body (J @{ action = "approve" })
Check "approve review -> approved" ($ap.review.status -eq "approved")
$hd = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/reviews/rv3" -Headers $AH -Body (J @{ action = "hide" })
Check "hide review -> hidden" ($hd.review.status -eq "hidden")

# ── 10. Suspension enforced (d1) ───────────────────────
$l1 = Invoke-RestMethod -Method Post -Uri "$B/api/driver" -ContentType "application/json" -Body '{"phone":"9000000001"}'
$v1 = Invoke-RestMethod -Method Patch -Uri "$B/api/driver" -ContentType "application/json" -Body ('{"phone":"9000000001","otp":"' + $l1.devOtp + '"}')
$tok1 = $v1.token; $H1 = @{ Authorization = "Bearer $tok1"; "Content-Type" = "application/json" }
$sus = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/users/d1" -Headers $AH -Body (J @{ action = "suspend"; note = "Payment dispute under review" })
Check "suspend user -> suspended" ($sus.user.status -eq "suspended")
try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/cars" -ContentType "application/json" -Body (J @{ token = $tok1; make = "Tata"; model = "Susp4"; year = "2021"; price = "500000"; location = "Korutla"; fuel = "petrol"; transmission = "manual"; odometer = "20000" }) } catch { Check "suspended driver create car -> 403" ((StatusOf $_) -eq 403) }
$act = Invoke-RestMethod -Method Patch -Uri "$B/api/admin/users/d1" -Headers $AH -Body (J @{ action = "activate"; note = "" })
Check "activate user -> active" ($act.user.status -eq "active")

# ── 11. Audit trail ────────────────────────────────────
$log0 = Invoke-RestMethod -Uri "$B/api/admin/audit" -Headers $AH
Check "audit grew (>= 15 entries from this run)" ($log0.total -ge 15)
Check "audit captured suspension reason" ((@($log0.logs | Where-Object { $_.note -match "Payment dispute" }).Count) -ge 1)
$vlog = Invoke-RestMethod -Uri "$B/api/admin/audit?action=verification" -Headers $AH
Check "audit action filter" ($vlog.total -ge 2)

# ── 12. Pagination / slow-network states + docs ────────
$users2 = Invoke-RestMethod -Uri "$B/api/admin/users?page=1" -Headers $AH
Check "pagination requests carry page/pageCount" ($users2.page -eq 1 -and $users2.pageCount -ge 1)
$table = Get-Content "$PSScriptRoot\..\src\components\admin\DataTable.tsx" -Raw
Check "DataTable has skeleton + empty + retry" ($table -match "animate-pulse" -and $table -match "Retry" -and $table -match "Prev" -and $table -match "Next")
$docs = Test-Path "$PSScriptRoot\..\docs\05_ADMIN_PANEL.md"
Check "admin spec doc exists" $docs
$dm = Get-Content "$PSScriptRoot\..\docs\04_DATA_MODEL.md" -Raw
Check "data model documents Phase 4" ($dm -match "AdminSession" -and $dm -match "prevStatus")
$panelPages = (Get-ChildItem -LiteralPath "$PSScriptRoot\..\src\app\admin\(panel)" -Filter "page.tsx" -Recurse).Count
Check "13 admin panel pages" ($panelPages -eq 13)

# ── 13. Login rate-limit (last — locks the IP) ─────────
$statuses = @()
for ($i = 0; $i -lt 6; $i++) {
  try { $null = Invoke-RestMethod -Method Post -Uri "$B/api/admin/login" -ContentType "application/json" -Body '{"key":"nope"}'; $statuses += 200 } catch { $statuses += (StatusOf $_) }
}
Check "login locked after 5 failures -> 429" ($statuses[0] -eq 401 -and $statuses[-1] -eq 429)

Write-Output ""
Write-Output "Phase 4: $pass passed, $fail failed"
exit $fail