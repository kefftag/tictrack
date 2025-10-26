import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ContactsStorage, SavedContact } from '../services/contactsStorage';
import { COLORS } from '../utils/colors';

interface ContactsListScreenProps {
  onBack: () => void;
}

type SortOrder = 'date' | 'name';

export const ContactsListScreen: React.FC<ContactsListScreenProps> = ({ onBack }) => {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date');

  useEffect(() => {
    loadContacts();
  }, [sortOrder]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      let loadedContacts: SavedContact[];

      if (sortOrder === 'date') {
        loadedContacts = await ContactsStorage.getContactsSortedByDate();
      } else {
        loadedContacts = await ContactsStorage.getContactsSortedByName();
      }

      setContacts(loadedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = (id: string, name: string) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to remove ${name} from the app history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ContactsStorage.deleteContact(id);
              loadContacts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderContact = ({ item }: { item: SavedContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name || 'No Name'}</Text>
        {item.company && <Text style={styles.contactCompany}>{item.company}</Text>}
        {item.title && <Text style={styles.contactTitle}>{item.title}</Text>}
        <View style={styles.contactMeta}>
          <Text style={styles.contactDate}>{formatDate(item.savedAt)}</Text>
          {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteContact(item.id, item.name || 'this contact')}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Saved Contacts</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Contacts</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortOrder === 'date' && styles.sortButtonActive]}
            onPress={() => setSortOrder('date')}
          >
            <Text style={[styles.sortButtonText, sortOrder === 'date' && styles.sortButtonTextActive]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortOrder === 'name' && styles.sortButtonActive]}
            onPress={() => setSortOrder('name')}
          >
            <Text style={[styles.sortButtonText, sortOrder === 'name' && styles.sortButtonTextActive]}>
              Name
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved contacts yet</Text>
          <Text style={styles.emptySubtext}>
            Scan a business card to get started
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.countText}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</Text>
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 12,
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: COLORS.background,
  },
  countText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  contactCompany: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  contactTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  contactMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  contactDate: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});
