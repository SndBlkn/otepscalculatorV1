import React, { useState, useMemo } from 'react';
import { OTDeviceCategory, CalculationResult, DeviceType, LogSourceType } from './types';
import { DEFAULT_DEVICE_CATEGORIES, BYTES_PER_LOG, getRecommendedEps } from './constants';
import ResultsDashboard from './components/ResultsDashboard';
import { analyzeInfrastructure } from './services/bedrockService';
import { useAuth } from './auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const App: React.FC = () => {
  const [devices, setDevices] = useState<OTDeviceCategory[]>(DEFAULT_DEVICE_CATEGORIES);
  const [globalMultiplier, setGlobalMultiplier] = useState<number>(1.0); // To adjust traffic load (Low/Med/High)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Calculate results whenever devices or multiplier changes
  const results: CalculationResult = useMemo(() => {
    let totalEps = 0;
    const breakdown = devices.map(device => {
      const deviceEps = device.count * device.baseEpsMultiplier * globalMultiplier;
      totalEps += deviceEps;
      return {
        type: device.type,
        eps: deviceEps,
        percentage: 0 // Calculated later
      };
    });

    // Group breakdown by type for the chart to be cleaner
    const groupedBreakdown = Object.values(DeviceType).map(type => {
      const sum = breakdown
        .filter(item => item.type === type)
        .reduce((acc, curr) => acc + curr.eps, 0);
      return {
        type,
        eps: sum,
        percentage: totalEps > 0 ? (sum / totalEps) * 100 : 0
      };
    }).sort((a, b) => b.eps - a.eps);

    // Storage calculations
    // EPS * 60s * 60m * 24h = Daily Events
    const dailyEvents = totalEps * 86400;
    const dailyBytes = dailyEvents * BYTES_PER_LOG;
    const dailyLogsGB = dailyBytes / (1024 * 1024 * 1024);
    const monthlyLogsTB = (dailyLogsGB * 30) / 1024;

    return {
      totalEps,
      dailyLogsGB,
      monthlyLogsTB,
      breakdown: groupedBreakdown
    };
  }, [devices, globalMultiplier]);

  const handleCountChange = (id: string, newCount: number) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, count: Math.max(0, newCount) } : d));
  };

  const handleMultiplierChange = (id: string, newMult: number) => {
     setDevices(prev => prev.map(d => d.id === id ? { ...d, baseEpsMultiplier: Math.max(0, newMult) } : d));
  };

  const handleLogSourceChange = (id: string, newSource: LogSourceType) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        // Automatically update multiplier based on recommendation logic
        const recommended = getRecommendedEps(d.type, newSource);
        return { 
          ...d, 
          logSourceType: newSource,
          baseEpsMultiplier: recommended 
        };
      }
      return d;
    }));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeInfrastructure(devices, results);
      setAnalysisResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate analysis. Please try again.";
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-ot-900 text-slate-200 pb-20 font-sans">
      
      {/* Header */}
      <header className="bg-ot-800 border-b border-ot-700 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ot-accent rounded flex items-center justify-center shadow-lg shadow-ot-accent/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">OT SOC <span className="text-ot-accent">EPS Estimator</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 hidden sm:block">
              IEC 62443 / NIST Compatible Sizing
            </span>
            {user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-ot-700">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-slate-300">{user.givenName} {user.familyName}</p>
                  <p className="text-[10px] text-slate-500">{user.company} &middot; {user.title}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-white bg-ot-900 border border-ot-700 hover:border-ot-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Controls: Global Traffic Load */}
        <div className="mb-8 bg-ot-800 border border-ot-700 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h2 className="text-lg font-semibold text-white">Network Traffic Profile</h2>
                <p className="text-sm text-slate-400">Adjust the overall "noisiness" of the OT environment.</p>
             </div>
             <div className="flex items-center gap-4 bg-ot-900 p-2 rounded-lg border border-ot-700">
                <span className={`text-xs font-bold uppercase px-2 ${globalMultiplier === 0.5 ? 'text-ot-accent' : 'text-slate-500'}`}>Low</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1" 
                  value={globalMultiplier}
                  onChange={(e) => setGlobalMultiplier(parseFloat(e.target.value))}
                  className="w-48 accent-ot-accent cursor-pointer"
                />
                <span className={`text-xs font-bold uppercase px-2 ${globalMultiplier === 2.0 ? 'text-ot-accent' : 'text-slate-500'}`}>High</span>
                <span className="ml-2 font-mono text-ot-accent font-bold w-12 text-right">x{globalMultiplier.toFixed(1)}</span>
             </div>
          </div>
        </div>

        {/* Results Dashboard */}
        <ResultsDashboard results={results} />

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Form Section */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-bold text-white">Asset Inventory</h2>
               <span className="text-sm text-slate-400">{devices.length} Categories</span>
            </div>
            
            <div className="grid gap-4">
              {devices.map((device) => (
                <div key={device.id} className="bg-ot-800/50 border border-ot-700 rounded-lg p-4 hover:border-ot-600 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    
                    {/* Device Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{device.name}</h3>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                          {device.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{device.description}</p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                      
                      <div className="flex flex-col items-start">
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1">Log Source</label>
                        <select 
                          value={device.logSourceType}
                          onChange={(e) => handleLogSourceChange(device.id, e.target.value as LogSourceType)}
                          className="w-32 bg-ot-900 border border-ot-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ot-accent text-xs cursor-pointer"
                        >
                          {Object.values(LogSourceType).map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col items-center">
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1">Count</label>
                        <input
                          type="number"
                          min="0"
                          value={device.count}
                          onChange={(e) => handleCountChange(device.id, parseInt(e.target.value) || 0)}
                          className="w-20 bg-ot-900 border border-ot-700 text-white rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ot-accent text-center font-mono"
                        />
                      </div>

                      <div className="flex flex-col items-center">
                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1">EPS/Unit</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={device.baseEpsMultiplier}
                          onChange={(e) => handleMultiplierChange(device.id, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-ot-900 border border-ot-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ot-accent text-center font-mono text-sm"
                        />
                      </div>

                      <div className="flex flex-col items-end w-16 lg:w-20">
                        <span className="text-[10px] uppercase text-slate-500 font-bold mb-1">Total</span>
                        <span className="font-mono font-bold text-ot-accent">
                          {Math.round(device.count * device.baseEpsMultiplier * globalMultiplier).toLocaleString()}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="col-span-1">
            <div className="bg-ot-800 border border-ot-700 rounded-xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                </div>
                <h2 className="text-lg font-semibold text-white">AI Expert Analysis</h2>
              </div>

              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Generate a professional sizing report, risk assessment, and storage strategy based on your specific device inventory using AWS Bedrock (Claude Sonnet).
              </p>

              {!analysisResult && (
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 
                    ${isAnalyzing 
                      ? 'bg-ot-700 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-purple-500/25'
                    }`}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Infrastructure...
                    </>
                  ) : (
                    <>
                      Generate Report
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </>
                  )}
                </button>
              )}

              {analysisError && (
                 <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-xs">
                   {analysisError}
                 </div>
              )}

              {analysisResult && (
                <div className="mt-6 space-y-6 animate-fade-in">
                  
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider">Executive Summary</h4>
                    <p className="text-sm text-slate-300 bg-ot-900/50 p-3 rounded border border-ot-700">
                      {analysisResult.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-yellow-500 tracking-wider">Risk Assessment</h4>
                    <p className="text-sm text-slate-300 bg-ot-900/50 p-3 rounded border border-ot-700">
                      {analysisResult.riskAssessment}
                    </p>
                  </div>

                   <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-blue-400 tracking-wider">Storage Strategy</h4>
                    <p className="text-sm text-slate-300 bg-ot-900/50 p-3 rounded border border-ot-700">
                      {analysisResult.storageStrategy}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-green-400 tracking-wider">Recommendations</h4>
                    <ul className="space-y-2">
                      {analysisResult.keyRecommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-300 flex gap-2 items-start">
                          <span className="text-green-500 mt-1">▹</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => setAnalysisResult(null)}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-4 underline"
                  >
                    Clear Analysis
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;