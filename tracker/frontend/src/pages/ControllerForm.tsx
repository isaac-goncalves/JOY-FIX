import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { CONTROLLER_TYPE_LABELS, type ControllerType, type ControllerStatus } from '../types';

export default function ControllerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    serial_or_label: '',
    type: '' as ControllerType | '',
    color: '',
    status: 'STOCK' as ControllerStatus,
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    seller_info: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      api.getController(Number(id)).then(c => {
        setForm({
          serial_or_label: c.serial_or_label,
          type: c.type,
          color: c.color,
          status: c.status,
          purchase_price: String(c.purchase_price),
          purchase_date: c.purchase_date,
          seller_info: c.seller_info,
          notes: c.notes,
        });
      });
    }
  }, [id, isEdit]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.serial_or_label.trim()) e.serial_or_label = 'Obrigatório';
    if (!form.type) e.type = 'Obrigatório';
    if (form.purchase_price && isNaN(parseFloat(form.purchase_price))) e.purchase_price = 'Número inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      ...form,
      purchase_price: parseFloat(form.purchase_price) || 0,
      type: form.type as ControllerType,
    };

    if (isEdit && id) {
      await api.updateController(Number(id), data);
      navigate(`/controllers/${id}`);
    } else {
      const created = await api.createController(data);
      navigate(`/controllers/${created.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={isEdit && id ? `/controllers/${id}` : '/controllers'} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Editar Controle' : 'Novo Controle'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Label / Serial *</label>
            <input type="text" className="input" placeholder="Ex: Joy-Con L Azul #001" value={form.serial_or_label} onChange={e => setForm({ ...form, serial_or_label: e.target.value })} />
            {errors.serial_or_label && <p className="text-red-500 text-xs mt-1">{errors.serial_or_label}</p>}
          </div>
          <div>
            <label className="label">Tipo *</label>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ControllerType })}>
              <option value="">Selecione...</option>
              {Object.entries(CONTROLLER_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>
          <div>
            <label className="label">Cor</label>
            <input type="text" className="input" placeholder="Ex: Azul" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ControllerStatus })}>
              <option value="STOCK">Em Estoque</option>
              <option value="MAINTENANCE">Em Manutenção</option>
              <option value="READY">Pronto</option>
              <option value="SOLD">Vendido</option>
              <option value="SCRAP">Descartado</option>
            </select>
          </div>
          <div>
            <label className="label">Preço de Compra (R$)</label>
            <input type="number" step="0.01" className="input" placeholder="0.00" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
            {errors.purchase_price && <p className="text-red-500 text-xs mt-1">{errors.purchase_price}</p>}
          </div>
          <div>
            <label className="label">Data de Compra</label>
            <input type="date" className="input" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Vendedor</label>
            <input type="text" className="input" placeholder="Ex: Mercado Livre" value={form.seller_info} onChange={e => setForm({ ...form, seller_info: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notas</label>
            <textarea className="input" rows={3} placeholder="Observações sobre o controle..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link to={isEdit && id ? `/controllers/${id}` : '/controllers'} className="btn-secondary">Cancelar</Link>
          <button type="submit" className="btn-primary">{isEdit ? 'Salvar' : 'Criar Controle'}</button>
        </div>
      </form>
    </div>
  );
}
