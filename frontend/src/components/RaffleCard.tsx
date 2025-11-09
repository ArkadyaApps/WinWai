import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { Raffle } from '../types';
import { format } from 'date-fns';

interface RaffleCardProps {
  raffle: Raffle;
  onPress: () => void;
}

const RaffleCard: React.FC<RaffleCardProps> = ({ raffle, onPress }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return '#FF6B6B';
      case 'hotel': return '#4ECDC4';
      case 'spa': return '#95E1D3';
      default: return '#FFD700';
    }
  };

  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {raffle.image ? (
        <Image source={{ uri: raffle.image }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: getCategoryColor(raffle.category) }]} />
      )}
      
      <View style={styles.content}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(raffle.category) }]}>
          <Text style={styles.categoryText}>{raffle.category.toUpperCase()}</Text>
        </View>
        
        <Text style={styles.title} numberOfLines={2}>{raffle.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{raffle.description}</Text>
        
        <View style={styles.footer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prizes Left:</Text>
            <Text style={styles.infoValue}>{raffle.prizesRemaining}/{raffle.prizesAvailable}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cost:</Text>
            <Text style={styles.ticketCost}>{raffle.ticketCost} tickets</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Draw Date:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(raffle.drawDate), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  footer: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#95A5A6',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
  },
  ticketCost: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
  },
});

export default RaffleCard;