# Writes the autoconfig into the Firefox install folder, or removes it. Run elevated by
# scripts/autoconfig.mjs (task autoconfig:install / autoconfig:remove), which passes this
# script's text from the repo's last commit inline, not this file: anything running as the user
# can write the repo. The files come in -Payload, written from that commit too; it's read once
# and used only if its bytes hash to -PayloadHash, so nothing changed after the check gets in.
# The window is hidden: errors go to -Log.
param(
  [ValidateSet('install', 'remove')][string]$Action,
  [string]$Target,
  # UTF-8 JSON: [{ "path": "defaults/pref/autoconfig.js", "data": "<base64>" }, ...]
  [string]$Payload,
  [string]$PayloadHash,
  [string]$Log
)
try {
  $ErrorActionPreference = 'Stop'
  if (-not (Test-Path -LiteralPath (Join-Path $Target 'firefox.exe'))) { throw "No firefox.exe in $Target" }
  $bytes = [IO.File]::ReadAllBytes($Payload)
  $sha = [Security.Cryptography.SHA256]::Create()
  $hash = ([BitConverter]::ToString($sha.ComputeHash($bytes)) -replace '-', '').ToLower()
  if ($hash -ne $PayloadHash) { throw "The payload changed after the check (sha256 $hash)" }
  foreach ($f in ([Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json)) {
    # Only paths inside the install folder
    if ([IO.Path]::IsPathRooted($f.path) -or $f.path -match '(^|[\\/])\.\.([\\/]|$)') { throw "Bad path: $($f.path)" }
    $dst = Join-Path $Target $f.path
    if ($Action -eq 'install') {
      New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
      [IO.File]::WriteAllBytes($dst, [Convert]::FromBase64String($f.data))
    } elseif (Test-Path -LiteralPath $dst) {
      Remove-Item -LiteralPath $dst
    }
  }
} catch {
  Set-Content -LiteralPath $Log -Value ($_ | Out-String) -Encoding UTF8
  exit 1
}
