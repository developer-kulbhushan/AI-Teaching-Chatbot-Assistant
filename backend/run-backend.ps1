Write-Host "Activating virtual environment..."
& ".\backend-env\Scripts\Activate.ps1"

Write-Host "Starting backend server..."
# Ensure the virtual environment is activated before running this script
uvicorn backend:app --host 0.0.0.0 --port 8000 --reload