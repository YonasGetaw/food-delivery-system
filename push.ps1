param(
  [Parameter(Mandatory = $true)]
  [string]$Message
)

$ErrorActionPreference = 'Stop'

function Exec([string]$exe, [string[]]$arguments) {
  $pretty = "$exe " + ($arguments -join ' ')
  Write-Host "`n$pretty" -ForegroundColor Cyan
  & $exe @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $pretty"
  }
}

# Ensure we're running from the repo root (directory containing .git)
if (-not (Test-Path -Path ".git")) {
  throw "Run this script from the repository root (folder that contains .git)."
}

# Show current branch
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "On branch: $branch" -ForegroundColor Gray

# Stage all changes (respects .gitignore)
Exec "git" @("add", "-A")

# If nothing staged, exit
$porcelain = (git status --porcelain).Trim()
if ([string]::IsNullOrWhiteSpace($porcelain)) {
  Write-Host "No changes to commit." -ForegroundColor Yellow
  exit 0
}

# Commit
Exec "git" @("commit", "-m", $Message)

# Push current branch to origin
Exec "git" @("push")

Write-Host "\nDone: committed and pushed." -ForegroundColor Green
