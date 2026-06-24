import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiService, HealthResponse } from '../services/api';

type SystemState = 'loading' | 'online' | 'degraded' | 'offline';

export default function DashboardScreen() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getHealth();
      setHealth(data);
    } catch (err) {
      setError('System unreachable. Check network or backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Normalize backend status → UI state
  const systemState: SystemState = useMemo(() => {
    if (loading) return 'loading';
    if (error || !health) return 'offline';

    if (health.status === 'alive') return 'online';
    if (health.status === 'degraded') return 'degraded';

    return 'offline';
  }, [loading, error, health]);

  const statusConfig = useMemo(() => {
    switch (systemState) {
      case 'online':
        return {
          label: 'Operational',
          color: '#22c55e',
        };
      case 'degraded':
        return {
          label: 'Degraded',
          color: '#f59e0b',
        };
      case 'offline':
        return {
          label: error ?? 'Offline',
          color: '#ef4444',
        };
      default:
        return {
          label: 'Loading...',
          color: '#94a3b8',
        };
    }
  }, [systemState, error]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>iPhande</Text>
        <Text style={styles.subtitle}>
          Intelligence & Governance Platform
        </Text>
      </View>

      {/* SYSTEM STATUS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>System Status</Text>

        <View style={styles.statusRow}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <View
              style={[
                styles.dot,
                { backgroundColor: statusConfig.color },
              ]}
            />
          )}

          <Text style={styles.statusText}>
            {statusConfig.label}
          </Text>
        </View>

        {/* METADATA */}
        <View style={styles.divider} />

        <Text style={styles.metaText}>
          Version: {health?.version ?? '-'}
        </Text>

        <Text style={styles.metaText}>
          Environment: {health?.environment ?? '-'}
        </Text>

        {/* ACTION */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchHealth}
          disabled={loading}
        >
          <Text style={styles.refreshText}>
            Refresh Status
          </Text>
        </TouchableOpacity>
      </View>

      {/* NAVIGATION */}
      <View style={styles.navContainer}>
        <Link href="/tools" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Open Steward Tools
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#0f172a',
  },

  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
    color: '#0f172a',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  statusText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },

  metaText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },

  refreshButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },

  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },

  navContainer: {
    marginTop: 20,
  },

  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
