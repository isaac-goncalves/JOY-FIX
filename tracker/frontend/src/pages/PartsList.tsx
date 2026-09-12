import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Part, PartType } from '../types';
import { PART_TYPE_LABELS } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PartsList() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: '' as PartType | '',
    quantity: '',
    unit_cost: '',
    supplier: '',
    low_stock_threshold: '3',
  });

  const fetchParts = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterType) params.type = filterType;
    api.getParts(params).then(setParts).finally(() => setLoading(false));
  };

  useEffect(() => { fetchParts(); }, [search, filterType]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: '', quantity: '', unit_cost: '', supplier: '', low_stock_threshold: '3' });
    setModalOpen(true);
  };

  const openEdit = (p: Part) => {
    setEditing(p);
    setForm({
      name: p.name,
      type: p.type,
      quantity: String(p.quantity),
      unit_cost: String(p.unit_cost),
      supplier: p.supplier,
      low_stock_threshold: String(p.low_stock_threshold),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      type: form.type as PartType,
      quantity: parseInt(form.quantity) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
      supplier: form.supplier,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 3,
    };

    if (editing) {
      await api.updatePart(editing.id, data);
    } else {
      await api.createPart(data);
    }
    setModalOpen(false);
    fetchParts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta peça?')) return;
    await api.deletePart(id);
    fetchParts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Peças</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{parts.length} peça{parts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Peça
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Buscar peça..." value={search} onChange={e => setSearch(e.target.value)} className="input flex-1" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input w-full sm:w-48">
            <option value="">Todos os tipos</option>
            {Object.entries(PART_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : parts.length === 0 ? (
        <EmptyState
          title="Nenhuma peça encontrada"
          description="Adicione peças para controlar seu estoque."
          action={<button onClick={openCreate} className="btn-primary">Adicionar Peça</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qtd</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Custo Unit.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fornecedor</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {parts.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${p.quantity <= p.low_stock_threshold ? 'bg-yellow-50/50 dark:bg-yellow-900/5' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{PART_TYPE_LABELS[p.type]}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={p.quantity <= p.low_stock_threshold ? 'text-yellow-600 dark:text-yellow-400 font-bold' : 'text-gray-900 dark:text-white'}>
                        {p.quantity}
                      </span>
                      {p.quantity <= p.low_stock_threshold && (
                        <span className="ml-1 text-xs text-yellow-500">⚠</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(p.unit_cost)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.supplier}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Peça' : 'Nova Peça'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Tipo *</label>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
              <option value="">Selecione...</option>
              {Object.entries(PART_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantidade</label>
              <input type="number" min="0" className="input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label className="label">Custo Unitário (R$)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Fornecedor</label>
            <input type="text" className="input" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div>
            <label className="label">Limite de Estoque Baixo</label>
            <input type="number" min="0" className="input" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
