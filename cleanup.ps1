# Script para limpiar el proyecto, manteniendo solo lo esencial

# Directorios a mantener (relativos a la raíz del proyecto)
$keepDirs = @(
    "app/api/chat/mcp",
    "app/assistants",
    "app/chat-v3",
    "app/components",
    "app",
    "public/LogosNuevos",
    "lib",
    "styles"
)

# Archivos a mantener en la raíz de app
$keepAppFiles = @(
    "page.tsx",
    "layout.tsx",
    "globals.css"
)

# Archivos públicos a mantener
$keepPublicFiles = @(
    "placeholder-logo.png",
    "placeholder-logo.svg",
    "placeholder-user.jpg",
    "placeholder.jpg",
    "placeholder.svg"
)

# Archivos de configuración a mantener
$keepConfigFiles = @(
    "next.config.js",
    "package.json",
    "package-lock.json",
    "postcss.config.js",
    "tailwind.config.js",
    "tsconfig.json",
    "README.md"
)

# Directorios a eliminar
$dirsToRemove = @(
    "app/chat",
    "app/api/chat/assistants",
    "app/api/chat/route.ts",
    "app/api/chat/threads"
)

# Mostrar lo que se va a eliminar
Write-Host "Se eliminarán los siguientes directorios:" -ForegroundColor Yellow
$dirsToRemove | ForEach-Object { Write-Host "- $_" }

# Preguntar confirmación
$confirmation = Read-Host "¿Desea continuar? (s/n)"
if ($confirmation -ne 's') {
    Write-Host "Operación cancelada." -ForegroundColor Red
    exit
}

# Función para crear directorios si no existen
function Ensure-DirectoryExists($path) {
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

# Crear directorios necesarios
$keepDirs | ForEach-Object {
    $dirPath = Join-Path $PSScriptRoot $_
    Ensure-DirectoryExists $dirPath
}

# Eliminar directorios
foreach ($dir in $dirsToRemove) {
    $fullPath = Join-Path $PSScriptRoot $dir
    if (Test-Path $fullPath) {
        Write-Host "Eliminando $fullPath..." -ForegroundColor Cyan
        try {
            Remove-Item -Path $fullPath -Recurse -Force -ErrorAction Stop
            Write-Host "  [OK] Eliminado correctamente" -ForegroundColor Green
        } catch {
            Write-Host "  [ERROR] No se pudo eliminar: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "No se encontró: $fullPath" -ForegroundColor Gray
    }
}

# Mostrar resumen
Write-Host "`nResumen de la limpieza:" -ForegroundColor Cyan
Write-Host "- Se conservaron los directorios:" -ForegroundColor Green
$keepDirs | Sort-Object | ForEach-Object { Write-Host "  - $_" }

Write-Host "`n- Se conservaron los archivos de configuración:" -ForegroundColor Green
$keepConfigFiles | Sort-Object | ForEach-Object { Write-Host "  - $_" }

Write-Host "`n- Se conservaron los recursos públicos:" -ForegroundColor Green
$keepPublicFiles | Sort-Object | ForEach-Object { Write-Host "  - public/$_" }

Write-Host "`nLimpieza completada." -ForegroundColor Green
