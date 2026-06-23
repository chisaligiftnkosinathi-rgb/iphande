import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Link } from 'expo-router';

// Architectural Layer Communication Imports (Updated to use your path aliases)
import { healthApi, HealthResponse } from '@/api/health';
import { eventStream, EventItem } from '@/state/eventStream';
import { SystemScoring } from '@/intelligence/systemScoring';
import { AnomalyDetector } from '@/intelligence/anomalyDetector';

export default function DashboardScreen() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Telemetry Fetch Routine (Appends signatures directly to State Layer)
  const fetchHealth = async () => {
    setLoading(true);

    try {
      eventStream.add({
        type: 'API_CALL',
        message: 'GET /health',
      });

      const result = await healthApi.fetchStatus();

      setHealth(result.data);
      setLatency(result.latencyMs);

      eventStream.add({
        type: 'API_SUCCESS',
        message: 'Health response received',
        meta: { latency: result.latencyMs },
      });

      eventStream.add({
        type: 'LATENCY_SAMPLE',
        message: `${result.latencyMs}ms payload register`,
        meta: { latency: result.latencyMs },
      });
    } catch (e) {
      setHealth(null);
      eventStream.add({
        type: 'API_ERROR',
        message: 'Health endpoint failed or timed out',
      });
    } finally {
      setLoading(false);
    }
  };

  // Wire Runtime Memory Channels on Mount
  useEffect(() => {
    fetchHealth();
    const unsub = eventStream.subscribe(setEvents);
    return () => unsub();
  }, []);

  // 🧠 DETERMINISTIC INTELLIGENCE COMPUTATION LAYER
  const systemScore = useMemo(() => {
    return SystemScoring.calculateScore({
      latencyMs: latency,
      consecutiveFailures: events.filter(e => e.type === 'API_ERROR').length,
      isUnreachable: !health,
    });
  }, [latency, events, health]);

  const systemRating = useMemo(() => {
    return SystemScoring.getTargetRating(systemScore);
  }, [systemScore]);

  const anomaly = useMemo(() => {
    return AnomalyDetector.analyzeStream(events);
  }, [events]);

  // Dynamic Rating Colors
  const ratingColor = useMemo(() => {
    if (systemRating === 'OPTIMAL') return '#22c55e';
    if (systemRating === 'DEGRADED') return '#f59e0b';
    return '#ef4444';
  }, [systemRating]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>iPhande</Text>
        <Text style={styles.subtitle}>Intelligence & Governance Platform</Text>
      </View>

      {/* SYSTEM HEALTH STATUS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Health</Text>

        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginVertical: 12 }} />
        ) : (
          <View>
            <Text style={styles.status}>
              Status: <Text style={{ fontWeight: '600', color: health ? '#22c55e' : '#ef4444' }}>{health?.status ?? 'unreachable'}</Text>
            </Text>

            <Text style={styles.meta}>
              Version: {health?.version ?? '-'}
            </Text>

            <Text style={styles.meta}>
              Environment: {health?.environment ?? '-'}
            </Text>
          </View>
        )}
      </View>

      {/* INTELLIGENCE PANEL */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Intelligence</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Operational Score:</Text>
          <Text style={[styles.metricValue, { color: ratingColor }]}>{systemScore}/100</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>System Rating:</Text>
          <Text style={[styles.metricValue, { color: ratingColor, fontSize: 14 }]}>{systemRating}</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Live Latency:</Text>
          <Text style={styles.metricValue}>{loading ? '--' : `${latency}ms`}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Anomaly Signature:</Text>
          <Text style={[styles.metricValue, { color: anomaly.hasAnomaly ? '#ef4444' : '#64748b', fontSize: 13 }]}>
            {anomaly.type}
          </Text>
        </View>

        <Text style={styles.anomalyDescription}>
          {anomaly.description}
        </Text>
      </View>

      {/* REAL-TIME EVENT LEDGER FEED */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Event Ledger</Text>

        {events.length === 0 ? (
          <Text style={styles.emptyEvent}>No stream telemetry captured</Text>
        ) : (
          events.slice(0, 5).map(e => (
            <View key={e.id} style={styles.eventRow}>
              <Text style={styles.eventTag}>[{e.type}]</Text>
              <Text style={styles.eventText} numberOfLines={1}>{e.message}</Text>
            </View>
          ))
        )}
      </View>

      {/* USER CONTROL LAYERS */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={fetchHealth} disabled={loading}>
          <Text style={styles.buttonText}>Refresh Live Diagnostics</Text>
        </TouchableOpacity>

        <Link href="/tools" asChild>
          <TouchableOpacity style={[styles.button, styles.primary]}>
            <Text style={styles.buttonText}>Open Steward Tools</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

/* ---------------- UI STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220'
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    marginTop: 40,
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.2
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2
  },
  card: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937'
  },
  cardTitle: {
    color: '#f8fafc',
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  status: {
    color: '#e5e7eb',
    fontSize: 15
  },
  meta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 13
  },
  metricValue: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: 15
  },
  divider: {
    height: 1,
    backgroundColor: '#1f2937',
    marginVertical: 10
  },
  anomalyDescription: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic'
  },
  emptyEvent: {
    color: '#4b5563',
    fontSize: 12,
    fontStyle: 'italic'
  },
  eventRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    alignItems: 'center'
  },
  eventTag: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '600',
    width: 85
  },
  eventText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1
  },
  actions: {
    marginTop: 8
  },
  button: {
    padding: 14,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151'
  },
  primary: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6'
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
});