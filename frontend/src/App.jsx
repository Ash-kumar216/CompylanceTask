import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [formData, setFormData] = useState({
    scenario_name: '',
    monthly_invoice_volume: 2000,
    num_ap_staff: 3,
    avg_hours_per_invoice: 0.17,
    hourly_wage: 30,
    error_rate_manual: 0.5,
    error_cost: 100,
    time_horizon_months: 36,
    one_time_implementation_cost: 50000
  });

  const [results, setResults] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [reportEmail, setReportEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadScenarios();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }));
  };

  const calculateROI = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
        showMessage('success', 'ROI calculated successfully!');
      } else {
        showMessage('error', data.error || 'Calculation failed');
      }
    } catch (error) {
      showMessage('error', 'Connection error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveScenario = async () => {
    if (!formData.scenario_name.trim()) {
      showMessage('error', 'Please enter a scenario name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        setCurrentScenarioId(data.id);
        showMessage('success', 'Scenario saved successfully!');
        loadScenarios();
      } else {
        showMessage('error', data.error || 'Failed to save scenario');
      }
    } catch (error) {
      showMessage('error', 'Connection error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await fetch(`${API_URL}/scenarios`);
      const data = await response.json();
      
      if (data.success) {
        setScenarios(data.data);
      }
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    }
  };

  const loadScenario = async (id) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/scenarios/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const scenario = data.data;
        setFormData({
          scenario_name: scenario.scenario_name,
          monthly_invoice_volume: scenario.monthly_invoice_volume,
          num_ap_staff: scenario.num_ap_staff,
          avg_hours_per_invoice: parseFloat(scenario.avg_hours_per_invoice),
          hourly_wage: parseFloat(scenario.hourly_wage),
          error_rate_manual: parseFloat(scenario.error_rate_manual),
          error_cost: parseFloat(scenario.error_cost),
          time_horizon_months: scenario.time_horizon_months,
          one_time_implementation_cost: parseFloat(scenario.one_time_implementation_cost)
        });
        setCurrentScenarioId(id);
        setTimeout(() => calculateROI(), 100);
        showMessage('success', 'Scenario loaded!');
      }
    } catch (error) {
      showMessage('error', 'Failed to load scenario');
    } finally {
      setLoading(false);
    }
  };

  const deleteScenario = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scenario?')) return;
    
    try {
      const response = await fetch(`${API_URL}/scenarios/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Scenario deleted!');
        loadScenarios();
        if (currentScenarioId === id) {
          setCurrentScenarioId(null);
        }
      }
    } catch (error) {
      showMessage('error', 'Failed to delete scenario');
    }
  };

  const generateReport = async () => {
    if (!reportEmail || !reportEmail.includes('@')) {
      showMessage('error', 'Please enter a valid email');
      return;
    }

    if (!currentScenarioId) {
      showMessage('error', 'Please save the scenario first!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: currentScenarioId,
          email: reportEmail
        })
      });
      const data = await response.json();
      
      if (data.success) {
        showMessage('success', 'Report generated! Email captured successfully.');
        setReportEmail('');
      } else {
        showMessage('error', data.error || 'Failed to generate report');
      }
    } catch (error) {
      showMessage('error', 'Connection error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getChartData = () => {
    if (!results) return [];
    
    const data = [];
    const implementationCost = formData.one_time_implementation_cost;
    
    for (let month = 0; month <= formData.time_horizon_months; month++) {
      data.push({
        month,
        savings: month * results.monthly_savings - implementationCost
      });
    }
    return data;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Invoicing ROI Calculator
          </h1>
          <p className="text-gray-600">
            Discover how much you can save with automated invoicing
          </p>
        </div>

        {message.text && (
          <div className={`mb-4 p-4 rounded-lg text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 justify-items-center">
          {/* Input Form Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Enter Your Data</h2>
            
            <div className="space-y-4">
              <InputField label="Scenario Name" name="scenario_name" value={formData.scenario_name} onChange={handleInputChange} placeholder="e.g., Q4_Pilot" />
              <InputField label="Monthly Invoice Volume" name="monthly_invoice_volume" type="number" value={formData.monthly_invoice_volume} onChange={handleInputChange} />
              <InputField label="Number of AP Staff" name="num_ap_staff" type="number" value={formData.num_ap_staff} onChange={handleInputChange} />
              <InputField label="Avg Hours Per Invoice" name="avg_hours_per_invoice" type="number" step="0.01" value={formData.avg_hours_per_invoice} onChange={handleInputChange} />
              <InputField label="Hourly Wage ($)" name="hourly_wage" type="number" value={formData.hourly_wage} onChange={handleInputChange} />
              <InputField label="Manual Error Rate (%)" name="error_rate_manual" type="number" step="0.1" value={formData.error_rate_manual} onChange={handleInputChange} />
              <InputField label="Cost Per Error ($)" name="error_cost" type="number" value={formData.error_cost} onChange={handleInputChange} />
              <InputField label="Time Horizon (Months)" name="time_horizon_months" type="number" value={formData.time_horizon_months} onChange={handleInputChange} />
              <InputField label="Implementation Cost ($)" name="one_time_implementation_cost" type="number" value={formData.one_time_implementation_cost} onChange={handleInputChange} />

              <div className="flex gap-2 pt-4">
                <button onClick={calculateROI} disabled={loading} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Calculating...' : 'Calculate ROI'}
                </button>
                <button onClick={saveScenario} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  Save Scenario
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Saved Scenarios</h3>
              <div className="space-y-2">
                {scenarios.map(scenario => (
                  <div key={scenario.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <button onClick={() => loadScenario(scenario.id)} className="flex-1 text-left hover:bg-gray-100 p-2 rounded">
                      {scenario.scenario_name}
                    </button>
                    <button onClick={() => deleteScenario(scenario.id)} className="text-red-600 hover:text-red-800 px-2">
                      🗑️
                    </button>
                  </div>
                ))}
                {scenarios.length === 0 && (
                  <p className="text-gray-500 text-sm text-center">No saved scenarios yet</p>
                )}
              </div>
            </div>
          </div>

          {/* ROI Results Card */}
          <div className="w-full max-w-md">
            {results ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">💰 Your ROI Results</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <MetricCard label="Monthly Savings" value={`$${results.monthly_savings.toLocaleString()}`} color="green" />
                  <MetricCard label="Payback Period" value={`${results.payback_months} mo`} color="blue" />
                  <MetricCard label="ROI %" value={`${results.roi_percentage}%`} color="purple" />
                  <MetricCard label="Total Savings" value={`$${results.cumulative_savings.toLocaleString()}`} color="indigo" />
                </div>

                <div className="mt-6 flex justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                      <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name="Cumulative Savings" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-3">📄 Download Full Report</h3>
                  <div className="flex gap-2">
                    <input type="email" value={reportEmail} onChange={(e) => setReportEmail(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="your@email.com" />
                    <button onClick={generateReport} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    We'll capture your email for the detailed PDF report
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <p className="text-gray-500 text-lg">
                  👆 Enter your data and click Calculate ROI to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, name, type = "text", value, onChange, placeholder, step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} step={step} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
    </div>
  );
}

function MetricCard({ label, value, color }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className={`${colorClasses[color]} p-4 rounded-lg text-center`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default App;
