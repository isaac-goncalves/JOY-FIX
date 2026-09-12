import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { ControllerDetail as ControllerDetailType } from '../types';
import { CONTROLLER_TYPE_LABELS, STATUS_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ControllerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [controller, setController] = useState<ControllerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saleModal, setSaleModal] = useState(false);
  const [saleData, setSaleData] = useState({ value: '', buyer_seller_info: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchController = () => {
    if (!id) return;
    api.getController(Number(id)).then(setController).finally(() => setLoading(false));
  };

  useEffect(() => { fetchController(); }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await api.updateController(Number(id), { status } as any);
    fetchController();
  };

  const handleSale = async () => {
    if (!id || !saleData.value) return;
    await api.createTransaction({
      controller_id: Number(id),
      type: 'SALE',
      value: parseFloat(saleData.value),
      buyer_seller_info: saleData.buyer_seller_info,
      date: saleData.date,
      notes: saleData.notes,
    });
    setSaleModal(false);
    setSaleData({ value: '', buyer_seller_info: '', date: new Date().toISOString().split('T')[0], notes: '' });
    fetchController();
  };

  const handleDelete = async () => {
    if (!id || !confirm('Tem certeza?')) return;
    await api.deleteController(Number(id));
    navigate('/controllers');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!controller) {
    return <div className="text-center py-16 text-gray-500">Controle não encontrado.</div>;
  }

  const totalCost = controller.purchase_price + controller.total_maintenance_cost;
  const sale = controller.transactions.find(t => t.type === 'SALE');
  const profit = sale ? sale.value - totalCost : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/controllers" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{controller.serial_or_label}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={controller.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">{CONTROLLER_TYPE_LABELS[controller.type]}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{controller.color}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/controllers/${id}/edit`} className="btn-secondary">Editar</Link>
          <button onClick={handleDelete} className="btn-danger">Excluir</button>
        </div>
      </div>

      {/* Status Actions */}
      <div className="card p-4">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Alterar Status</h2>
        <div className="flex flex-wrap gap-2">
          {(['STOCK', 'MAINTENANCE', 'READY', 'SCRAP'] as const).map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={controller.status === s}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                controller.status === s
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
          {controller.status !== 'SOLD' && (
            <button onClick={() => setSaleModal(true)} className="btn-success text-sm">
              Registrar Venda
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informações</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Data de Compra</span>
              <span className="text-gray-900 dark:text-white">{new Date(controller.purchase_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Preço de Compra</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(controller.purchase_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Vendedor</span>
              <span className="text-gray-900 dark:text-white">{controller.seller_info || '-'}</span>
            </div>
            {controller.notes && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Notas</span>
                <p className="mt-1 text-gray-900 dark:text-white">{controller.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Costs */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Custos</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Compra</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(controller.purchase_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Manutenções</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(controller.total_maintenance_cost)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-semibold">
              <span className="text-gray-700 dark:text-gray-300">Custo Total</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(totalCost)}</span>
            </div>
            {sale && (
              <>
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Venda</span>
                  <span>{formatCurrency(sale.value)}</span>
                </div>
                <div className={`flex justify-between font-bold text-lg ${profit !== null && profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <span>Lucro</span>
                  <span>{formatCurrency(profit || 0)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumo</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{controller.maintenance.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manutenções</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{controller.transactions.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Transações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Histórico de Manutenções</h2>
          <Link to="/maintenance" className="btn-primary text-sm">Nova Manutenção</Link>
        </div>
        {controller.maintenance.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma manutenção registrada.</p>
        ) : (
          <div className="space-y-3">
            {controller.maintenance.map((m) => (
              <div key={m.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(m.total_cost)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{m.description}</p>
                {m.parts_used && m.parts_used !== '[]' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Peças: {JSON.parse(m.parts_used).length} item(ns)
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Mão de obra: {formatCurrency(m.labor_cost)}</span>
                  <span>Técnico: {m.technician}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transações</h2>
        {controller.transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma transação registrada.</p>
        ) : (
          <div className="space-y-2">
            {controller.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className={`text-sm font-medium ${t.type === 'SALE' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {t.type === 'SALE' ? 'Venda' : 'Compra'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <span className={`font-semibold ${t.type === 'SALE' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                  {t.type === 'SALE' ? '+' : '-'} {formatCurrency(t.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sale Modal */}
      <Modal open={saleModal} onClose={() => setSaleModal(false)} title="Registrar Venda">
        <div className="space-y-4">
          <div>
            <label className="label">Valor da Venda (R$)</label>
            <input type="number" step="0.01" className="input" value={saleData.value} onChange={e => setSaleData({ ...saleData, value: e.target.value })} />
          </div>
          <div>
            <label className="label">Comprador</label>
            <input type="text" className="input" value={saleData.buyer_seller_info} onChange={e => setSaleData({ ...saleData, buyer_seller_info: e.target.value })} />
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={saleData.date} onChange={e => setSaleData({ ...saleData, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={saleData.notes} onChange={e => setSaleData({ ...saleData, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setSaleModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSale} className="btn-success">Confirmar Venda</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
