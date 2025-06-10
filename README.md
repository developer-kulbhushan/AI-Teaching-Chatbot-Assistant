## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm 6 or higher

### Backend Setup - Automatic

1. Navigate to the `backend` directory:
   
   ```bash
   cd backend
   ```
3. Run the `setup-backend-env.ps1` file:
   ```bash
   .\run-backend.ps1
   ```
4. Create a `.env` file by copying the example file:
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your specific LLM configurations.
6. Run the backend server:
   ```bash
   .\run-backend.ps1
   ```
### Backend Setup - Manual

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - On Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - On macOS and Linux:
     ```bash
     source venv/bin/activate
     ```
4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file by copying the example file:
   ```bash
   cp .env.example .env
   ```
6. Update the `.env` file with your specific LLM configurations.

7. Run the backend server:
   ```bash
   uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   
   ```bash
   cd frontend
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

The application should now be running and accessible in your web browser at the address provided by the development server (usually `http://localhost:5173`).
