import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Controller, Part, MaintenanceLog } from '../types';
import { CONTROLLER_TYPE_LABELS } from '../types';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function MaintenancePage() {
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    controller_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    parts_used: [] as { part_id: number; qty: number; cost: number }[],
    labor_cost: '',
    technician: 'Isaac',
  });

  const fetchData = async () => {
    const [c, p, m] = await Promise.all([
      api.getControllers(),
      api.getParts(),
      api.getMaintenanceLogs(),
    ]);
    setControllers(c);
    setParts(p);
    setLogs(m);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addPart = () => {
    setForm({ ...form, parts_used: [...form.parts_used, { part_id: 0, qty: 1, cost: 0 }] });
  };

  const updatePart = (idx: number, field: string, value: any) => {
    const updated = [...form.parts_used];
    (updated[idx] as any)[field] = field === 'qty' || field === 'cost' || field === 'part_id' ? Number(value) : value;
    if (field === 'part_id') {
      const part = parts.find(p => p.id === Number(value));
      if (part) updated[idx].cost = part.unit_cost;
    }
    setForm({ ...form, parts_used: updated });
  };

  const removePart = (idx: number) => {
    setForm({ ...form, parts_used: form.parts_used.filter((_, i) => i !== idx) });
  };

  const partsCost = form.parts_used.reduce((s, p) => s + p.cost * p.qty, 0);
  const laborCost = parseFloat(form.labor_cost) || 0;
  const totalCost = partsCost + laborCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.controller_id || !form.description.trim()) {
      alert('Preencha o controle e a descrição.');
      return;
    }
    await api.createMaintenanceLog({
      controller_id: Number(form.controller_id),
      date: form.date,
      description: form.description,
      parts_used: form.parts_used,
      labor_cost: laborCost,
      technician: form.technician,
    });
    setForm({
      controller_id: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      parts_used: [],
      labor_cost: '',
      technician: 'Isaac',
    });
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta manutenção?')) return;
    await api.deleteMaintenanceLog(id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manutenções</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{logs.length} manutençõe{logs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? 'Cancelar' : 'Nova Manutenção'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Controle *</label>
              <select className="input" value={form.controller_id} onChange={e => setForm({ ...form, controller_id: e.target.value })}>
                <option value="">Selecione o controle...</option>
                {controllers.filter(c => c.status !== 'SOLD' && c.status !== 'SCRAP').map(c => (
                  <option key={c.id} value={c.id}>{c.serial_or_label} ({CONTROLLER_TYPE_LABELS[c.type]})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrição *</label>
              <textarea className="input" rows={2} placeholder="Ex: Troca de analógico esquerdo por Hall Effect" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {/* Parts Used */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Peças Utilizadas</label>
              <button type="button" onClick={addPart} className="text-sm text-brand-600 dark:text-brand-400 hover:underline">+ Adicionar peça</button>
            </div>
            {form.parts_used.length > 0 && (
              <div className="space-y-2">
                {form.parts_used.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select className="input flex-1" value={p.part_id} onChange={e => updatePart(idx, 'part_id', e.target.value)}>
                      <option value={0}>Selecione...</option>
                      {parts.map(pt => (
                        <option key={pt.id} value={pt.id}>{pt.name} (R$ {pt.unit_cost.toFixed(2)} - {pt.quantity} disp.)</option>
                      ))}
                    </select>
                    <input type="number" min="1" className="input w-20" value={p.qty} onChange={e => updatePart(idx, 'qty', e.target.value)} />
                    <input type="number" step="0.01" className="input w-28" value={p.cost} onChange={e => updatePart(idx, 'cost', e.target.value)} />
                    <button type="button" onClick={() => removePart(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Mão de Obra (R$)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={form.labor_cost} onChange={e => setForm({ ...form, labor_cost: e.target.value })} />
            </div>
            <div>
              <label className="label">Técnico</label>
              <input type="text" className="input" value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} />
            </div>
            <div className="flex items-end">
              <div className="w-full p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Total</p>
                <p className="text-xl font-bold text-brand-700 dark:text-brand-300">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Registrar Manutenção</button>
          </div>
        </form>
      )}

      {/* Logs List */}
      <div className="space-y-3">
        {logs.map((m) => (
          <div key={m.id} className="card p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium text-gray-900 dark:text-white">{m.serial_or_label}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">por {m.technician}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{m.description}</p>
              {m.parts_used && m.parts_used !== '[]' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Peças: {JSON.parse(m.parts_used).length} item(ns) | Mão de obra: {formatCurrency(m.labor_cost)}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(m.total_cost)}</p>
              <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 hover:underline mt-1">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
