import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DoctorInfo } from '../lib/doctor';
import { loadPatients, loadPracticeStatsAndAlerts, type PatientLink, type PracticeStats } from '../lib/patients';
import { D } from '../lib/design';
import BottomNav, { type Tab } from './BottomNav';
import HomeScreen from './HomeScreen';
import PatientListScreen from './PatientListScreen';
import PatientDetailScreen from './PatientDetailScreen';
import InvitePatientModal from './InvitePatientModal';
import ConfigScreen from './ConfigScreen';
import TrialExpiredScreen from './TrialExpiredScreen';
import { isAccessBlocked } from '../lib/plan';
import { useLayout, LIST_PANE_WIDTH } from '../lib/layout';

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
  const [inviteOpen, setInviteOpen] = useState(false);
  const { isSplit } = useLayout();
  // La ficha se pinta con la versión de `patients` (la lista puede recargarse
  // con la ficha abierta al lado en iPad); `selectedPatient` solo sirve de
  // respaldo mientras el paciente no esté en la lista.
  const openPatient = selectedPatient
    ? patients.find((p) => p.id === selectedPatient.id) ?? selectedPatient
    : null;

  const refreshPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const list = await loadPatients(doctor.id);
      setPatients(list);
      const acceptedIds = list.filter((p) => p.status === 'accepted' && !p.doctor_unlinked && p.patient_id).map((p) => p.patient_id as string);
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

  const handleSelectPatientFromHome = (patient: PatientLink) => {
    setSelectedPatient(patient);
    setActiveTab('pacientes');
  };

  const handlePatientUpdated = (patch: Partial<PatientLink>) => {
    if (!openPatient) return;
    const updated = { ...openPatient, ...patch };
    setSelectedPatient(updated);
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleGlobalTagsUpdated = (tags: string[]) => {
    setDoctor((prev) => ({ ...prev, global_tags: tags }));
  };

  const handleFoodTagCatalogUpdated = (tags: string[]) => {
    setDoctor((prev) => ({ ...prev, food_tag_catalog: tags }));
  };

  // Sin plan activo (trial agotado o Pro cancelado): se bloquea el panel entero,
  // igual que en MW. El plan real lo
  // manda la base de datos, así que en cuanto el médico pague desde la web la
  // app se desbloquea sola al recargar el perfil.
  if (isAccessBlocked(doctor.plan, doctor.test_plan_started_at)) {
    return <TrialExpiredScreen proEnded={doctor.plan === 'free'} />;
  }

  const patientList = (
    <PatientListScreen
      doctor={doctor}
      patients={patients}
      patientsLoading={patientsLoading}
      initialSemaforoFilter={semaforoFilter}
      selectedId={isSplit ? openPatient?.id : undefined}
      onRefresh={refreshPatients}
      onSelectPatient={setSelectedPatient}
      onInvite={() => setInviteOpen(true)}
    />
  );

  const patientDetail = (patient: PatientLink) => (
    <PatientDetailScreen
      key={patient.id}
      doctor={doctor}
      patient={patient}
      inSplit={isSplit}
      onBack={() => setSelectedPatient(null)}
      onPatientUpdated={handlePatientUpdated}
      onArchiveChanged={refreshPatients}
      onGlobalTagsUpdated={handleGlobalTagsUpdated}
      onFoodTagCatalogUpdated={handleFoodTagCatalogUpdated}
    />
  );

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
            onSelectPatient={handleSelectPatientFromHome}
            onInvite={() => setInviteOpen(true)}
          />
        )}

        {activeTab === 'pacientes' && (
          // En iPad en horizontal (isSplit) lista y ficha se ven a la vez, como
          // en MW. Si no, la lista se oculta (sin desmontarla) mientras hay una
          // ficha abierta: así conserva búsqueda, filtros y scroll al volver o
          // al girar el iPad.
          <View style={styles.split}>
            <View style={isSplit ? styles.listPane : openPatient ? styles.hidden : styles.fill}>{patientList}</View>
            {(isSplit || openPatient) && (
              <View style={styles.detailPane}>
                {openPatient ? patientDetail(openPatient) : (
                  <View style={styles.emptyDetail}>
                    <Text style={styles.emptyDetailTitle}>Selecciona un paciente</Text>
                    <Text style={styles.emptyDetailBody}>Su ficha, registros y bitácora aparecerán aquí.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
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

      {inviteOpen && (
        <InvitePatientModal
          doctor={doctor}
          patients={patients}
          onClose={() => setInviteOpen(false)}
          onInvited={refreshPatients}
          onFoodTagCatalogUpdated={handleFoodTagCatalogUpdated}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: D.bg },
  content: { flex: 1 },
  split: { flex: 1, flexDirection: 'row' },
  listPane: { width: LIST_PANE_WIDTH, borderRightWidth: 1, borderRightColor: D.border },
  detailPane: { flex: 1 },
  hidden: { display: 'none' },
  emptyDetail: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyDetailTitle: { fontSize: 17, fontWeight: '800', color: D.text, marginBottom: 6 },
  emptyDetailBody: { fontSize: 13, color: D.textMuted, textAlign: 'center' },
});
