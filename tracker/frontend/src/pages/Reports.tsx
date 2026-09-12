import { useState } from 'react';
import { api } from '../api';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const transactions = await api.getTransactions();
      const filtered = transactions.filter(t => {
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;
        return true;
      });

      const purchases = filtered.filter(t => t.type === 'PURCHASE');
      const sales = filtered.filter(t => t.type === 'SALE');
      const totalPurchased = purchases.reduce((s, t) => s + t.value, 0);
      const totalSold = sales.reduce((s, t) => s + t.value, 0);

      setReport({
        totalPurchased,
        totalSold,
        profit: totalSold - totalPurchased,
        purchasesCount: purchases.length,
        salesCount: sales.length,
        transactions: filtered,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report) return;
    const headers = ['Data', 'Tipo', 'Controle', 'Valor', 'Info', 'Notas'];
    const rows = report.transactions.map((t: any) => [
      t.date,
      t.type === 'SALE' ? 'Venda' : 'Compra',
      t.serial_or_label,
      t.value.toFixed(2),
      t.buyer_seller_info,
      t.notes,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joyfix-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Gere relatórios de vendas e compras</p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtrar por Período</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="label">Data Início</label>
            <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="label">Data Fim</label>
            <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button onClick={generateReport} disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Comprado</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(report.totalPurchased)}</p>
              <p className="text-xs text-gray-400 mt-1">{report.purchasesCount} compra(s)</p>
            </div>
            <div className="stat-card">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Vendido</span>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(report.totalSold)}</p>
              <p className="text-xs text-gray-400 mt-1">{report.salesCount} venda(s)</p>
            </div>
            <div className="stat-card">
              <span className="text-sm text-gray-500 dark:text-gray-400">Lucro</span>
              <p className={`text-2xl font-bold mt-1 ${report.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(report.profit)}
              </p>
            </div>
            <div className="flex items-center">
              <button onClick={exportCSV} className="btn-secondary w-full flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar CSV
              </button>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Controle</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {report.transactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${t.type === 'SALE' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                          {t.type === 'SALE' ? 'Venda' : 'Compra'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{t.serial_or_label}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(t.value)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t.buyer_seller_info}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
