$ErrorActionPreference = 'Stop'
$cluster = Join-Path $PSScriptRoot '.postgres'

if (-not (Test-Path -LiteralPath (Join-Path $cluster 'PG_VERSION'))) {
    throw 'Esta copia del proyecto no tiene una instancia local de PostgreSQL. Configura tu conexión en backend/.env según el README.'
}

pg_ctl -D $cluster status *> $null
if ($LASTEXITCODE -ne 0) {
    pg_ctl -D $cluster -l (Join-Path $cluster 'server.log') -o '-h 127.0.0.1 -p 55438' -w start
    if ($LASTEXITCODE -ne 0) {
        throw 'PostgreSQL no pudo iniciar. Revisa backend/.postgres/server.log.'
    }
}

Write-Host 'PostgreSQL del catálogo está disponible en 127.0.0.1:55438.'
