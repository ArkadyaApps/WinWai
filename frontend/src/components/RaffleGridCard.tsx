import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Raffle } from '../types';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface RaffleGridCardProps {
  raffle: Raffle;
  onPress: () => void;
}

const RaffleGridCard: React.FC<RaffleGridCardProps> = ({ raffle, onPress }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return '#FF6B6B';
      case 'hotel': return '#4ECDC4';
      case 'spa': return '#A8E6CF';
      default: return '#FFD700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return 'restaurant';
      case 'hotel': return 'bed';
      case 'spa': return 'fitness';
      default: return 'gift';
    }
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {raffle.image ? (
          <Image source={{ uri: raffle.image }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: getCategoryColor(raffle.category) }]}>
            <Ionicons name={getCategoryIcon(raffle.category) as any} size={40} color="#fff" />
          </View>
        )}
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(raffle.category) }]}>
          <Text style={styles.categoryText}>{raffle.category.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{raffle.title}</Text>
        
        <View style={styles.prizeInfo}>
          <View style={styles.prizeRow}>
            <Ionicons name="gift-outline" size={14} color="#666" />
            <Text style={styles.prizeText}>{raffle.prizesRemaining} left</Text>
          </View>
          <View style={styles.ticketRow}>
            <Ionicons name="ticket-outline" size={14} color="#FFD700" />
            <Text style={styles.ticketText}>{raffle.ticketCost}</Text>
          </View>
        </View>
        
        <Text style={styles.drawDate}>
          Draw: {format(new Date(raffle.drawDate), 'MMM dd')}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    lineHeight: 18,
  },
  prizeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prizeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ticketText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB800',
  },
  drawDate: {
    fontSize: 11,
    color: '#95A5A6',
    fontWeight: '500',
  },
});

export default RaffleGridCard;