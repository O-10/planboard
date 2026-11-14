# ============================================================
#  Planboard · Arranque con SQL Server + túnel de Cloudflare
# ------------------------------------------------------------
#  Abre un túnel público y luego el servidor local, para que tu
#  compañero pueda ver y editar el tablero desde otra parte.
#
#  Uso:  doble clic en start-planboard.bat
#        (o)  powershell -ExecutionPolicy Bypass -File start-planboard.ps1
#
#  Deja esta ventana abierta mientras trabajas. Con Ctrl+C se
#  detienen el servidor y el túnel.
#
#  Nota: el enlace gratuito de Cloudflare cambia cada vez que
#  reinicias. Si quieres un enlace fijo necesitas un dominio
#  propio (mira el README).
# ============================================================

param(
  [switch]$NoTunnel
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$port = if ($env:PORT) { $env:PORT } else { "8090" }
$cloudflared = Join-Path $here "cloudflared.exe"
$log = Join-Path $env:TEMP "planboard-cloudflared.log"
$tunnel = $null

function Descargar-Cloudflared {
  $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  Write-Host "      Descargando cloudflared (una sola vez)..." -ForegroundColor Yellow
  $ProgressPreference = "SilentlyContinue"
  try {
    Invoke-WebRequest -Uri $url -OutFile $cloudflared -TimeoutSec 300
    Write-Host "      Descarga completada." -ForegroundColor Green
    return $true
  } catch {
    Write-Host "      No se pudo descargar: $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Planboard · SQL Server + tunel de Cloudflare" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# --- 1) Túnel público ---
if (-not $NoTunnel) {
  if (-not (Test-Path $cloudflared)) {
    if (-not (Descargar-Cloudflared)) {
      Write-Host "      Se continuara solo en la red local." -ForegroundColor Red
    }
  }

  if (Test-Path $cloudflared) {
    if (Test-Path $log) { Remove-Item $log -Force -ErrorAction SilentlyContinue }
    Write-Host "[1/2] Abriendo tunel publico..." -ForegroundColor Yellow
    $tunnel = Start-Process -FilePath $cloudflared `
      -ArgumentList @("tunnel", "--url", "http://localhost:$port", "--no-autoupdate", "--logfile", $log) `
      -PassThru -WindowStyle Hidden

    $publicUrl = $null
    for ($i = 0; $i -lt 45; $i++) {
      Start-Sleep -Seconds 1
      if (Test-Path $log) {
        $m = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches
        if ($m) { $publicUrl = $m.Matches[0].Value; break }
      }
      if ($tunnel.HasExited) { break }
    }

    if ($publicUrl) {
      $env:PUBLIC_URL = $publicUrl
      Write-Host "      URL publica: $publicUrl" -ForegroundColor Green
    } else {
      Write-Host "      No se pudo obtener la URL publica del tunel." -ForegroundColor Red
      Write-Host "      Se continuara solo en la red local." -ForegroundColor Red
    }
  }
} else {
  Write-Host "[1/2] Tunel omitido (-NoTunnel)." -ForegroundColor DarkGray
}

# --- 2) Servidor ---
Write-Host "[2/2] Iniciando servidor..." -ForegroundColor Yellow
Write-Host "      Local:    http://localhost:$port" -ForegroundColor Gray
if ($env:PUBLIC_URL) {
  Write-Host "      Compartir: $($env:PUBLIC_URL)" -ForegroundColor Gray
}
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
