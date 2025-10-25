import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { BusinessCardData } from '../types';
import { COLORS } from '../utils/colors';

interface CardSelectionScreenProps {
  imageUri: string;
  cards: BusinessCardData[];
  onSelectCard: (card: BusinessCardData, index: number) => void;
  onBack: () => void;
}

export const CardSelectionScreen: React.FC<CardSelectionScreenProps> = ({
  imageUri,
  cards,
  onSelectCard,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Contact</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Image source={{ uri: imageUri }} style={styles.cardImage} />

        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            Found {cards.length} business card{cards.length > 1 ? 's' : ''}
          </Text>
          <Text style={styles.messageSubtext}>
            Tap a card below to review and save
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={styles.cardItem}
              onPress={() => onSelectCard(card, index)}
            >
              <View style={styles.cardNumber}>
                <Text style={styles.cardNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>
                  {card.name || 'Unknown Name'}
                </Text>
                {card.company && (
                  <Text style={styles.cardCompany}>{card.company}</Text>
                )}
                {card.title && (
                  <Text style={styles.cardTitle}>{card.title}</Text>
                )}
                {card.email && (
                  <Text style={styles.cardDetail}>📧 {card.email}</Text>
                )}
                {card.phone && (
                  <Text style={styles.cardDetail}>📞 {card.phone}</Text>
                )}
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    backgroundColor: COLORS.backgroundSecondary,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: COLORS.backgroundSecondary,
  },
  messageBox: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 20,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  messageSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    padding: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardCompany: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginBottom: 6,
  },
  cardDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.primary,
    marginLeft: 12,
  },
  bottomPadding: {
    height: 40,
  },
});
