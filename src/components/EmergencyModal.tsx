const contacts = [
  { label: 'SAMU', number: '192', icon: '🚑', desc: 'Emergência médica', color: '#dc2626' },
  { label: 'Bombeiros', number: '193', icon: '🚒', desc: 'Incêndios e resgates', color: '#f97316' },
  { label: 'Polícia Militar', number: '190', icon: '👮', desc: 'Ocorrências policiais', color: '#1d4ed8' },
  { label: 'Defesa Civil', number: '199', icon: '🏚️', desc: 'Desastres naturais', color: '#7c3aed' },
  { label: 'CVV', number: '188', icon: '💙', desc: 'Apoio emocional 24h', color: '#0891b2' },
]

interface Props { onClose: () => void }

export default function EmergencyModal({ onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: '20px 20px 0 0', overflow: 'hidden', boxShadow: '0 -4px 30px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ backgroundColor: '#dc2626', padding: '16px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 30 }}>🆘</span>
            <div>
              <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Emergência</p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, margin: 0 }}>Selecione o tipo de ajuda</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Contacts */}
        <div style={{ padding: '12px 14px' }}>
          {contacts.map((c) => (
            <a
              key={c.label}
              href={`tel:${c.number}`}
              style={{ display: 'flex', alignItems: 'center', gap: 12, border: `2px solid ${c.color}30`, borderRadius: 12, padding: '12px 14px', marginBottom: 10, textDecoration: 'none', backgroundColor: '#fff' }}
            >
              <span style={{ fontSize: 26 }}>{c.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{c.desc}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 22, color: c.color, fontFamily: 'Outfit, sans-serif' }}>{c.number}</p>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: c.color }}>Ligar →</p>
              </div>
            </a>
          ))}
        </div>

        <div style={{ padding: '0 14px 20px' }}>
          <button
            onClick={onClose}
            style={{ width: '100%', backgroundColor: '#f5f5f5', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 14, color: '#6b7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
