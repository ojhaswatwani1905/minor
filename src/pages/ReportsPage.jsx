import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { FileText, Download, Printer, Filter } from 'lucide-react';
import { Loader } from '../components/Common/Loader';
import { toast } from 'react-toastify';

export const ReportsPage = () => {
  const [reportType, setReportType] = useState('Daily Safety Summary');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportService.getReports({ type: reportType });
      if (res.success) {
        setReport(res);
      }
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCsv = () => {
    if (!report?.reportData || report.reportData.length === 0) return;

    const headers = Object.keys(report.reportData[0]).join(',');
    const rows = report.reportData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stsms-report-${reportType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Data file exported successfully!');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Reports & Data Export Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate printable safety summary reports and export CSV telemetry data
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Data</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[#25433E] border border-white/10 shadow-xl text-white">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-honey" />
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-[#1E3732] border border-white/15 text-xs font-bold text-white focus:ring-2 focus:ring-honey/50 cursor-pointer"
          >
            <option value="Daily Safety Summary" className="bg-[#1E3732] text-white">Daily Safety Summary Report</option>
            <option value="Emergency" className="bg-[#1E3732] text-white">Monthly Emergency Incident Report</option>
            <option value="Trips" className="bg-[#1E3732] text-white">Expedition Route Safety Report</option>
          </select>
        </div>

        <div className="text-xs font-mono text-white/70">
          Generated At: <strong className="text-white">{new Date().toLocaleString()}</strong>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {report?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(report.summary).map(([key, val]) => (
            <div key={key} className="p-4 rounded-3xl bg-[#25433E] border border-white/10 shadow-md">
              <p className="text-[10px] text-white/70 uppercase font-black tracking-wider">
                {key.replace(/([A-Z])/g, ' $1')}
              </p>
              <h3 className="text-2xl font-black text-white mt-1">{val}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Report Data Preview Table */}
      {loading ? (
        <Loader message="Compiling Safety Report Data..." />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#25433E] text-white shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-honey" />
              {reportType} Preview
            </h3>
            <span className="text-xs font-mono text-white/70">
              {report?.reportData?.length || 0} Total Records
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider">
                {report?.reportData?.[0] && Object.keys(report.reportData[0]).map((key) => (
                  <th key={key} className="p-3 capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {report?.reportData?.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="p-3 text-slate-200">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
