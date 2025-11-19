import React from 'react';
import { CalculationResult, DeviceType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ResultsDashboardProps {
  results: CalculationResult;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#ef4444'];

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ results }) => {
  
  // Filter breakdown for chart to avoid cluttering with 0s
  const chartData = results.breakdown.filter(b => b.eps > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Key Metrics Cards */}
      <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
          <h3 className="text-ot-accent font-medium text-sm uppercase tracking-wider mb-1">Total EPS</h3>
          <p className="text-4xl font-bold text-white font-mono">{results.totalEps.toLocaleString()}</p>
          <span className="text-gray-400 text-xs mt-2">Events Per Second</span>
        </div>
        
        <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
          <h3 className="text-ot-accent font-medium text-sm uppercase tracking-wider mb-1">Daily Volume</h3>
          <p className="text-4xl font-bold text-white font-mono">{results.dailyLogsGB.toFixed(2)} <span className="text-lg">GB</span></p>
          <span className="text-gray-400 text-xs mt-2">Estimated Raw Logs</span>
        </div>

        <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
          <h3 className="text-ot-accent font-medium text-sm uppercase tracking-wider mb-1">Monthly Storage</h3>
          <p className="text-4xl font-bold text-white font-mono">{results.monthlyLogsTB.toFixed(3)} <span className="text-lg">TB</span></p>
          <span className="text-gray-400 text-xs mt-2">30-Day Retention</span>
        </div>
      </div>

      {/* Pie Chart - Distribution */}
      <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg min-h-[350px]">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ot-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          EPS Distribution by Type
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="eps"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value.toFixed(0)} EPS`, 'Load']}
              />
              <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Magnitude */}
      <div className="bg-ot-800 border border-ot-700 p-6 rounded-xl shadow-lg min-h-[350px]">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ot-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Volume Comparison
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="type" type="category" width={100} stroke="#94a3b8" style={{ fontSize: '10px' }} />
              <Tooltip 
                cursor={{fill: '#334155', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
              />
              <Bar dataKey="eps" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;