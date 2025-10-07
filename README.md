# Invoicing ROI Calculator
A full-stack web application designed to calculate the Return on Investment (ROI) for implementing an automated invoicing system compared to manual Accounts Payable (AP) processes.

Built with a modern stack to provide real-time calculations, data visualization, and scenario management.

# Features
Core ROI Calculation: Calculates monthly savings, payback period, and overall ROI based on user-defined inputs. (Includes a built-in bias factor for conservative estimates).

Scenario Management: Save, load, and delete multiple calculation scenarios to track different business cases.

Data Visualization: Interactive charts (via Recharts) for a clear view of cumulative savings over time.

Report Generation: Email-gated reporting functionality, capturing user data for follow-up.

Responsive Design: Modern and responsive UI built with React and Tailwind CSS.

Robust API: A well-defined API built with Node.js/Express for all CRUD and calculation operations.

# Tech Stack
Component	Technology	Description
Frontend	React (Vite), Recharts, Tailwind CSS	User interface, charting, and styling.
Backend	Node.js, Express.js	RESTful API for handling requests and business logic.
Database	MySQL 8.0	Persistent storage for scenarios and report requests.

# Quick Start (5 Minutes Setup)
Follow these steps to get the application running on your local machine.

Prerequisites
You must have the following installed:

Node.js (16+): For running the backend and frontend development server.

MySQL (8.0+): For the application database (e.g., using MySQL Workbench).

1. Database Setup
Open your MySQL client (e.g., MySQL Workbench).

Run the SQL script provided in the project documentation to create the invoicing_roi_db database and its necessary tables (scenarios and report_requests).

2. Backend Setup
Bash

# Create project structure and navigate to backend
mkdir roi-calculator
cd roi-calculator
mkdir backend
cd backend

# Initialize and install dependencies
npm init -y
npm install express mysql2 cors dotenv body-parser
Create a file named .env in the backend/ folder and configure your database credentials:

Code snippet

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password 
DB_NAME=invoicing_roi_db
Copy the backend code (server.js and calculator.js) into the backend/ folder.

Start the backend server:

Bash

node server.js
# You should see: "✅ Database connected successfully" and "🚀 Server running on http://localhost:5000"
3. Frontend Setup
In a NEW terminal (keep the backend running), navigate to the project root (roi-calculator/).

Bash

# Back to roi-calculator folder
cd .. 

# Create React app
npx create-vite@latest frontend --template react
cd frontend
npm install
npm install recharts

# Replace src/App.jsx and update src/main.jsx with the provided code.

# Start the frontend development server
npm run dev
# You should see: "Local: http://localhost:5173/"
✅ Running the Application
Open your browser and navigate to http://localhost:5173 to use the ROI Calculator!

🔬 API Endpoints
The backend exposes a RESTful API on http://localhost:5000/api.

Method	Endpoint	Description
POST	/api/simulate	Calculates ROI metrics based on simulation inputs.
POST	/api/scenarios	Saves a new scenario to the database.
GET	/api/scenarios	Retrieves a list of all saved scenarios.
DELETE	/api/scenarios/:id	Deletes a specific scenario by ID.
POST	/api/report/generate	Records a request for a report (email-gating).
GET	/api/health	Simple health check for the API status.
