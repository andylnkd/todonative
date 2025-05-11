import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// This would typically come from your state management solution
// For now using dummy data
const DUMMY_ACTION_ITEMS = [
  {
    id: '1',
    category: 'Follow-ups',
    actionItem: 'Schedule meeting with design team',
    nextSteps: ['Send calendar invites', 'Prepare agenda'],
    status: 'open',
  },
  {
    id: '2',
    category: 'Tasks',
    actionItem: 'Review Q3 metrics',
    nextSteps: ['Gather data', 'Create presentation'],
    status: 'open',
  },
];

export default function ActionItemsScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Open Action Items</Text>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={24} color="#4285F4" />
          </TouchableOpacity>
        </View>

        {DUMMY_ACTION_ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.categoryContainer}>
                <Text style={styles.category}>{item.category}</Text>
              </View>
              <TouchableOpacity>
                <MaterialIcons name="more-vert" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.actionItem}>{item.actionItem}</Text>
            
            <View style={styles.nextStepsContainer}>
              <Text style={styles.nextStepsTitle}>Next Steps:</Text>
              {item.nextSteps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <MaterialIcons name="check-circle-outline" size={20} color="#4285F4" />
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.completeButton}>
                <MaterialIcons name="done" size={20} color="#4285F4" />
                <Text style={styles.completeButtonText}>Mark Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  category: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '500',
  },
  actionItem: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  nextStepsContainer: {
    marginBottom: 16,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  stepText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 