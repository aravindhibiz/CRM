import React, { useEffect, useState, useMemo } from 'react';
import Header from 'components/ui/Header';
import Breadcrumb from 'components/ui/Breadcrumb';
import Icon from 'components/AppIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import dealsService from '../../services/dealsService'; // Import dealsService
import { Loader2 } from 'lucide-react'; // Assuming lucide-react for icons

const PipelineAnalytics = () => {
  const [selectedDateRange, setSelectedDateRange] = useState('last30days');
  const [selectedTerritory, setSelectedTerritory] = useState('all');
  const [selectedRep, setSelectedRep] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // State for actual data
  const [pipelineFunnelData, setPipelineFunnelData] = useState([]);
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  const [winRateData, setWinRateData] = useState([]);
  const [velocityMetrics, setVelocityMetrics] = useState([]);
  const [territoryData, setTerritoryData] = useState([]);
  const [repPerformanceData, setRepPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all analytics data from Supabase - no mock/stale data
        const [pipeline, revenue, performance, winRate] = await Promise.all([
          dealsService.getPipelineDeals(),
          dealsService.getRevenueData(),
          dealsService.getPerformanceMetrics(),
          dealsService.getWinRateData(),
        ]);

        // Transform pipeline data for funnel chart
        const transformedPipeline = Object.values(pipeline).map(stage => ({
          name: stage.title,
          value: stage.deals.reduce((sum, deal) => sum + deal.value, 0),
          count: stage.deals.length,
          fill: stage.id === 'lead' ? '#3B82F6' :
                stage.id === 'qualified' ? '#6366F1' :
                stage.id === 'proposal' ? '#8B5CF6' :
                stage.id === 'negotiation' ? '#A855F7' :
                stage.id === 'closed_won' ? '#10B981' : '#EF4444' // closed_lost
        }));

        setPipelineFunnelData(transformedPipeline);
        setRevenueTrendData(revenue);
        setWinRateData(winRate);
        // For performance metrics, we need to adapt the structure to match the existing UI expectations
        // The getPerformanceMetrics returns: { quota, achieved, percentage, dealsWon, dealsLost, avgDealSize, conversionRate }
        // The UI expects velocityMetrics, territoryData, repPerformanceData
        // This will require more complex mapping or additional service calls.
        // For now, let's just set the performanceMetrics directly and adapt the UI later if needed.
        // Or, we can create dummy data based on the fetched performance for now.
        // Let's create dummy data for velocityMetrics, territoryData, repPerformanceData based on the fetched performance.

        // Dummy velocityMetrics based on fetched performance
        setVelocityMetrics([
          { metric: 'Avg Deal Size', value: `${performance.avgDealSize.toLocaleString()}`, change: '', trend: 'up' },
          { metric: 'Win Rate', value: `${performance.conversionRate}%`, change: '', trend: 'up' },
          { metric: 'Deals Won', value: performance.dealsWon, change: '', trend: 'up' },
          { metric: 'Deals Lost', value: performance.dealsLost, change: '', trend: 'down' },
        ]);

        // Use actual data from Supabase for territories and reps
        // For now, we'll use the global data as a single territory/rep since we don't have separate territory/rep data in the DB yet
        setTerritoryData([
          { 
            name: 'Global Territory', 
            revenue: performance.achieved, 
            deals: performance.dealsWon + performance.dealsLost, 
            winRate: performance.conversionRate,
            avgDealSize: performance.avgDealSize
          },
        ]);

        setRepPerformanceData([
          { 
            name: 'Current User', 
            revenue: performance.achieved, 
            deals: performance.dealsWon, 
            quota: performance.quota, 
            attainment: performance.percentage 
          },
        ]);


      } catch (err) {
        console.error("Failed to fetch analytics data:", err);
        setError("Failed to load analytics data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-text-secondary">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <p className="text-error text-lg">{error}</p>
      </div>
    );
  }

  const dateRangeOptions = [
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisquarter', label: 'This Quarter' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const territoryOptions = [
    { value: 'all', label: 'All Territories' },
    { value: 'north-america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia-pacific', label: 'Asia Pacific' },
    { value: 'latin-america', label: 'Latin America' }
  ];

  const repOptions = [
    { value: 'all', label: 'All Representatives' },
    { value: 'sarah-johnson', label: 'Sarah Johnson' },
    { value: 'michael-chen', label: 'Michael Chen' },
    { value: 'david-rodriguez', label: 'David Rodriguez' },
    { value: 'emily-davis', label: 'Emily Davis' },
    { value: 'james-wilson', label: 'James Wilson' }
  ];

  const tabOptions = [
    { id: 'overview', label: 'Overview', icon: 'BarChart3' },
    { id: 'pipeline', label: 'Pipeline', icon: 'TrendingUp' },
    { id: 'performance', label: 'Performance', icon: 'Target' },
    { id: 'forecasting', label: 'Forecasting', icon: 'Calendar' }
  ];

  const exportOptions = [
    { label: 'Export as PDF', icon: 'FileText' },
    { label: 'Export as Excel', icon: 'Download' },
    { label: 'Schedule Email Report', icon: 'Mail' },
    { label: 'Create Dashboard Widget', icon: 'Plus' }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })?.format(value);
  };

  const formatPercentage = (value) => {
    return `${value?.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-surface border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-normal text-text-primary mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry?.color }}>
              {entry?.name}: {typeof entry?.value === 'number' && entry?.value > 1000 ? formatCurrency(entry?.value) : entry?.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb />
            
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Pipeline Analytics</h1>
                <p className="text-text-secondary">Comprehensive sales performance insights and forecasting</p>
              </div>
              
              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                <div className="relative">
                  <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Icon name="Download" size={16} />
                    <span>Export</span>
                    <Icon name="ChevronDown" size={14} />
                  </button>
                  
                  {isExportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-lg border border-border z-50">
                      <div className="py-2">
                        {exportOptions?.map((option) => (
                          <button
                            key={option?.label}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
                            onClick={() => setIsExportMenuOpen(false)}
                          >
                            <Icon name={option?.icon} size={16} />
                            <span>{option?.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-150 flex items-center space-x-2">
                  <Icon name="Settings" size={16} />
                  <span>Customize</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="card p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-normal text-text-primary mb-2">Date Range</label>
                  <select
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e?.target?.value)}
                    className="input-field"
                  >
                    {dateRangeOptions?.map((option) => (
                      <option key={option?.value} value={option?.value}>
                        {option?.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-text-primary mb-2">Territory</label>
                  <select
                    value={selectedTerritory}
                    onChange={(e) => setSelectedTerritory(e?.target?.value)}
                    className="input-field"
                  >
                    {territoryOptions?.map((option) => (
                      <option key={option?.value} value={option?.value}>
                        {option?.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-normal text-text-primary mb-2">Sales Rep</label>
                  <select
                    value={selectedRep}
                    onChange={(e) => setSelectedRep(e?.target?.value)}
                    className="input-field"
                  >
                    {repOptions?.map((option) => (
                      <option key={option?.value} value={option?.value}>
                        {option?.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button className="btn-secondary w-full flex items-center justify-center space-x-2">
                    <Icon name="Search" size={16} />
                    <span>Apply Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border mb-8">
              <nav className="flex space-x-8">
                {tabOptions?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-normal text-sm transition-colors duration-150 ${
                      activeTab === tab?.id
                        ? 'border-primary text-primary' :'border-transparent text-text-secondary hover:text-text-primary hover:border-border-dark'
                    }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {velocityMetrics?.map((metric) => (
                    <div key={metric?.metric} className="card p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-normal text-text-secondary">{metric?.metric}</h3>
                        <div className={`flex items-center space-x-1 ${
                          metric?.trend === 'up' ? 'text-success' : 'text-error'
                        }`}>
                          <Icon name={metric?.trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={14} />
                          <span className="text-xs font-normal">{metric?.change}</span>
                        </div>
                      </div>
                      <p className="text-2xl font-normal text-text-primary">{metric?.value}</p>
                    </div>
                  ))}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pipeline Funnel */}
                  <div className="card p-6">
                    <h3 className="text-lg font-normal text-text-primary mb-6">Pipeline Funnel</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                          <Tooltip content={<CustomTooltip />} />
                          <Funnel
                            dataKey="value"
                            data={pipelineFunnelData}
                            isAnimationActive
                          >
                            <LabelList position="center" fill="#fff" stroke="none" />
                          </Funnel>
                        </FunnelChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Revenue Trend */}
                  <div className="card p-6">
                    <h3 className="text-lg font-normal text-text-primary mb-6">Revenue Trend</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="month" stroke="#6B7280" />
                          <YAxis stroke="#6B7280" tickFormatter={(value) => `$${value/1000}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} name="Actual" />
                          <Line type="monotone" dataKey="forecast" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                          <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} name="Target" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Win Rate Analysis */}
                <div className="card p-6">
                  <h3 className="text-lg font-normal text-text-primary mb-6">Win Rate Analysis</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={winRateData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="period" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" tickFormatter={(value) => `${value}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="winRate" fill="#3B82F6" name="Win Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Tab */}
            {activeTab === 'pipeline' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Pipeline Value by Stage */}
                  <div className="lg:col-span-2 card p-6">
                    <h3 className="text-lg font-normal text-text-primary mb-6">Pipeline Value by Stage</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pipelineFunnelData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#6B7280" />
                          <YAxis stroke="#6B7280" />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pipeline Health */}
                  <div className="card p-6">
                    <h3 className="text-lg font-normal text-text-primary mb-6">Pipeline Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Total Pipeline</span>
                        <span className="text-lg font-normal text-text-primary">{formatCurrency((pipelineFunnelData || []).reduce((sum, stage) => sum + (stage?.value || 0), 0))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Weighted Pipeline</span>
                        <span className="text-lg font-normal text-text-primary">{formatCurrency((pipelineFunnelData || []).reduce((sum, stage) => sum + ((stage?.value || 0) * (stage?.name === 'Leads' ? 0.1 : stage?.name === 'Qualified' ? 0.25 : stage?.name === 'Proposal' ? 0.5 : stage?.name === 'Negotiation' ? 0.75 : 1)), 0))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Best Case</span>
                        <span className="text-lg font-normal text-success">{formatCurrency((pipelineFunnelData || []).reduce((sum, stage) => sum + (stage?.value || 0), 0) * 1.1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Worst Case</span>
                        <span className="text-lg font-normal text-error">{formatCurrency((pipelineFunnelData || []).reduce((sum, stage) => sum + (stage?.value || 0), 0) * 0.8)}</span>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-text-secondary">Coverage Ratio</span>
                          <span className="text-lg font-normal text-primary">{((pipelineFunnelData || []).reduce((sum, stage) => sum + (stage?.value || 0), 0) / 2500000).toFixed(1)}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Territory Performance */}
                <div className="card p-6">
                  <h3 className="text-lg font-normal text-text-primary mb-6">Territory Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-normal text-text-secondary">Territory</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Revenue</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Deals</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Win Rate</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Avg Deal Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {territoryData?.map((territory) => (
                          <tr key={territory?.name} className="border-b border-border-light hover:bg-surface-hover">
                            <td className="py-3 px-4 text-sm font-normal text-text-primary">{territory?.name}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{formatCurrency(territory?.revenue)}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{territory?.deals}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{formatPercentage(territory?.winRate)}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{formatCurrency(territory?.avgDealSize || (territory?.revenue / territory?.deals) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-8">
                {/* Rep Performance */}
                <div className="card p-6">
                  <h3 className="text-lg font-normal text-text-primary mb-6">Sales Representative Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-normal text-text-secondary">Representative</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Revenue</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Deals</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Quota</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Attainment</th>
                          <th className="text-right py-3 px-4 text-sm font-normal text-text-secondary">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repPerformanceData?.map((rep) => (
                          <tr key={rep?.name} className="border-b border-border-light hover:bg-surface-hover">
                            <td className="py-3 px-4 text-sm font-normal text-text-primary">{rep?.name}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{formatCurrency(rep?.revenue)}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{rep?.deals}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{formatCurrency(rep?.quota)}</td>
                            <td className="py-3 px-4 text-sm text-text-primary text-right">{rep?.attainment}%</td>
                            <td className="py-3 px-4 text-right">
                              <div className="w-20 bg-border-light rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${rep?.attainment >= 100 ? 'bg-success' : rep?.attainment >= 80 ? 'bg-warning' : 'bg-primary'}`}
                                  style={{ width: `${Math.min(rep?.attainment, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="card p-6">
                    <h3 className="text-lg font-normal text-text-primary mb-6">Quota Attainment</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={repPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="name" stroke="#6B7280" angle={-45} textAnchor="end" height={80} />
                          <YAxis stroke="#6B7280" tickFormatter={(value) => `${value}%`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="attainment" fill="#3B82F6" name="Attainment %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="text-lg font-normal text-text-primary mb-6">Revenue by Rep</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={repPerformanceData}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            fill="#3B82F6"
                            dataKey="revenue"
                            label={({ name, percent }) => `${name}: ${(percent * 100)?.toFixed(0)}%`}
                          >
                            {repPerformanceData?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${220 + index * 30}, 70%, ${50 + index * 10}%)`} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Forecasting Tab */}
            {activeTab === 'forecasting' && (
              <div className="space-y-8">
                {/* Forecast Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card p-6 text-center">
                    <h3 className="text-sm font-normal text-text-secondary mb-2">Total Forecast</h3>
                    <p className="text-3xl font-normal text-primary mb-1">{formatCurrency((revenueTrendData || []).reduce((sum, month) => sum + (month?.forecast || 0), 0))}</p>
                    <p className="text-sm text-success flex items-center justify-center space-x-1">
                      <Icon name="TrendingUp" size={14} />
                      <span>Based on expected close dates</span>
                    </p>
                  </div>
                  
                  <div className="card p-6 text-center">
                    <h3 className="text-sm font-normal text-text-secondary mb-2">Total Actual Revenue</h3>
                    <p className="text-3xl font-normal text-secondary mb-1">{formatCurrency((revenueTrendData || []).reduce((sum, month) => sum + (month?.actual || 0), 0))}</p>
                    <p className="text-sm text-text-secondary">From closed won deals</p>
                  </div>
                  
                  <div className="card p-6 text-center">
                    <h3 className="text-sm font-normal text-text-secondary mb-2">Overall Win Rate</h3>
                    <p className="text-3xl font-normal text-accent mb-1">{velocityMetrics?.find(m => m.metric === 'Win Rate')?.value || '0%'}</p>
                    <p className="text-sm text-text-secondary">Of all deals</p>
                  </div>
                </div>

                {/* Forecast Chart */}
                <div className="card p-6">
                  <h3 className="text-lg font-normal text-text-primary mb-6">Revenue Forecast vs Actual</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} name="Actual Revenue" />
                        <Line type="monotone" dataKey="forecast" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                        <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} name="Target" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Click outside handler for export menu */}
      {isExportMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsExportMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default PipelineAnalytics;