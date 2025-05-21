import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NextStep {
  step: string;
  completed: boolean;
}

interface ActionItem {
  actionItem: string;
  status: string;
  id: number;
  nextSteps: NextStep[];
  date?: string;
}

interface Category {
  id?: string;
  name: string;
  items: ActionItem[];
}

export default function ActionItemsScreen() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    let isMounted = true;
    console.log('🟣 ACTION_ITEMS_SCREEN: useEffect for data fetch triggered. HasFetched:', hasFetched);

    const fetchData = async () => {
      if (hasFetched && !refreshing) {
        console.log('🟣 ACTION_ITEMS_SCREEN: Already fetched or not refreshing. Skipping API call.');
        if (isMounted && loading) setLoading(false);
        return;
      }

      console.log('🟣 ACTION_ITEMS_SCREEN: Initiating API call.');
      if (!refreshing) setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        console.log('🟣 ACTION_ITEMS_SCREEN: Token obtained.');
        const API_URL = 'https://innatus.netlify.app/api/mobile/action-items';
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        console.log(`🟣 ACTION_ITEMS_SCREEN: API Response Status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Failed to get error text');
          console.error('🟣 ACTION_ITEMS_SCREEN: API Error Response Text:', errorText);
          throw new Error(`Failed to fetch. Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('🟣 ACTION_ITEMS_SCREEN: Data received, categories:', data.categories?.length);
        if (isMounted) {
          setCategories(data.categories || []);
          console.log('🟣 ACTION_ITEMS_SCREEN: Categories state updated.');
          if (!refreshing) setHasFetched(true);
        }
      } catch (err: any) {
        console.error('🟣 ACTION_ITEMS_SCREEN: Error during fetch:', err.message);
        if (isMounted) setError(err.message || 'Unknown error');
      } finally {
        if (isMounted) {
          setLoading(false);
          if (refreshing) setRefreshing(false);
          console.log('🟣 ACTION_ITEMS_SCREEN: Loading/refreshing states updated.');
        }
      }
    };

    if (!hasFetched || refreshing) {
        fetchData();
    }

    return () => {
      console.log('🟣 ACTION_ITEMS_SCREEN: useEffect cleanup / unmount.');
      isMounted = false;
    };
  }, [getToken, hasFetched, refreshing]);

  const onRefresh = useCallback(async () => {
    console.log('🟣 ACTION_ITEMS_SCREEN: onRefresh called.');
    setRefreshing(true);
  }, []);

  // Sort categories and items by earliest date first
  const sortedCategories = categories.map(category => ({
    ...category,
    items: category.items?.slice().sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    })
  }));

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Open Action Items</Text>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={24} color="#4285F4" />
          </TouchableOpacity>
        </View>

        {sortedCategories.length === 0 ? (
          <Text style={styles.emptyText}>No action items found.</Text>
        ) : (
          sortedCategories.map((category, idx) => (
            <View key={category.name + idx} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category.name}</Text>
              {category.items.map((item, itemIdx) => (
                <View key={item.actionItem + itemIdx} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.categoryContainer}>
                      <Text style={styles.category}>{category.name}</Text>
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
                        <MaterialIcons name={step.completed ? "check-circle" : "check-circle-outline"} size={20} color={step.completed ? "#34A853" : "#4285F4"} />
                        <Text style={[styles.stepText, step.completed && styles.completedStep]}>{step.step}</Text>
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
            </View>
          ))
        )}
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
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4285F4',
    marginBottom: 8,
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
  completedStep: {
    textDecorationLine: 'line-through',
    color: '#34A853',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  voicePlateContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 90 : 70,
    alignItems: 'center',
    zIndex: 10,
  },
  voicePlateOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6a82fb',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  voicePlateOuterRecording: {
    shadowColor: '#ff5f6d',
    borderColor: '#fff',
  },
  voicePlateBlur: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voicePlateGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voicePlateButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  micIcon: {
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  voicePlateLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
}); 