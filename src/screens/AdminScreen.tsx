import { useState } from 'react'
import type { Service } from '../App'

const reports = [
  { id: 'D2026-001', title: 'Buraco na Rua das Pedras', category: 'Buraco', status: 'Aberto', date: '02/08/2026', votes: 23, region: 'Centro' },
  { id: 'D2026-002', title: 'Enchente no cruzamento central', category: 'Enchente', status: 'Em análise', date: '03/08/2026', votes: 18, region: 'Centro' },
  { id: 'D2026-003', title: 'Poste apagado — Av. Principal', category: 'Iluminação', status: 'Em análise', date: '01/08/2026', votes: 14, region: 'Norte' },
  { id: 'D2026-004', title: 'Lixo no Parque do Ipê', category: 'Lixo', status: 'Resolvido', date: '28/07/2026', votes: 7, region: 'Sul' },
  { id: 'D2026-005', title: 'Calçada quebrada — escola', category: 'Calçada', status: 'Aberto', date: '04/08/2026', votes: 11, region: 'Norte' },
  { id: 'D2026-006', title: 'Área perigosa — beco do Ipê', category: 'Segurança', status: 'Aberto', date: '03/08/2026', votes: 15, region: 'Sul' },
]

const statusStyle: Record<string, { border: string; color: string }> = {
  'Aberto': { border: '#dc2626', color: '#dc2626' },
  'Em análise': { border: '#eab308', color: '#d97706' },
  'Resolvido': { border: '#3a9e72', color: '#3a9e72' },
}

const nextStatus: Record<string, string> = {
  'Aberto': 'Em análise',
  'Em análise': 'Resolvido',
  'Resolvido': 'Aberto',
}

const TYPE_OPTIONS = ['Saúde', 'Segurança', 'Educação', 'Social', 'Serviços']

const ICON_OPTIONS = [
  { icon: '🏥', label: 'Hospital/UBS' },
  { icon: '👮', label: 'Delegacia' },
  { icon: '🏫', label: 'Escola' },
  { icon: '🤝', label: 'Social' },
  { icon: '🚑', label: 'SAMU' },
  { icon: '📮', label: 'Correios' },
  { icon: '🏛️', label: 'Prefeitura' },
  { icon: '🚒', label: 'Bombeiros' },
  { icon: '🌳', label: 'Parque' },
  { icon: '⛪', label: 'Igreja' },
]

const COLOR_OPTIONS = [
  { color: '#dc2626', label: 'Vermelho' },
  { color: '#1d4ed8', label: 'Azul' },
  { color: '#f97316', label: 'Laranja' },
  { color: '#7c3aed', label: 'Roxo' },
  { color: '#3a9e72', label: 'Verde' },
  { color: '#eab308', label: 'Amarelo' },
]

const emptyForm = { name: '', type: 'Saúde', address: '', phone: '', icon: '🏥', color: '#dc2626', hours: '' }

interface Props {
  onBack: () => void
  services: Service[]
  onServicesChange: (s: Service[]) => void
}

