import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import MapScreen from './screens/MapScreen'
import ReportScreen from './screens/ReportScreen'
import SecurityScreen from './screens/SecurityScreen'
import ServicesScreen from './screens/ServicesScreen'
import AdminScreen from './screens/AdminScreen'
import EmergencyModal from './components/EmergencyModal'

export type Screen = 'home' | 'map' | 'report' | 'security' | 'services' | 'admin'

export interface Service {
  id: number
  name: string
  type: string
  address: string
  phone: string
  icon: string
  color: string
  hours: string
}

const initialServices: Service[] = [
  { id: 1, name: 'UBS Jardim São Bento', type: 'Saúde', address: 'Rua das Flores, 210', phone: '(11) 4002-8922', icon: '🏥', color: '#dc2626', hours: 'Seg–Sex: 7h–17h' },
  { id: 2, name: 'Delegacia do Jardim Ângela', type: 'Segurança', address: 'Av. Principal, 850', phone: '(11) 3333-0190', icon: '👮', color: '#1d4ed8', hours: '24 horas' },
  { id: 3, name: 'EMEF Prof. José Francisco', type: 'Educação', address: 'Rua do Bosque, 55', phone: '(11) 3333-0191', icon: '🏫', color: '#f97316', hours: 'Seg–Sex: 7h–18h' },
  { id: 4, name: 'CRAS Jardim Ângela', type: 'Social', address: 'Rua das Pedras, 120', phone: '(11) 3333-0192', icon: '🤝', color: '#7c3aed', hours: 'Seg–Sex: 8h–17h' },
  { id: 5, name: "Hospital M'Boi Mirim", type: 'Saúde', address: 'Av. do Cursino, 5500', phone: '(11) 3333-0193', icon: '🚑', color: '#dc2626', hours: '24 horas' },
  { id: 6, name: 'Correios Jardim Ângela', type: 'Serviços', address: 'Rua Central, 330', phone: '(11) 3003-0100', icon: '📮', color: '#eab308', hours: 'Seg–Sex: 9h–18h' },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [emergency, setEmergency] = useState(false)
  const [services, setServices] = useState<Service[]>(initialServices)

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff', fontFamily: 'Nunito, sans-serif' }}>

      <header style={{ backgroundColor: '#3a9e72', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 36 }}>🏠</span>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 26, fontFamily: 'Outfit, sans-serif', letterSpacing: -0.5 }}>ComuniApp</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setScreen('admin')}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
          >
            Admin
          </button>
          <button
            onClick={() => setEmergency(true)}
            style={{ background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
          >
            🆘 SOS
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {screen === 'home' && <HomeScreen onNavigate={setScreen} onEmergency={() => setEmergency(true)} />}
        {screen === 'map' && <MapScreen onReport={() => setScreen('report')} />}
        {screen === 'report' && <ReportScreen onBack={() => setScreen('home')} />}
        {screen === 'security' && <SecurityScreen onEmergency={() => setEmergency(true)} />}
        {screen === 'services' && <ServicesScreen services={services} />}
        {screen === 'admin' && <AdminScreen onBack={() => setScreen('home')} services={services} onServicesChange={setServices} />}
      </main>

      <nav style={{ display: 'flex', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff', flexShrink: 0 }}>
        {([
          { id: 'home', label: 'Início', icon: '🏠' },
          { id: 'map', label: 'Mapa', icon: '🗺️' },
          { id: 'report', label: 'Denunciar', icon: '📋' },
          { id: 'security', label: 'Segurança', icon: '🔒' },
          { id: 'services', label: 'Serviços', icon: '🏥' },
        ] as { id: Screen; label: string; icon: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '8px 4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderTop: screen === tab.id ? '2px solid #3a9e72' : '2px solid transparent',
              color: screen === tab.id ? '#3a9e72' : '#9ca3af',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {emergency && <EmergencyModal onClose={() => setEmergency(false)} />}
    </div>
  )
}
