import { useState } from 'react'

const occurrences = [
  { id: 1, type: 'Tentativa de roubo', location: 'Rua das Pedras, próx. ao mercado', time: 'Hoje, 14h32', icon: '🚨', color: '#dc2626', anon: true },
  { id: 2, type: 'Área perigosa', location: 'Beco do Ipê — à noite', time: 'Ontem, 22h10', icon: '⚠️', color: '#eab308', anon: false },
  { id: 3, type: 'Assalto', location: 'Av. Principal, parada de ônibus', time: '02/08, 07h15', icon: '🔪', color: '#dc2626', anon: true },
  { id: 4, type: 'Maus-tratos animais', location: 'Rua do Bosque, nº 88', time: '30/07, 10h20', icon: '🐾', color: '#eab308', anon: false },
]

const types = [
  { id: 'assalto', label: 'Assalto', icon: '🚨' },
  { id: 'roubo', label: 'Tentativa de roubo', icon: '🔪' },
  { id: 'area', label: 'Área perigosa', icon: '⚠️' },
  { id: 'animal', label: 'Maus-tratos animais', icon: '🐾' },
]

interface Props { onEmergency: () => void }

export default function SecurityScreen({ onEmergency }: Props) {
  const [tab, setTab] = useState<'history' | 'report'>('history')
  const [type, setType] = useState('')
  const [desc, setDesc] = useState('')
  const [location, setLocation] = useState('')
  const [anon, setAnon] = useState(true)
  const [sent, setSent] = useState(false)

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* Header strip */}
      <div style={{ backgroundColor: '#3a9e72', padding: '16px 16px 12px' }}>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Segurança da Comunidade</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '4px 0 12px' }}>Registre e acompanhe ocorrências de segurança</p>
        <button
          onClick={onEmergency}
          style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
        >
          🆘 EMERGÊNCIA — Acionar agora
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['history', 'report'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderBottom: `3px solid ${tab === t ? '#3a9e72' : 'transparent'}`,
              background: 'none',
              color: tab === t ? '#3a9e72' : '#9ca3af',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {t === 'history' ? '📋 Histórico' : '🔔 Denunciar'}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 14px' }}>

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', margin: 0 }}>{occurrences.length} OCORRÊNCIAS RECENTES</p>
            {occurrences.map((o) => (
              <div
                key={o.id}
                style={{ border: `2px solid ${o.color}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff' }}
              >
                <span style={{ fontSize: 24 }}>{o.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111' }}>{o.type}</p>
                    {o.anon && <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', backgroundColor: '#f5f5f5', borderRadius: 10, padding: '2px 7px' }}>Anônimo</span>}
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280' }}>📍 {o.location}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: o.color }}>{o.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'report' && !sent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#6b7280', margin: 0 }}>Tipo de ocorrência:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {types.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: 12, border: `2px solid ${type === t.id ? '#3a9e72' : '#e5e7eb'}`, backgroundColor: type === t.id ? '#f0faf5' : '#fff', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', textAlign: 'left' }}
                >
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{t.label}</span>
                </button>
              ))}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>LOCAL</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Rua, referência..."
                style={{ width: '100%', border: `2px solid ${location ? '#3a9e72' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 5 }}>DESCRIÇÃO</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descreva o ocorrido..."
                rows={3}
                style={{ width: '100%', border: `2px solid ${desc ? '#3a9e72' : '#e5e7eb'}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box', color: '#111' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid #e5e7eb', borderRadius: 10, padding: '12px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, margin: 0, color: '#111' }}>Denúncia anônima</p>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Recomendado para segurança</p>
              </div>
              <button
                onClick={() => setAnon(!anon)}
                style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: anon ? '#3a9e72' : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ position: 'absolute', top: 3, left: anon ? 23 : 3, width: 20, height: 20, backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </button>
            </div>

            <button
              onClick={() => type && desc && location && setSent(true)}
              disabled={!type || !desc || !location}
              style={{ width: '100%', backgroundColor: type && desc && location ? '#3a9e72' : '#d1d5db', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
            >
              Enviar Denúncia
            </button>
          </div>
        )}

        {tab === 'report' && sent && (
          <div style={{ textAlign: 'center', padding: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 52 }}>✅</span>
            <p style={{ fontWeight: 900, fontSize: 18, margin: 0, color: '#111', fontFamily: 'Outfit, sans-serif' }}>Denúncia enviada!</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Obrigado por contribuir com a segurança do bairro.</p>
            <button
              onClick={() => { setSent(false); setType(''); setDesc(''); setLocation('') }}
              style={{ backgroundColor: '#3a9e72', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
            >
              Nova denúncia
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