export default function AdminScreen({ onBack, services, onServicesChange }: Props) {
  const [tab, setTab] = useState<'reports' | 'services'>('reports')
  const [items, setItems] = useState(reports)
  const [filter, setFilter] = useState('Todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<number | null>(null)

  const filtered = filter === 'Todos' ? items : items.filter((r) => r.status === filter)

  const stats = {
    total: items.length,
    open: items.filter((r) => r.status === 'Aberto').length,
    analyzing: items.filter((r) => r.status === 'Em análise').length,
    resolved: items.filter((r) => r.status === 'Resolvido').length,
  }

  function openAdd() {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(s: Service) {
    setEditId(s.id)
    setForm({ name: s.name, type: s.type, address: s.address, phone: s.phone, icon: s.icon, color: s.color, hours: s.hours })
    setShowForm(true)
  }

  function saveService() {
    if (!form.name || !form.address) return
    if (editId !== null) {
      onServicesChange(services.map((s) => s.id === editId ? { ...s, ...form } : s))
    } else {
      const newId = Math.max(0, ...services.map((s) => s.id)) + 1
      onServicesChange([...services, { id: newId, ...form }])
    }
    setShowForm(false)
  }

  function removeService(id: number) {
    onServicesChange(services.filter((s) => s.id !== id))
  }

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1a2e23', padding: '16px 16px 12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 0 6px', fontFamily: 'Nunito, sans-serif' }}>
          ← Voltar
        </button>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Painel Administrativo</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '4px 0 12px' }}>Gestão de denúncias e serviços</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Total', value: stats.total, color: '#fff' },
            { label: 'Abertos', value: stats.open, color: '#f87171' },
            { label: 'Análise', value: stats.analyzing, color: '#fbbf24' },
            { label: 'Resolvidos', value: stats.resolved, color: '#4ade80' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
              <p style={{ fontWeight: 900, fontSize: 22, margin: 0, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        {([
          { id: 'reports', label: '📋 Denúncias' },
          { id: 'services', label: '🏛️ Serviços' },
        ] as { id: 'reports' | 'services'; label: string }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '12px', border: 'none',
              borderBottom: `3px solid ${tab === t.id ? '#1a2e23' : 'transparent'}`,
              background: 'none', color: tab === t.id ? '#1a2e23' : '#9ca3af',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports tab */}
      {tab === 'reports' && (
        <div style={{ padding: '14px' }}>
          {/* Map */}
          <p style={{ fontWeight: 700, fontSize: 13, color: '#3a9e72', margin: '0 0 8px' }}>Regiões críticas no mapa</p>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid #e5e7eb', marginBottom: 14 }}>
            <iframe
              title="Mapa admin"
              width="100%"
              height="150"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14628.7!2d-46.7500!3d-23.6700!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce51f7ab000001%3A0x9d2e0d73c5b00001!2sJardim+S%C3%A3o+Bento%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
            />
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
            {['Todos', 'Aberto', 'Em análise', 'Resolvido'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flexShrink: 0, padding: '5px 14px', borderRadius: 20,
                  border: `2px solid ${filter === f ? '#1a2e23' : '#e5e7eb'}`,
                  backgroundColor: filter === f ? '#1a2e23' : '#fff',
                  color: filter === f ? '#fff' : '#6b7280',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((r) => {
              const ss = statusStyle[r.status]
              return (
                <div key={r.id} style={{ border: `2px solid ${ss.border}`, borderRadius: 12, padding: '12px 14px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', margin: '0 0 2px', fontFamily: 'Outfit, sans-serif' }}>{r.id}</p>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111' }}>{r.title}</p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{r.category}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>📍 {r.region}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{r.date}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>👍 {r.votes}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: ss.color, border: `1.5px solid ${ss.border}`, borderRadius: 10, padding: '3px 8px', flexShrink: 0 }}>
                      {r.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setItems((prev) => prev.map((x) => x.id === r.id ? { ...x, status: nextStatus[x.status] } : x))}
                    style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '8px', backgroundColor: '#fff', fontWeight: 700, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                  >
                    Avançar status: {nextStatus[r.status]} →
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Services tab */}
      {tab === 'services' && (
        <div style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>{services.length} local(is) cadastrado(s)</p>
            <button
              onClick={openAdd}
              style={{ backgroundColor: '#3a9e72', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
            >
              + Adicionar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {services.map((s) => (
              <div key={s.id} style={{ border: '2px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{s.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111' }}>{s.name}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: s.color, backgroundColor: s.color + '15', borderRadius: 10, padding: '2px 8px', flexShrink: 0 }}>{s.type}</span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280' }}>📍 {s.address}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>📞 {s.phone}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => openEdit(s)}
                    style={{ flex: 1, border: '2px solid #e5e7eb', borderRadius: 10, padding: '7px', backgroundColor: '#fff', fontWeight: 700, fontSize: 12, color: '#374151', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => removeService(s.id)}
                    style={{ flex: 1, border: '2px solid #fee2e2', borderRadius: 10, padding: '7px', backgroundColor: '#fff', fontWeight: 700, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                  >
                    🗑️ Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ backgroundColor: '#1a2e23', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                {editId !== null ? 'Editar serviço' : 'Novo serviço'}
              </p>
              <button onClick={() => setShowForm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Icon picker */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>ÍCONE</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ICON_OPTIONS.map((o) => (
                    <button
                      key={o.icon}
                      onClick={() => setForm((f) => ({ ...f, icon: o.icon }))}
                      style={{
                        width: 44, height: 44, borderRadius: 10, border: `2px solid ${form.icon === o.icon ? '#3a9e72' : '#e5e7eb'}`,
                        backgroundColor: form.icon === o.icon ? '#f0faf5' : '#fff',
                        fontSize: 22, cursor: 'pointer',
                      }}
                    >
                      {o.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>COR</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLOR_OPTIONS.map((o) => (
                    <button
                      key={o.color}
                      onClick={() => setForm((f) => ({ ...f, color: o.color }))}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', backgroundColor: o.color,
                        border: `3px solid ${form.color === o.color ? '#111' : 'transparent'}`,
                        cursor: 'pointer', outline: 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>NOME DO LOCAL *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: UBS Jardim São Bento"
                  style={{ width: '100%', border: `2px solid ${form.name ? '#3a9e72' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
                />
              </div>

              {/* Type */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>CATEGORIA</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      style={{
                        padding: '5px 14px', borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                        border: `2px solid ${form.type === t ? '#3a9e72' : '#e5e7eb'}`,
                        backgroundColor: form.type === t ? '#3a9e72' : '#fff',
                        color: form.type === t ? '#fff' : '#6b7280',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>ENDEREÇO *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Ex: Rua das Flores, 210"
                  style={{ width: '100%', border: `2px solid ${form.address ? '#3a9e72' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>TELEFONE</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Ex: (11) 9999-9999"
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
                />
              </div>

              {/* Hours */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>HORÁRIO DE FUNCIONAMENTO</label>
                <input
                  type="text"
                  value={form.hours}
                  onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
                  placeholder="Ex: Seg–Sex: 8h–17h"
                  style={{ width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
                />
              </div>

              <button
                onClick={saveService}
                disabled={!form.name || !form.address}
                style={{
                  width: '100%',
                  backgroundColor: form.name && form.address ? '#3a9e72' : '#d1d5db',
                  color: '#fff', border: 'none', borderRadius: 12, padding: '13px',
                  fontWeight: 700, fontSize: 14,
                  cursor: form.name && form.address ? 'pointer' : 'not-allowed',
                  fontFamily: 'Nunito, sans-serif',
                  marginBottom: 8,
                }}
              >
                {editId !== null ? 'Salvar alterações' : 'Adicionar serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
