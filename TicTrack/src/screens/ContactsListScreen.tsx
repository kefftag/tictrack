import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ContactsStorage, SavedContact } from '../services/contactsStorage';
import { COLORS } from '../utils/colors';

interface ContactsListScreenProps {
  onBack: () => void;
  onSelectContact?: (contact: SavedContact) => void;
}

type SortOrder = 'date' | 'name' | 'event';

export const ContactsListScreen: React.FC<ContactsListScreenProps> = ({ onBack, onSelectContact }) => {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<SavedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [showEventFilter, setShowEventFilter] = useState(false);

  useEffect(() => {
    loadContacts();
    loadEvents();
  }, [sortOrder]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, contacts, selectedEvent]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      let loadedContacts: SavedContact[];

      if (sortOrder === 'date') {
        loadedContacts = await ContactsStorage.getContactsSortedByDate();
      } else if (sortOrder === 'name') {
        loadedContacts = await ContactsStorage.getContactsSortedByName();
      } else {
        loadedContacts = await ContactsStorage.getContactsSortedByEvent();
      }

      setContacts(loadedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const allEvents = await ContactsStorage.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleSearch = async () => {
    let results = contacts;

    // Apply event filter
    if (selectedEvent) {
      results = results.filter(c => c.event?.toLowerCase() === selectedEvent.toLowerCase());
    }

    // Apply search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      results = results.filter(contact => {
        const name = contact.name?.toLowerCase() || '';
        const company = contact.company?.toLowerCase() || '';
        return name.includes(lowerQuery) || company.includes(lowerQuery);
      });
    }

    // Apply current sort order
    if (sortOrder === 'date') {
      results = results.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    } else if (sortOrder === 'name') {
      results = results.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
    } else {
      results = results.sort((a, b) => {
        const eventA = a.event?.toLowerCase() || 'zzz';
        const eventB = b.event?.toLowerCase() || 'zzz';
        return eventA.localeCompare(eventB);
      });
    }

    setFilteredContacts(results);
  };

  const handleExportCSV = async () => {
    try {
      if (filteredContacts.length === 0) {
        Alert.alert('No Contacts', 'No contacts to export');
        return;
      }

      // Create CSV content
      const headers = ['Name', 'Company', 'Title', 'Phone', 'Email', 'Event', 'Saved Date'];
      const rows = filteredContacts.map(contact => [
        contact.name || '',
        contact.company || '',
        contact.title || '',
        contact.phone || '',
        contact.email || '',
        contact.event || '',
        new Date(contact.savedAt).toLocaleDateString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const eventSuffix = selectedEvent ? `_${selectedEvent.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `tictrack_contacts${eventSuffix}_${timestamp}.csv`;

      // Save file
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Contacts',
        UTI: 'public.comma-separated-values-text',
      });

      Alert.alert(
        'Export Successful',
        `Exported ${filteredContacts.length} contact${filteredContacts.length !== 1 ? 's' : ''} to ${filename}`
      );
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Export Error', error.message || 'Failed to export contacts');
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
              await loadContacts();
              await loadEvents();
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
      <TouchableOpacity
        style={styles.contactInfo}
        onPress={() => onSelectContact && onSelectContact(item)}
      >
        <Text style={styles.contactName}>{item.name || 'No Name'}</Text>
        {item.company && <Text style={styles.contactCompany}>{item.company}</Text>}
        {item.title && <Text style={styles.contactTitle}>{item.title}</Text>}
        {item.event && <Text style={styles.contactEvent}>📍 Met at: {item.event}</Text>}
        <View style={styles.contactMeta}>
          <Text style={styles.contactDate}>{formatDate(item.savedAt)}</Text>
          {item.phone && <Text style={styles.contactPhone}>{item.phone}</Text>}
        </View>
        {item.messages && item.messages.length > 0 && (
          <Text style={styles.messageCount}>💬 {item.messages.length} message{item.messages.length > 1 ? 's' : ''}</Text>
        )}
      </TouchableOpacity>
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
        <TouchableOpacity onPress={handleExportCSV}>
          <Text style={styles.exportButton}>📊 CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or company..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
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
            <TouchableOpacity
              style={[styles.sortButton, sortOrder === 'event' && styles.sortButtonActive]}
              onPress={() => setSortOrder('event')}
            >
              <Text style={[styles.sortButtonText, sortOrder === 'event' && styles.sortButtonTextActive]}>
                Event
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {events.length > 0 && (
        <View style={styles.eventFilterContainer}>
          <TouchableOpacity
            style={styles.eventFilterToggle}
            onPress={() => setShowEventFilter(!showEventFilter)}
          >
            <Text style={styles.eventFilterLabel}>
              Filter by Event {selectedEvent ? `(${selectedEvent})` : ''}
            </Text>
            <Text style={styles.eventFilterArrow}>{showEventFilter ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {showEventFilter && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
              <View style={styles.eventButtons}>
                <TouchableOpacity
                  style={[styles.eventButton, !selectedEvent && styles.eventButtonActive]}
                  onPress={() => setSelectedEvent('')}
                >
                  <Text style={[styles.eventButtonText, !selectedEvent && styles.eventButtonTextActive]}>
                    All Events
                  </Text>
                </TouchableOpacity>
                {events.map(event => (
                  <TouchableOpacity
                    key={event}
                    style={[styles.eventButton, selectedEvent === event && styles.eventButtonActive]}
                    onPress={() => setSelectedEvent(event)}
                  >
                    <Text style={[styles.eventButtonText, selectedEvent === event && styles.eventButtonTextActive]}>
                      {event}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved contacts yet</Text>
          <Text style={styles.emptySubtext}>
            Scan a business card to get started
          </Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contacts found</Text>
          <Text style={styles.emptySubtext}>
            {selectedEvent ? `No contacts for "${selectedEvent}"` : 'Try a different search query'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.countText}>
            {searchQuery || selectedEvent ? `${filteredContacts.length} of ${contacts.length}` : filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
          </Text>
          <FlatList
            data={filteredContacts}
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
  exportButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: COLORS.backgroundSecondary,
    color: COLORS.text,
  },
  clearSearch: {
    position: 'absolute',
    right: 24,
    padding: 8,
  },
  clearSearchText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 12,
    fontWeight: '600',
  },
  sortScroll: {
    flex: 1,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
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
  eventFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  eventFilterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  eventFilterLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  eventFilterArrow: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  eventScroll: {
    marginTop: 8,
  },
  eventButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  eventButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  eventButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  eventButtonTextActive: {
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
    marginBottom: 4,
  },
  contactEvent: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
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
  messageCount: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8,
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
