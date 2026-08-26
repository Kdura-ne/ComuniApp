import { useState } from 'react'

const CATEGORIES = ['Todos', 'Buraco', 'Iluminação', 'Lixo', 'Enchente', 'Segurança']

const pins = [
  { id: 1, label: 'Buraco na Rua das Pedras', category: 'Buraco', status: 'Aberto', icon: '🚧', color: '#dc2626' },
  { id: 2, label: 'Lixo acumulado — Rua do Ipê', category: 'Lixo', status: 'Aberto', icon: '🗑️', color: '#eab308' },
  { id: 3, label: 'Poste apagado — Av. Principal', category: 'Iluminação', status: 'Em análise', icon: '💡', color: '#eab308' },
  { id: 4, label: 'Enchente — cruzamento central', category: 'Enchente', status: 'Em análise', icon: '🌊', color: '#dc2626' },
  { id: 5, label: 'Calçada quebrada — escola', category: 'Buraco', status: 'Resolvido', icon: '🧱', color: '#3a9e72' },
]

interface Props { onReport: () => void }

export default function MapScreen({ onReport }: Props) {
  const [filter, setFilter] = useState('Todos')
  const filtered = filter === 'Todos' ? pins : pins.filter((p) => p.category === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Section label */}
      <div style={{ textAlign: 'center', padding: '14px 16px 10px', borderBottom: '1px solid #f0f0f0' }}>
        <p style={{ color: '#3a9e72', fontWeight: 700, fontSize: 15, margin: 0 }}>
          Bairro Mutirão | Jardim São Bento | SP
        </p>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', overflowX: 'auto' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              flexShrink: 0,
              padding: '5px 14px',
              borderRadius: 20,
              border: `2px solid ${filter === c ? '#3a9e72' : '#e5e7eb'}`,
              backgroundColor: filter === c ? '#3a9e72' : '#fff',
              color: filter === c ? '#fff' : '#6b7280',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Map */}
      <div style={{ padding: '0 14px 14px' }}>
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #d1d5db' }}>
          <iframe
            title="Mapa"
            width="100%"
            height="240"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            allowFullScreen
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14628.7!2d-46.7500!3d-23.6700!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce51f7ab000001%3A0x9d2e0d73c5b00001!2sJardim+S%C3%A3o+Bento%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
          />
        </div>
      </div>

      {/* Register button */}
      <div style={{ padding: '0 14px 14px' }}>
        <button
          onClick={onReport}
          style={{ width: '100%', backgroundColor: '#3a9e72', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
        >
          📋 Registrar problema neste local
        </button>
      </div>

      {/* Occurrences */}
      <div style={{ padding: '0 14px 20px' }}>
        <p style={{ fontWeight: 900, fontSize: 17, margin: '0 0 10px', color: '#111' }}>
          Ocorrências {filter !== 'Todos' ? `— ${filter}` : ''}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                border: `2px solid ${p.color}`,
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#fff',
              }}
            >
              <span style={{ fontSize: 24 }}>{p.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111' }}>{p.label}</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
