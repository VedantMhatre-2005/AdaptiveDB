1. FastAPI REST Server (Required for Frontend UI)

In your first terminal:

powershell
cd app
python api_server.py

2. gRPC Coordinator Server (For CLI / Direct gRPC Clients)

If you also want to test operations directly via the gRPC client (python client.py ...):

powershell
cd app
python server.py

Step 3: Start the Frontend

In a second terminal:

powershell
cd frontend
npm install   # If not already installed
npm run dev