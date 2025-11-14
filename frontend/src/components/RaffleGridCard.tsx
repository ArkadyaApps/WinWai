import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { Raffle } from '../types';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface RaffleGridCardProps {
  raffle: Raffle;
  onPress: () => void;
}

const RaffleGridCard: React.FC<RaffleGridCardProps> = ({ raffle, onPress }) => {
  // Debug: Check if raffle has image
  console.log('RaffleGridCard:', raffle.title, 'has image:', !!raffle.image, raffle.image?.substring(0, 50));
  
  const getCategoryGradient = (category: string): [string, string] => {
    switch (category) {
      case 'food': return ['#FF6B6B', '#FF8E53'];
      case 'hotel': return ['#4ECDC4', '#44A08D'];
      case 'spa': return ['#A8E6CF', '#88D8B0'];
      default: return ['#FFD700', '#FFC200'];
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

  const gradientColors = getCategoryGradient(raffle.category);

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={onPress}
    >
      {/* Image Container with Gradient Overlay */}
      <View style={styles.imageContainer}>
        {raffle.image ? (
          <>
            <Image source={{ uri: raffle.image }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageGradient}
            />
          </>
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={styles.imagePlaceholder}
          >
            <Ionicons name={getCategoryIcon(raffle.category) as any} size={45} color="#fff" />
          </LinearGradient>
        )}
        
        {/* Category Badge */}
        <LinearGradient
          colors={gradientColors}
          style={styles.categoryBadge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.categoryText}>{raffle.category.toUpperCase()}</Text>
        </LinearGradient>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{raffle.title}</Text>
        
        <View style={styles.infoContainer}>
          {/* Prize Count */}
          <View style={styles.infoRow}>
            <View style={[styles.iconBadge, { backgroundColor: '#FFF0F0' }]}>
              <Ionicons name="gift" size={12} color="#FF6B6B" />
            </View>
            <Text style={styles.infoText}>{raffle.prizesRemaining}</Text>
          </View>
          
          {/* Ticket Cost */}
          <View style={styles.ticketBadge}>
            <Ionicons name="ticket" size={12} color="#FFB800" />
            <Text style={styles.ticketText}>{raffle.ticketCost}</Text>
          </View>
        </View>
        
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={11} color="#95A5A6" />
          <Text style={styles.drawDate}>
            {format(new Date(raffle.drawDate), 'MMM dd, yyyy')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
      },
    }),
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 10,
    lineHeight: 17,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '700',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE6A0',
  },
  ticketText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFB800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drawDate: {
    fontSize: 10,
    color: '#95A5A6',
    fontWeight: '600',
  },
});

export default RaffleGridCard;