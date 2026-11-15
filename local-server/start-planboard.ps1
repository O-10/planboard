# ============================================================
#  Planboard · Arranque con SQL Server + Tailscale Funnel
# ------------------------------------------------------------
#  Publica tu servidor local en internet con un ENLACE FIJO
#  (no cambia nunca) usando Tailscale Funnel, y luego arranca
#  el servidor, para que tu compañero pueda ver y editar el
#  tablero desde otra parte.
#
#  Uso:
#    doble clic en start-planboard.bat
#    (o)  powershell -ExecutionPolicy Bypass -File start-planboard.ps1
#
#  Opciones:
#    -NoPublic   No publica en internet (solo red local).
#    -Quick      Usa el tunel rapido de Cloudflare en vez de Tailscale
#                (util si no quieres/puedes instalar Tailscale).
#    -Unpublish  Desactiva Funnel y sale.
#
#  Deja esta ventana abierta mientras trabajas. Con Ctrl+C se
#  detiene el servidor. El enlace de Tailscale NO cambia: la
#  proxima vez que arranques seguira siendo el mismo.
# ============================================================

param(
  [switch]$NoPublic,
  [switch]$Quick,
  [switch]$Unpublish
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$port = if ($env:PORT) { $env:PORT } else { "8090" }
$tsExe = "C:\Program Files\Tailscale\tailscale.exe"
$cloudflared = Join-Path $here "cloudflared.exe"
$cfLog = Join-Path $env:TEMP "planboard-cloudflared.log"
$tunnel = $null
$publicUrl = $null

function Get-TailscaleDns {
  if (-not (Test-Path $tsExe)) { return $null }
  try {
    $raw = & $tsExe status --json 2>$null
    if (-not $raw) { return $null }
    $json = $raw | ConvertFrom-Json
    if ($json.BackendState -ne "Running") { return $null }
    if ($json.Self -and $json.Self.DNSName) { return $json.Self.DNSName.TrimEnd(".") }
  } catch { }
  return $null
}

# Tras encender el PC, Tailscale tarda en conectar. Esperamos un poco para que
# el servidor arranque ya con la URL fija correcta.
function Wait-TailscaleDns {
  param([int]$TimeoutSeconds = 120)
  $start = Get-Date
  $dots = 0
  while (((Get-Date) - $start).TotalSeconds -lt $TimeoutSeconds) {
    $dns = Get-TailscaleDns
    if ($dns) { return $dns }
    Start-Sleep -Seconds 2
    $dots++
    if ($dots % 5 -eq 0) {
      $elapsed = [int]((Get-Date) - $start).TotalSeconds
      Write-Host "      ...esperando a Tailscale (${elapsed}s)" -ForegroundColor DarkGray
    }
  }
  return $null
}

function Enable-QuickTunnel {
  if (-not (Test-Path $cloudflared)) {
    Write-Host "      Descargando cloudflared (una sola vez)..." -ForegroundColor Yellow
    $ProgressPreference = "SilentlyContinue"
    try {
      Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflared -TimeoutSec 300
    } catch {
      Write-Host "      No se pudo descargar cloudflared: $($_.Exception.Message)" -ForegroundColor Red
      return $null
    }
  }
  if (Test-Path $cfLog) { Remove-Item $cfLog -Force -ErrorAction SilentlyContinue }
  $script:tunnel = Start-Process -FilePath $cloudflared `
    -ArgumentList @("tunnel", "--url", "http://localhost:$port", "--no-autoupdate", "--logfile", $cfLog) `
    -PassThru -WindowStyle Hidden
  for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $cfLog) {
      $m = Select-String -Path $cfLog -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches
      if ($m) { return $m.Matches[0].Value }
    }
    if ($script:tunnel.HasExited) { break }
  }
  return $null
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Planboard · SQL Server + enlace publico" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if ($Unpublish) {
  if (Test-Path $tsExe) { & $tsExe funnel --https=443 off 2>$null | Out-Null }
  Write-Host "Funnel desactivado. El enlace dejo de publicarse." -ForegroundColor Yellow
  return
}

# --- 1) Publicacion ---
if ($NoPublic) {
  Write-Host "[1/2] Publicacion omitida (-NoPublic)." -ForegroundColor DarkGray
} elseif ($Quick -or -not (Test-Path $tsExe)) {
  Write-Host "[1/2] Abriendo tunel rapido de Cloudflare..." -ForegroundColor Yellow
  $publicUrl = Enable-QuickTunnel
  if ($publicUrl) {
    Write-Host "      URL (cambia al reiniciar): $publicUrl" -ForegroundColor Green
  } else {
    Write-Host "      No se pudo abrir el tunel. Se continua solo en local." -ForegroundColor Red
  }
} else {
  Write-Host "[1/2] Activando Tailscale Funnel (enlace fijo)..." -ForegroundColor Yellow
  $dns = Wait-TailscaleDns
  if (-not $dns) {
    Write-Host "      Tailscale no esta conectado. Inicia sesion con:" -ForegroundColor Yellow
    Write-Host "        & `"$tsExe`" up" -ForegroundColor Gray
    Write-Host "      (Si Funnel no esta habilitado, Tailscale te dara un enlace para activarlo.)" -ForegroundColor Gray
    Write-Host "      El servidor arrancara igualmente; el enlace publico se activara en cuanto conecte." -ForegroundColor DarkGray
  } else {
    & $tsExe funnel --bg $port 2>&1 | Out-Null
    $publicUrl = "https://$dns"
    Write-Host "      URL fija: $publicUrl" -ForegroundColor Green
  }
}

if ($publicUrl) { $env:PUBLIC_URL = $publicUrl }

# --- 2) Servidor ---
Write-Host "[2/2] Iniciando servidor..." -ForegroundColor Yellow
Write-Host "      Local:    http://localhost:$port" -ForegroundColor Gray
if ($publicUrl) { Write-Host "      Compartir: $publicUrl" -ForegroundColor Gray }
Write-Host ""
Write-Host "Deja esta ventana abierta. Pulsa Ctrl+C para detener." -ForegroundColor DarkGray
Write-Host ""

try {
  node planboard-server.js
} finally {
  if ($tunnel -and -not $tunnel.HasExited) {
    Write-Host "Cerrando tunel..." -ForegroundColor DarkGray
    Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue
  }
}
