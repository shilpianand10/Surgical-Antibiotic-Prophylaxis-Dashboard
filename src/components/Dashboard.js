import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Building2, Activity, CheckCircle, XCircle, Clock, Pill, RefreshCw, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  const fetchDataFromSheet = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      console.log('Fetched data length:', data.length); // Debug log
      return data;
    } catch (error) {
      console.error('Error fetching data from API:', error);
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const sheetData = await fetchDataFromSheet();
      setData(sheetData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    const fullYear = year < 100 ? (year >= 24 ? 2000 + year : 2000 + year) : year;
    
    return new Date(fullYear, month - 1, day);
  };

  const formatMonthYear = (dateStr) => {
    const date = parseDate(dateStr);
    if (!date) return null;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()] + ' ' + date.getFullYear();
  };

  const months = useMemo(() => {
    const monthSet = new Set();

    // Generate all months from October 2023 to September 2025
    const startDate = new Date(2023, 9, 1); // October 2023
    const endDate = new Date(2025, 8, 1); // September 2025
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      const year = d.getFullYear().toString().slice(-2);
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `01.${month}.${year}`;
      const monthYear = formatMonthYear(dateStr);
      if (monthYear) {
        monthSet.add(monthYear);
      }
    }

    // Add months from actual data (in case new months are added beyond the range)
    data.forEach(item => {
      const monthYear = formatMonthYear(item.date);
      if (monthYear) {
        monthSet.add(monthYear);
      }
    });

    const sortedMonths = Array.from(monthSet).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    return ['All', ...sortedMonths];
  }, [data]);

  const departments = useMemo(() => {
    const deptSet = new Set();
    data.forEach(item => {
      if (item.department) {
        deptSet.add(item.department);
      }
    });
    return ['All', ...Array.from(deptSet).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemMonth = formatMonthYear(item.date);
      if (!itemMonth) return false;
      
      const monthMatch = selectedMonth === 'All' || itemMonth === selectedMonth;
      const deptMatch = selectedDepartment === 'All' || item.department === selectedDepartment;
      
      return monthMatch && deptMatch;
    });
  }, [data, selectedMonth, selectedDepartment]);

  const metrics = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) return { total: 0, rightDose: 0, rightAntibiotic: 0, stopped24hrs: 0, given60mins: 0, noDischargeProphylaxis: 0, overallCompliance: 0 };

    let rightDoseCount = 0;
    let rightAntibioticCount = 0;
    let stopped24hrsCount = 0;
    let given60minsCount = 0;
    let noDischargeProphylaxisCount = 0;
    let fullyCompliantCount = 0;

    filteredData.forEach(item => {
      const hasRightDose = item.rightDose && (item.rightDose.toUpperCase() === 'Y' || item.rightDose.toUpperCase() === 'YES');
      const hasRightAntibiotic = item.rightAntibiotic && (item.rightAntibiotic.toUpperCase() === 'Y' || item.rightAntibiotic.toUpperCase() === 'YES' || item.rightAntibiotic.toUpperCase() === 'JUSTIFIED');
      const hasStopped24hrs = item.stoppedWithin24hrs && (item.stoppedWithin24hrs.toUpperCase() === 'YES' || item.stoppedWithin24hrs.toUpperCase() === 'Y');
      const hasGiven60mins = item.givenWithin60mins && (item.givenWithin60mins.toUpperCase() === 'YES' || item.givenWithin60mins.toUpperCase() === 'Y');
      const hasNoDischargeProphylaxis = item.noDischargeProphylaxis && (item.noDischargeProphylaxis.toUpperCase() === 'Y' || item.noDischargeProphylaxis.toUpperCase() === 'YES');

      if (hasRightDose) rightDoseCount++;
      if (hasRightAntibiotic) rightAntibioticCount++;
      if (hasStopped24hrs) stopped24hrsCount++;
      if (hasGiven60mins) given60minsCount++;
      if (hasNoDischargeProphylaxis) noDischargeProphylaxisCount++;
      if (hasRightDose && hasRightAntibiotic && hasStopped24hrs && hasGiven60mins && hasNoDischargeProphylaxis) fullyCompliantCount++;
    });

    return {
      total: total,
      rightDose: ((rightDoseCount / total) * 100).toFixed(1),
      rightAntibiotic: ((rightAntibioticCount / total) * 100).toFixed(1),
      stopped24hrs: ((stopped24hrsCount / total) * 100).toFixed(1),
      given60mins: ((given60minsCount / total) * 100).toFixed(1),
      noDischargeProphylaxis: ((noDischargeProphylaxisCount / total) * 100).toFixed(1),
      overallCompliance: ((fullyCompliantCount / total) * 100).toFixed(1)
    };
  }, [filteredData]);

  const departmentSurgeryCount = useMemo(() => {
    const deptCountByMonth = {};
    
    data.forEach(item => {
      const monthYear = formatMonthYear(item.date);
      if (!monthYear || !item.department) return;
      
      if (!deptCountByMonth[monthYear]) {
        deptCountByMonth[monthYear] = {};
      }
      if (!deptCountByMonth[monthYear][item.department]) {
        deptCountByMonth[monthYear][item.department] = 0;
      }
      deptCountByMonth[monthYear][item.department]++;
    });

    const allDepts = Array.from(new Set(data.map(d => d.department).filter(Boolean)));
    
    return Object.keys(deptCountByMonth).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    }).map(month => {
      const monthData = { month: month };
      allDepts.forEach(dept => {
        monthData[dept] = deptCountByMonth[month][dept] || 0;
      });
      return monthData;
    });
  }, [data]);

  const departmentPieData = useMemo(() => {
  const deptMap = {};

  filteredData.forEach(item => {
  if (!item.department) return;

  if (!deptMap[item.department]) {
  deptMap[item.department] = {
  total: 0,
  rightDose: 0,
  rightAntibiotic: 0,
  stopped24hrs: 0,
  given60mins: 0,
    noDischargeProphylaxis: 0
    };
  }

  deptMap[item.department].total++;

  const hasRightDose = item.rightDose && (item.rightDose.toUpperCase() === 'Y' || item.rightDose.toUpperCase() === 'YES');
  const hasRightAntibiotic = item.rightAntibiotic && (item.rightAntibiotic.toUpperCase() === 'Y' || item.rightAntibiotic.toUpperCase() === 'YES' || item.rightAntibiotic.toUpperCase() === 'JUSTIFIED');
  const hasStopped24hrs = item.stoppedWithin24hrs && (item.stoppedWithin24hrs.toUpperCase() === 'YES' || item.stoppedWithin24hrs.toUpperCase() === 'Y');
      const hasGiven60mins = item.givenWithin60mins && (item.givenWithin60mins.toUpperCase() === 'YES' || item.givenWithin60mins.toUpperCase() === 'Y');
  const hasNoDischargeProphylaxis = item.noDischargeProphylaxis && (item.noDischargeProphylaxis.toUpperCase() === 'Y' || item.noDischargeProphylaxis.toUpperCase() === 'YES');

  if (hasRightDose) deptMap[item.department].rightDose++;
  if (hasRightAntibiotic) deptMap[item.department].rightAntibiotic++;
    if (hasStopped24hrs) deptMap[item.department].stopped24hrs++;
      if (hasGiven60mins) deptMap[item.department].given60mins++;
    if (hasNoDischargeProphylaxis) deptMap[item.department].noDischargeProphylaxis++;
  });

  const rightDosePie = Object.keys(deptMap).map(dept => ({
      name: dept,
    value: parseFloat(((deptMap[dept].rightDose / deptMap[dept].total) * 100).toFixed(1))
  }));

  const rightAntibioticPie = Object.keys(deptMap).map(dept => ({
      name: dept,
    value: parseFloat(((deptMap[dept].rightAntibiotic / deptMap[dept].total) * 100).toFixed(1))
  }));

  const stopped24hrsPie = Object.keys(deptMap).map(dept => ({
      name: dept,
    value: parseFloat(((deptMap[dept].stopped24hrs / deptMap[dept].total) * 100).toFixed(1))
  }));

  const given60minsPie = Object.keys(deptMap).map(dept => ({
      name: dept,
    value: parseFloat(((deptMap[dept].given60mins / deptMap[dept].total) * 100).toFixed(1))
  }));

  const noDischargeProphylaxisPie = Object.keys(deptMap).map(dept => ({
  name: dept,
    value: parseFloat(((deptMap[dept].noDischargeProphylaxis / deptMap[dept].total) * 100).toFixed(1))
    }));

    return {
      rightDose: rightDosePie,
      rightAntibiotic: rightAntibioticPie,
      stopped24hrs: stopped24hrsPie,
      given60mins: given60minsPie,
      noDischargeProphylaxis: noDischargeProphylaxisPie
    };
  }, [filteredData]);

  const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold mt-2" style={{ color: color }}>{value}%</p>
          {subtitle && <p className="text-gray-600 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="bg-gray-100 p-3 rounded-full">
          <Icon size={28} style={{ color: color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600 text-lg">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Surgical Antibiotic Prophylaxis Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Quality Monitoring and Compliance Tracking System
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <Clock size={14} />
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month === 'All' ? 'All Months' : month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                Select Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Surgeries</p>
        <p className="text-4xl font-bold mt-2 text-blue-600">{metrics.total}</p>
        <p className="text-gray-600 text-sm mt-1">Procedures</p>
        </div>
        <div className="bg-blue-100 p-3 rounded-full">
        <Activity size={28} className="text-blue-600" />
        </div>
        </div>
        </div>

        <MetricCard
        title="Overall Compliance"
        value={metrics.overallCompliance}
        subtitle="All criteria met"
        icon={TrendingUp}
        color="#059669"
        />

        <MetricCard
        title="Right Dose"
        value={metrics.rightDose}
        subtitle="Correct dosage"
        icon={Pill}
        color="#10b981"
        />

        <MetricCard
        title="Right Antibiotic"
        value={metrics.rightAntibiotic}
        subtitle="Per policy"
        icon={CheckCircle}
        color="#8b5cf6"
        />

        <MetricCard
        title="Stopped ≤24hrs"
        value={metrics.stopped24hrs}
        subtitle="Within 24 hours"
        icon={Clock}
        color="#f59e0b"
        />

        <MetricCard
        title="Given ≤60mins"
        value={metrics.given60mins}
        subtitle="Before incision"
        icon={CheckCircle}
        color="#06b6d4"
        />

          <MetricCard
            title="No Discharge Prophylaxis"
            value={metrics.noDischargeProphylaxis}
            subtitle="No post-op antibiotics"
            icon={XCircle}
            color="#ef4444"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />
            Department-wise Surgery Volume (Monthly Trend)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={departmentSurgeryCount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              {departments.filter(d => d !== 'All').slice(0, 8).map((dept, idx) => (
                <Line 
                  key={dept} 
                  type="monotone" 
                  dataKey={dept} 
                  stroke={COLORS[idx % COLORS.length]} 
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Right Dose Compliance by Department
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentPieData.rightDose}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.value.toFixed(1) + '%'}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentPieData.rightDose.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toFixed(1) + '%'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Right Antibiotic Compliance by Department
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentPieData.rightAntibiotic}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.value.toFixed(1) + '%'}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentPieData.rightAntibiotic.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toFixed(1) + '%'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Stopped Within 24hrs by Department
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentPieData.stopped24hrs}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.value.toFixed(1) + '%'}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentPieData.stopped24hrs.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toFixed(1) + '%'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Given Within 60mins by Department
            </h2>
            <ResponsiveContainer width="100%" height={300}>
            <PieChart>
            <Pie
            data={departmentPieData.given60mins}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => entry.value.toFixed(1) + '%'}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            >
            {departmentPieData.given60mins.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
            </Pie>
            <Tooltip formatter={(value) => value.toFixed(1) + '%'} />
            <Legend />
            </PieChart>
            </ResponsiveContainer>
            </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No Discharge Prophylaxis by Department
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentPieData.noDischargeProphylaxis}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.value.toFixed(1) + '%'}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentPieData.noDischargeProphylaxis.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toFixed(1) + '%'} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Surgeries (showing {Math.min(20, filteredData.length)} of {filteredData.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Surgery</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dose</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Antibiotic</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">24hrs</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">60mins</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">No Discharge</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.slice(0, 20).map((item, idx) => {
                const hasRightDose = item.rightDose && (item.rightDose.toUpperCase() === 'Y' || item.rightDose.toUpperCase() === 'YES');
                const hasRightAntibiotic = item.rightAntibiotic && (item.rightAntibiotic.toUpperCase() === 'Y' || item.rightAntibiotic.toUpperCase() === 'YES' || item.rightAntibiotic.toUpperCase() === 'JUSTIFIED');
                const hasStopped24hrs = item.stoppedWithin24hrs && (item.stoppedWithin24hrs.toUpperCase() === 'YES' || item.stoppedWithin24hrs.toUpperCase() === 'Y');
                const hasGiven60mins = item.givenWithin60mins && (item.givenWithin60mins.toUpperCase() === 'YES' || item.givenWithin60mins.toUpperCase() === 'Y');
                const hasNoDischarge = item.noDischargeProphylaxis && (item.noDischargeProphylaxis.toUpperCase() === 'Y' || item.noDischargeProphylaxis.toUpperCase() === 'YES');
                const isFullyCompliant = hasRightDose && hasRightAntibiotic && hasStopped24hrs && hasGiven60mins && hasNoDischarge;

                return (
                <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.department}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.surgery}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                {hasRightDose ? (
                  <CheckCircle className="inline text-green-500" size={20} />
                ) : (
                  <XCircle className="inline text-red-500" size={20} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                {hasRightAntibiotic ? (
                  <CheckCircle className="inline text-green-500" size={20} />
                ) : (
                  <XCircle className="inline text-red-500" size={20} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                {hasStopped24hrs ? (
                  <CheckCircle className="inline text-green-500" size={20} />
                ) : (
                  <XCircle className="inline text-red-500" size={20} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                {hasGiven60mins ? (
                  <CheckCircle className="inline text-green-500" size={20} />
                ) : (
                  <XCircle className="inline text-red-500" size={20} />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                {hasNoDischarge ? (
                  <CheckCircle className="inline text-green-500" size={20} />
                  ) : (
                      <XCircle className="inline text-red-500" size={20} />
                      )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={'px-2 py-1 rounded text-xs font-semibold ' + (isFullyCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                          {isFullyCompliant ? 'Compliant' : 'Non-Compliant'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Dashboard Features
          </h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
            <li>Monthly filter now shows all months from May 2024 onwards</li>
            <li>Line graph displays department-wise surgery volume trends</li>
            <li>Four pie charts show compliance metrics by department</li>
            <li>Real-time data updates with refresh button</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
