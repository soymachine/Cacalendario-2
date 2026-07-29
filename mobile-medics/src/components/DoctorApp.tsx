import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { DoctorInfo } from '../lib/doctor';
import { loadPatients, loadPracticeStatsAndAlerts, type PatientLink, type PracticeStats } from '../lib/patients';
import { D } from '../lib/design';
import BottomNav, { type Tab } from './BottomNav';
import HomeScreen from './HomeScreen';
import PatientListScreen from './PatientListScreen';
import PatientDetailScreen from './PatientDetailScreen';
import InviteScreen from './InviteScreen';
import ConfigScreen from './ConfigScreen';

interface DoctorAppProps {
  doctor: DoctorInfo;
}

export default function DoctorApp({ doctor: initialDoctor }: DoctorAppProps) {
  const [doctor, setDoctor] = useState<DoctorInfo>(initialDoctor);
  const [activeTab, setActiveTab] = useState<Tab>('inicio');
  const [patients, setPatients] = useState<PatientLink[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [practiceStats, setPracticeStats] = useState<PracticeStats | null>(null);
  const [semaforoFilter, setSemaforoFilter] = useState<string | undefined>(undefined);
  const [selectedPatient, setSelectedPatient] = useState<PatientLink | null>(null);

  const refreshPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const list = await loadPatients(doctor.id);
      setPatients(list);
      const acceptedIds = list.filter((p) => p.status === 'accepted' && p.patient_id).map((p) => p.patient_id as string);
      const { practiceStats: stats } = await loadPracticeStatsAndAlerts(acceptedIds);
      setPracticeStats(stats);
    } finally {
      setPatientsLoading(false);
    }
  }, [doctor.id]);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  const handleNavigate = (tab: Tab, filter?: string) => {
    setSemaforoFilter(filter);
    setSelectedPatient(null);
    setActiveTab(tab);
  };

  const handlePatientUpdated = (patch: Partial<PatientLink>) => {
    if (!selectedPatient) return;
    const updated = { ...selectedPatient, ...patch };
    setSelectedPatient(updated);
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleGlobalTagsUpdated = (tags: string[]) => {
    setDoctor((prev) => ({ ...prev, global_tags: tags }));
  };

  return (
    <View style={styles.fill}>
      <View style={styles.content}>
        {activeTab === 'inicio' && (
          <HomeScreen
            doctor={doctor}
            patients={patients}
            patientsLoading={patientsLoading}
            practiceStats={practiceStats}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'pacientes' && (
          selectedPatient ? (
            <PatientDetailScreen
              doctor={doctor}
              patient={selectedPatient}
              onBack={() => setSelectedPatient(null)}
              onPatientUpdated={handlePatientUpdated}
              onGlobalTagsUpdated={handleGlobalTagsUpdated}
            />
          ) : (
            <PatientListScreen
              doctor={doctor}
              patients={patients}
              patientsLoading={patientsLoading}
              initialSemaforoFilter={semaforoFilter}
              onRefresh={refreshPatients}
              onSelectPatient={setSelectedPatient}
            />
          )
        )}

        {activeTab === 'invitar' && (
          <InviteScreen doctor={doctor} patients={patients} onInvited={refreshPatients} />
        )}

        {activeTab === 'config' && (
          <ConfigScreen
            doctor={doctor}
            patients={patients}
            onDoctorUpdated={(updated) => setDoctor(updated)}
          />
        )}
      </View>

      <BottomNav active={activeTab} onChange={(tab) => { setSelectedPatient(null); setActiveTab(tab); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: D.bg },
  content: { flex: 1 },
});
