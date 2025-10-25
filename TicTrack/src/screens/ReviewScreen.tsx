import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { BusinessCardData } from '../types';

interface ReviewScreenProps {
  imageUri: string;
  cardData: BusinessCardData;
  isLoading: boolean;
  onSaveContact: (data: BusinessCardData) => void;
  onBack: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  imageUri,
  cardData,
  isLoading,
  onSaveContact,
  onBack,
}) => {
  const [editedData, setEditedData] = useState<BusinessCardData>(cardData);

  useEffect(() => {
    setEditedData(cardData);
  }, [cardData]);

  const handleSave = () => {
    if (!editedData.name || editedData.name.trim() === '') {
      Alert.alert('Name Required', 'Please enter a name for this contact.');
      return;
    }
    onSaveContact(editedData);
  };

  const updateField = (field: keyof BusinessCardData, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>
          Extracting information from business card...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Contact</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Image source={{ uri: imageUri }} style={styles.cardImage} />

        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={editedData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Full Name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Company</Text>
            <TextInput
              style={styles.input}
              value={editedData.company}
              onChangeText={(text) => updateField('company', text)}
              placeholder="Company Name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={editedData.title}
              onChangeText={(text) => updateField('title', text)}
              placeholder="Job Title"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={editedData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={editedData.phone}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mobile</Text>
            <TextInput
              style={styles.input}
              value={editedData.mobile}
              onChangeText={(text) => updateField('mobile', text)}
              placeholder="+1 (555) 987-6543"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={editedData.website}
              onChangeText={(text) => updateField('website', text)}
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editedData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder="Full Address"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>LinkedIn</Text>
            <TextInput
              style={styles.input}
              value={editedData.linkedin}
              onChangeText={(text) => updateField('linkedin', text)}
              placeholder="LinkedIn Profile URL"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Twitter</Text>
            <TextInput
              style={styles.input}
              value={editedData.twitter}
              onChangeText={(text) => updateField('twitter', text)}
              placeholder="@username"
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#f1f5f9',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
