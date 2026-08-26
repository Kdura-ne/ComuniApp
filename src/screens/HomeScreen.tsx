import type { Screen } from '../App'

const problems = [
  { id: 1, title: 'Buraco na Rua das Pedras', category: 'Buraco', status: 'Aberto', votes: 23, urgency: 'alta' },
  { id: 2, title: 'Enchente no cruzamento central', category: 'Enchente', status: 'Em análise', votes: 18, urgency: 'media' },
  { id: 3, title: 'Calçada quebrada perto da escola', category: 'Calçada', status: 'Aberto', votes: 11, urgency: 'media' },
  { id: 4, title: 'Lixo acumulado no parque', category: 'Lixo', status: 'Resolvido', votes: 7, urgency: 'resolvido' },
]

const borderColor: Record<string, string> = {
  alta: '#dc2626',
  media: '#eab308',
  resolvido: '#3a9e72',
}

interface Props {
  onNavigate: (s: Screen) => void
  onEmergency: () => void
}

export default function HomeScreen({ onNavigate }: Props) {
  return (
    <div style={{ paddingBottom: 20 }}>

      {/* Welcome */}
      <div style={{ textAlign: 'center', padding: '18px 16px 14px', borderBottom: '1px solid #f0f0f0' }}>
        <p style={{ color: '#3a9e72', fontWeight: 700, fontSize: 16, margin: 0 }}>Bem vindo, morador!</p>
      </div>

      {/* Stats */}
      <div style={{ backgroundColor: '#3a9e72', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Problemas resolvidos hoje', value: '12' },
          { label: 'Problemas resolvidos esse mês', value: '47' },
          { label: 'Denúncias hoje', value: '8' },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>➡️</span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
              <span style={{ fontWeight: 900 }}>{s.value}</span> {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Map label */}
      <div style={{ textAlign: 'center', padding: '18px 16px 10px' }}>
        <p style={{ color: '#3a9e72', fontWeight: 700, fontSize: 15, margin: 0 }}>
          Bairro Mutirão | Jardim São Bento | SP
        </p>
      </div>

      {/* Map */}
      <div style={{ padding: '0 14px 18px' }}>
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '2px solid #d1d5db' }}>
          <iframe
            title="Mapa Jardim São Bento"
            width="100%"
            height="220"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            allowFullScreen
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14628.7!2d-46.7500!3d-23.6700!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce51f7ab000001%3A0x9d2e0d73c5b00001!2sJardim+S%C3%A3o+Bento%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '0 14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={() => onNavigate('report')}
          style={{ backgroundColor: '#3a9e72', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 10px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
        >
          📋 Registrar Denúncia
        </button>
        <button
          onClick={() => onNavigate('map')}
          style={{ backgroundColor: '#3a9e72', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 10px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
        >
          🗺️ Ver Mapa
        </button>
      </div>

      {/* Problems */}
      <div style={{ padding: '0 14px' }}>
        <p style={{ fontWeight: 900, fontSize: 17, margin: '0 0 12px', color: '#111' }}>Problemas recentes</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {problems.map((p) => (
            <div
              key={p.id}
              style={{
                border: `2px solid ${borderColor[p.urgency]}`,
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>👍</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>{p.votes}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111', lineHeight: 1.3 }}>{p.title}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{p.category}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: borderColor[p.urgency] }}>{p.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
