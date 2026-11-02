# Be Kinh: mot lenh tai toan bo ma nguon ve may, cai game nhu mot phan mem va mo game (Windows 10, 11).
#
#   irm https://raw.githubusercontent.com/npt275-ops/cloud-session/claude/eloquent-faraday-raquyc/install.ps1 | iex
#
# Lenh lam gi:
#   1. Tai toan bo ma nguon cua repo ve %LOCALAPPDATA%\BeKinh (game o ...\docs, ma nguon game o ...\aquarium).
#   2. Tao loi tat "Be Kinh" co bieu tuong tren Desktop va trong Start menu.
#   3. Mo game trong mot cua so rieng nhu phan mem (Microsoft Edge co san tren Windows, hoac Google Chrome).
#      Choi khong can mang.
# Chay lai lenh la cap nhat len ban moi nhat. Go: xoa thu muc %LOCALAPPDATA%\BeKinh va hai loi tat "Be Kinh".
# Tuy chon (bien moi truong): BEKINH_DIR, BEKINH_REF, BEKINH_ZIP_URL, BEKINH_NO_OPEN=1.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Repo = 'npt275-ops/cloud-session'
$Ref = if ($env:BEKINH_REF) { $env:BEKINH_REF } else { 'claude/eloquent-faraday-raquyc' }
$Dest = if ($env:BEKINH_DIR) { $env:BEKINH_DIR } else { Join-Path $env:LOCALAPPDATA 'BeKinh' }
$ZipUrl = if ($env:BEKINH_ZIP_URL) { $env:BEKINH_ZIP_URL } else { "https://codeload.github.com/$Repo/zip/refs/heads/$Ref" }

try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch { }

$Tmp = Join-Path ([IO.Path]::GetTempPath()) ('bekinh-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $Tmp | Out-Null
try {
  Write-Host 'Be Kinh: dang tai toan bo ma nguon...'
  $Zip = Join-Path $Tmp 'src.zip'
  Invoke-WebRequest -Uri $ZipUrl -OutFile $Zip -UseBasicParsing
  Expand-Archive -Path $Zip -DestinationPath (Join-Path $Tmp 'x') -Force
  $Src = Get-ChildItem -Path (Join-Path $Tmp 'x') -Directory | Select-Object -First 1
  if (-not $Src -or -not (Test-Path (Join-Path $Src.FullName 'docs\index.html'))) { throw 'Goi tai ve thieu game (docs\index.html).' }

  # chi ghi de thu muc do chinh lenh nay cai truoc do
  if (Test-Path $Dest) {
    if (-not (Test-Path (Join-Path $Dest '.bekinh-install'))) { throw "Thu muc $Dest da co va khong phai ban cai Be Kinh. Dat BEKINH_DIR sang thu muc khac." }
    Remove-Item -Path $Dest -Recurse -Force
  }
  $Parent = Split-Path $Dest -Parent
  if (-not (Test-Path $Parent)) { New-Item -ItemType Directory -Path $Parent | Out-Null }
  Copy-Item -Path $Src.FullName -Destination $Dest -Recurse  # chep (khong chuyen) de cai duoc sang o dia khac
  Set-Content -Path (Join-Path $Dest '.bekinh-install') -Value $Ref -Encoding ASCII
} finally {
  Remove-Item -Path $Tmp -Recurse -Force -ErrorAction SilentlyContinue
}

$Game = Join-Path $Dest 'docs\index.html'
$Url = ([Uri]$Game).AbsoluteUri
$Icon = Join-Path $Dest 'docs\icons\bekinh.ico'
# Edge co san tren Windows 10, 11; khong co thi Chrome. May 32-bit khong co bien ProgramFiles(x86) nen bo qua bien rong.
$Candidates = @()
foreach ($Rel in @('Microsoft\Edge\Application\msedge.exe', 'Google\Chrome\Application\chrome.exe')) {
  foreach ($Base in @(${env:ProgramFiles(x86)}, $env:ProgramFiles, $env:LOCALAPPDATA)) { if ($Base) { $Candidates += (Join-Path $Base $Rel) } }
}
$Browser = $Candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

# loi tat co bieu tuong: Desktop va Start menu
$Shell = New-Object -ComObject WScript.Shell
$Places = @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))
foreach ($Dir in $Places) {
  if (-not $Dir -or -not (Test-Path $Dir)) { continue }
  $Lnk = $Shell.CreateShortcut((Join-Path $Dir 'Be Kinh.lnk'))
  if ($Browser) { $Lnk.TargetPath = $Browser; $Lnk.Arguments = '--app="' + $Url + '"' } else { $Lnk.TargetPath = $Game }
  $Lnk.WorkingDirectory = Join-Path $Dest 'docs'
  if (Test-Path $Icon) { $Lnk.IconLocation = $Icon + ',0' }
  $Lnk.Description = 'Be Kinh - vi than ngoai be kinh'
  $Lnk.Save()
}

if ($env:BEKINH_NO_OPEN -ne '1') {
  if ($Browser) { Start-Process -FilePath $Browser -ArgumentList ('--app="' + $Url + '"') } else { Start-Process -FilePath $Game }
}

Write-Host ''
Write-Host 'Da cai Be Kinh.'
Write-Host "  Ma nguon day du: $Dest  (game: $Dest\docs, ma nguon game: $Dest\aquarium)"
Write-Host '  Mo lai game: bam doi loi tat "Be Kinh" tren Desktop hoac trong Start menu.'
Write-Host '  Cap nhat: chay lai dung lenh cai. Go: xoa thu muc tren va hai loi tat "Be Kinh".'
