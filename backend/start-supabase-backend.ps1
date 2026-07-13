$ErrorActionPreference = "Stop"

$project = Split-Path -Parent $MyInvocation.MyCommand.Path
$libDir = "C:\Users\523982\AppData\Local\Temp\shrishti-backend-libs-20260708152002\BOOT-INF\lib"

if (-not (Test-Path -LiteralPath $libDir)) {
    throw "Backend dependency cache not found: $libDir"
}

Write-Host "Use the Supabase Session pooler JDBC URL if the direct db.* URL times out."
Write-Host "Example: jdbc:postgresql://aws-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
Write-Host "Pooler username usually looks like: postgres.bjpvxgatcmncbizvmakl"
Write-Host ""

$defaultDirectUrl = "jdbc:postgresql://db.bjpvxgatcmncbizvmakl.supabase.co:5432/postgres?sslmode=require"
$datasourceUrl = Read-Host "Supabase JDBC URL [$defaultDirectUrl]"
if ([string]::IsNullOrWhiteSpace($datasourceUrl)) {
    $datasourceUrl = $defaultDirectUrl
}
if ($datasourceUrl -match "REGION|<|>|\[|\]") {
    throw "The JDBC URL still contains a placeholder. Copy the real Session pooler connection string from Supabase Dashboard > Connect, then convert it to JDBC format."
}

$datasourceUsername = Read-Host "Supabase DB username [postgres]"
if ([string]::IsNullOrWhiteSpace($datasourceUsername)) {
    $datasourceUsername = "postgres"
}
if ($datasourceUsername -match "REGION|<|>|\[|\]") {
    throw "The username still contains a placeholder. Use the real pooler username from Supabase, usually postgres.<project-ref>."
}

$password = Read-Host "Supabase database password" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

$env:SPRING_DATASOURCE_URL = $datasourceUrl
$env:SPRING_DATASOURCE_USERNAME = $datasourceUsername
$env:SPRING_DATASOURCE_PASSWORD = $plainPassword
$env:SPRING_DATASOURCE_DRIVER_CLASS_NAME = "org.postgresql.Driver"
$env:SPRING_JPA_DATABASE_PLATFORM = "org.hibernate.dialect.PostgreSQLDialect"
$env:SPRING_JPA_HIBERNATE_DDL_AUTO = "validate"
$env:H2_CONSOLE_ENABLED = "false"

$libs = (Get-ChildItem -Path $libDir -Filter *.jar | ForEach-Object { $_.FullName }) -join ";"
$classPath = "$project\target\classes;$libs"

Write-Host "Starting backend with datasource:"
Write-Host $env:SPRING_DATASOURCE_URL

$javaArgs = @(
    "-Dspring.devtools.restart.enabled=false",
    "-Dserver.port=8080",
    "-cp",
    $classPath,
    "com.library.LendingLibraryApplication"
)

& java.exe @javaArgs
