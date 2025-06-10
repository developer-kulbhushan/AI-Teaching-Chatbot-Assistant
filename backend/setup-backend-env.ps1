# Exit on any error
$ErrorActionPreference = "Stop"

# Step 1: Create a virtual environment named "backend-env"
Write-Host "Creating virtual environment..."
python -m venv "backend-env"

# Step 2: Activate the virtual environment
Write-Host "Activating virtual environment..."
& ".\backend-env\Scripts\Activate.ps1"

# Step 3: Install requirements
Write-Host "Installing packages from requirements.txt..."
pip install -r ".\requirements.txt"

Write-Host "Setup complete. Virtual environment is ready."