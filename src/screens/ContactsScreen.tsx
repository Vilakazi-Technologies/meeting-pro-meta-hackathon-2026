import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenLayout } from '../components/TabScreenLayout';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { ScreenHeader } from '../components/ScreenHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useBusinessContacts } from '../data/businessContacts';
import { useCallAnalytics } from '../data/callAnalytics';
import { outcomeLabel } from '../data/contactCallStats';
import { COLORS, FONT, RADIUS, BRAND, SPACING } from '../constants/theme';
import { LAYOUT } from '../constants/layout';

export function ContactsScreen() {
  const { effectiveTheme } = useTheme();
  const palette = COLORS[effectiveTheme];
  const { contacts, loading, error, addContact, removeContact } = useBusinessContacts();
  const { contactStats } = useCallAnalytics();

  const statsForPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return contactStats.find((s) => s.label.replace(/\D/g, '') === digits);
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing details', 'Name and WhatsApp phone number are required.');
      return;
    }
    setSaving(true);
    try {
      await addContact({
        displayName: name,
        phone,
        email: email || undefined,
        company: company || undefined,
      });
      resetForm();
      setModalOpen(false);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <TabScreenLayout>
            <ScreenHeader
              title="Business contacts"
              subtitle="Who you call — answer rates, duration, and AI outcomes"
              rightAction={{
                icon: 'add-circle',
                onPress: () => setModalOpen(true),
                color: BRAND.accent,
              }}
            />

            <GlassCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={22} color={BRAND.accent} />
                <Text style={[styles.infoText, { color: palette.textSecondary }]}>
                  Save clients, suppliers, and colleagues you reach on WhatsApp. Meeting Pro matches
                  incoming and outgoing Business calls to these numbers, transcribes after hang-up,
                  and emails you minutes you can forward like a traditional minute-taker would.
                </Text>
              </View>
            </GlassCard>

            {error ? (
              <Text style={[styles.error, { color: palette.error }]}>{error}</Text>
            ) : null}

            {loading ? (
              <Text style={{ color: palette.textMuted }}>Loading contacts…</Text>
            ) : contacts.length === 0 ? (
              <GlassCard style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: palette.text }]}>No contacts yet</Text>
                <Text style={[styles.emptyBody, { color: palette.textSecondary }]}>
                  Tap + to add suppliers, clients, and partners you call on WhatsApp.
                </Text>
              </GlassCard>
            ) : (
              <View style={styles.list}>
                {contacts.map((c) => {
                  const stats = statsForPhone(c.phone);
                  return (
                  <GlassCard key={c.id} style={styles.contactCard}>
                    <View style={styles.contactRow}>
                      <View style={[styles.avatar, { backgroundColor: `${BRAND.whatsapp}22` }]}>
                        <Text style={[styles.avatarText, { color: BRAND.whatsappDark }]}>
                          {c.displayName.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.contactBody}>
                        <Text style={[styles.contactName, { color: palette.text }]}>
                          {c.displayName}
                        </Text>
                        {c.company ? (
                          <Text style={[styles.contactMeta, { color: palette.textMuted }]}>
                            {c.company}
                          </Text>
                        ) : null}
                        <Text style={[styles.contactMeta, { color: palette.textSecondary }]}>
                          {c.phone}
                        </Text>
                        {stats ? (
                          <Text style={[styles.statsLine, { color: palette.textMuted }]}>
                            {stats.total} calls ·{' '}
                            {stats.answerRate != null
                              ? `${Math.round(stats.answerRate * 100)}% pick-up`
                              : '— pick-up'}
                            {stats.avgDurationSeconds != null
                              ? ` · ~${Math.round(stats.avgDurationSeconds / 60)} min avg`
                              : ''}
                            {' · '}
                            {outcomeLabel(stats.lastOutcome)}
                          </Text>
                        ) : (
                          <Text style={[styles.statsLine, { color: palette.textMuted }]}>
                            No calls logged with this number yet
                          </Text>
                        )}
                        {c.email ? (
                          <Text style={[styles.contactMeta, { color: palette.textMuted }]}>
                            {c.email}
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        onPress={() =>
                          Alert.alert('Remove contact?', c.displayName, [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: () => removeContact(c.id),
                            },
                          ])
                        }
                        hitSlop={12}
                      >
                        <Ionicons name="trash-outline" size={20} color={palette.textMuted} />
                      </Pressable>
                    </View>
                  </GlassCard>
                  );
                })}
              </View>
            )}

        </TabScreenLayout>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: palette.background }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={Platform.OS === 'web'}
              contentContainerStyle={styles.modalScroll}
            >
            <Text style={[styles.modalTitle, { color: palette.text }]}>Add business contact</Text>
            <GlassInput label="Name" value={name} onChangeText={setName} placeholder="Thandi Nkosi" />
            <GlassInput
              label="WhatsApp number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+27 82 123 4567"
              keyboardType="phone-pad"
            />
            <GlassInput
              label="Company (optional)"
              value={company}
              onChangeText={setCompany}
              placeholder="Khaya Property"
            />
            <GlassInput
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
              placeholder="they@company.co.za"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setModalOpen(false)} style={styles.modalBtn}>
                <Text style={{ color: palette.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={[styles.modalBtnPrimary, { backgroundColor: BRAND.accent }]}
              >
                <Text style={styles.modalBtnPrimaryText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  infoCard: { marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: FONT.sm, lineHeight: 20 },
  error: { marginBottom: SPACING.sm, fontSize: FONT.sm },
  empty: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg },
  emptyTitle: { fontSize: FONT.lg, fontWeight: '700' },
  emptyBody: { fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },
  list: { gap: LAYOUT.cardGap },
  contactCard: {},
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FONT.lg, fontWeight: '800' },
  contactBody: { flex: 1, gap: 2 },
  contactName: { fontSize: FONT.base, fontWeight: '700' },
  contactMeta: { fontSize: FONT.sm },
  statsLine: { fontSize: FONT.xs, lineHeight: 16, marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '88%',
  },
  modalScroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: { fontSize: FONT.xl, fontWeight: '700', marginBottom: SPACING.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.md, marginTop: SPACING.sm },
  modalBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  modalBtnPrimary: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  modalBtnPrimaryText: { color: '#FFF', fontWeight: '700' },
});
