// server.js - Express API Server

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { calculateROI } = require('./calculator');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// ==================== API ENDPOINTS ====================

// 1. POST /api/simulate - Calculate ROI (no saving)
app.post('/api/simulate', (req, res) => {
  try {
    const results = calculateROI(req.body);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 2. POST /api/scenarios - Save scenario to database
app.post('/api/scenarios', async (req, res) => {
  try {
    const {
      scenario_name,
      monthly_invoice_volume,
      num_ap_staff,
      avg_hours_per_invoice,
      hourly_wage,
      error_rate_manual,
      error_cost,
      time_horizon_months,
      one_time_implementation_cost
    } = req.body;

    // Validate required fields
    if (!scenario_name || !monthly_invoice_volume || !num_ap_staff) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO scenarios 
      (scenario_name, monthly_invoice_volume, num_ap_staff, avg_hours_per_invoice, 
       hourly_wage, error_rate_manual, error_cost, time_horizon_months, 
       one_time_implementation_cost) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        scenario_name, 
        monthly_invoice_volume, 
        num_ap_staff, 
        avg_hours_per_invoice,
        hourly_wage, 
        error_rate_manual, 
        error_cost, 
        time_horizon_months,
        one_time_implementation_cost || 0
      ]
    );

    res.json({ 
      success: true, 
      id: result.insertId, 
      message: 'Scenario saved successfully!' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ 
        success: false, 
        error: 'Scenario name already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
});

// 3. GET /api/scenarios - List all scenarios
app.get('/api/scenarios', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM scenarios ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 4. GET /api/scenarios/:id - Get specific scenario
app.get('/api/scenarios/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM scenarios WHERE id = ?', 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Scenario not found' 
      });
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 5. DELETE /api/scenarios/:id - Delete scenario
app.delete('/api/scenarios/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM scenarios WHERE id = ?', 
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Scenario not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Scenario deleted successfully!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 6. POST /api/report/generate - Generate report with email gate
app.post('/api/report/generate', async (req, res) => {
  try {
    const { scenario_id, email } = req.body;
    
    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid email required' 
      });
    }

    // Get scenario data
    const [rows] = await pool.execute(
      'SELECT * FROM scenarios WHERE id = ?', 
      [scenario_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Scenario not found' 
      });
    }

    const scenario = rows[0];
    
    // Calculate ROI for the scenario
    const results = calculateROI(scenario);

    // Log report request to database
    await pool.execute(
      'INSERT INTO report_requests (scenario_id, email) VALUES (?, ?)',
      [scenario_id, email]
    );

    // Return report data
    res.json({ 
      success: true, 
      message: 'Report generated successfully! Email captured.',
      data: { 
        scenario, 
        results,
        email_captured: email
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n Server running on http://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api\n`);
});