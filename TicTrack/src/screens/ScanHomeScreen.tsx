import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Constants from 'expo-constants';
import { COLORS } from '../utils/colors';
import { TicTagLogo } from '../components/TicTagLogo';

interface ScanHomeScreenProps {
  onStartScan: () => void;
  hasApiKey: boolean;
}

export const ScanHomeScreen: React.FC<ScanHomeScreenProps> = ({ onStartScan, hasApiKey }) => {
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TicTagLogo size="large" />

        <Text style={styles.subtitle}>Business Card Scanner</Text>
        <Text style={styles.version}>v{appVersion}</Text>
        <Text style={styles.description}>
          Scan business cards, extract contact info, and connect instantly
        </Text>

        <TouchableOpacity
          style={[styles.scanButton, !hasApiKey && styles.scanButtonDisabled]}
          onPress={onStartScan}
          disabled={!hasApiKey}
        >
          <Text style={styles.scanButtonIcon}>📸</Text>
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>

        {!hasApiKey && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>⚠️ API Key Required</Text>
            <Text style={styles.warningSubtext}>
              Please go to Settings to enter your Claude API key
            </Text>
          </View>
        )}

        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Extract contact info instantly with AI</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💾</Text>
            <Text style={styles.featureText}>Save to contacts or export VCF</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureText}>Send WhatsApp messages</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📧</Text>
            <Text style={styles.featureText}>Send professional emails</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>✏️</Text>
            <Text style={styles.featureText}>Edit contacts and add notes</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureText}>Track message history</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Powered by Tictag AI
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 4,
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.textTertiary,
    marginBottom: 8,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.textTertiary,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    paddingHorizontal: 48,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: COLORS.text,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonDisabled: {
    backgroundColor: COLORS.backgroundSecondary,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  scanButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  scanButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
  },
  warningContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  features: {
    width: '100%',
    marginTop: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textTertiary,
    paddingBottom: 20,
  },
});
