# =====================================================================
#  Kokokara HP - Auto deploy watcher
#  Watches this folder and auto-commits/pushes changes to GitHub.
#  Netlify then publishes automatically.
# =====================================================================
param([switch]$Install)

$ErrorActionPreference = 'Continue'
$repo   = $PSScriptRoot
$branch = 'main'
$logF   = Join-Path $repo 'auto_deploy.log'
$debounceSeconds = 6   # wait this long after the last change before pushing

function Log([string]$m) {
    $line = "{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $m
    Add-Content -LiteralPath $logF -Value $line -Encoding UTF8
}

Set-Location -LiteralPath $repo

# ---- Optional: register into Startup so it runs on every logon ----
if ($Install) {
    try {
        $startup = [Environment]::GetFolderPath('Startup')
        $lnk = Join-Path $startup 'KokokaraAutoDeploy.lnk'
        $ws  = New-Object -ComObject WScript.Shell
        $sc  = $ws.CreateShortcut($lnk)
        $sc.TargetPath       = 'powershell.exe'
        $sc.Arguments        = '-ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $PSCommandPath + '"'
        $sc.WorkingDirectory = $repo
        $sc.WindowStyle      = 7
        $sc.Save()
        Log "Installed to Startup: $lnk"
    } catch {
        Log "Startup install failed: $($_.Exception.Message)"
    }
}

Log "Watcher started. repo=$repo branch=$branch"

# ---- Set up FileSystemWatcher ----
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path                  = $repo
$fsw.IncludeSubdirectories = $true
$fsw.NotifyFilter          = [System.IO.NotifyFilters]::FileName -bor `
                             [System.IO.NotifyFilters]::DirectoryName -bor `
                             [System.IO.NotifyFilters]::LastWrite

$script:dirty = $false
$onChange = {
    $p = $Event.SourceEventArgs.FullPath
    if ($p -notlike '*\.git\*' -and $p -notlike '*auto_deploy.log') {
        $script:dirty = $true
    }
}
Register-ObjectEvent $fsw Changed  -Action $onChange | Out-Null
Register-ObjectEvent $fsw Created  -Action $onChange | Out-Null
Register-ObjectEvent $fsw Deleted  -Action $onChange | Out-Null
Register-ObjectEvent $fsw Renamed  -Action $onChange | Out-Null
$fsw.EnableRaisingEvents = $true

# ---- Main loop with debounce ----
$lastChange = $null
while ($true) {
    Start-Sleep -Milliseconds 1000

    if ($script:dirty) {
        $script:dirty = $false
        $lastChange = Get-Date
        continue
    }

    if ($lastChange -ne $null -and ((Get-Date) - $lastChange).TotalSeconds -ge $debounceSeconds) {
        $lastChange = $null
        $status = (& git status --porcelain 2>$null)
        if ($status) {
            $msg = "auto: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm')
            & git add -A 2>&1 | Out-Null
            & git commit -m $msg 2>&1 | Out-Null
            $push = (& git push origin $branch 2>&1)
            if ($LASTEXITCODE -eq 0) {
                Log "Deployed ($msg)"
            } else {
                Log "Push FAILED: $push"
            }
        }
    }
}
