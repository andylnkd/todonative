import { useAuth } from '@clerk/clerk-expo';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { RecordingOptions } from 'expo-av/build/Audio';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionItem {
  actionItem: string;
  nextSteps: string[];
}

interface Category {
  name: string;
  items: ActionItem[];
}

interface ProcessAudioResponse {
  transcript: string;
  actionItems: {
    categories: Category[];
  };
}

const recordingOptions: RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.MIN,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export default function HomePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [actionItems, setActionItems] = useState<Category[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { getToken } = useAuth();
  const [glowAnim] = useState(new Animated.Value(1));

  // Animated glow effect for recording
  const startGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  };
  const stopGlow = () => {
    glowAnim.stopAnimation();
    glowAnim.setValue(1);
  };

  // Start/stop glow on recording state change
  if (isRecording) startGlow(); else stopGlow();

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Permission to access microphone was denied');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);

      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      
      const uri = recording.getURI();
      if (!uri) throw new Error('No recording URI available');
      
      await processAudio(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
    }
  };

  const processAudio = async (uri: string) => {
    try {
      setIsProcessing(true);
      console.log('🟣 [AUDIO_DEBUG] Starting audio processing. Initial URI from expo-av:', uri);
      
      const formData = new FormData();
      
      // Using the original URI directly from expo-av
      const fileUri = uri; 
      console.log('🟣 [AUDIO_DEBUG] Using original fileUri for FormData:', fileUri);

      const audioFile = {
        uri: fileUri,
        type: 'audio/wav',
        name: 'recording.wav',
      };
      formData.append('audio', audioFile as any);
      
      console.log('🟣🟣🟣 [AUDIO_DEBUG] BEGIN AUDIO FILE DETAILS 🟣🟣🟣');
      console.log('🟣 [AUDIO_DEBUG] audioFile Object:', audioFile);
      console.log('🟣 [AUDIO_DEBUG] audioFile.uri:', audioFile.uri);
      console.log('🟣 [AUDIO_DEBUG] audioFile.type:', audioFile.type);
      console.log('🟣 [AUDIO_DEBUG] audioFile.name:', audioFile.name);
      console.log('🟣 [AUDIO_DEBUG] audioFile JSON:', JSON.stringify(audioFile));
      console.log('🟣🟣🟣 [AUDIO_DEBUG] END AUDIO FILE DETAILS 🟣🟣🟣');

      const token = await getToken();
      console.log('Auth token obtained:', token ? 'Token exists' : 'No token');

      // Use your computer's IP address instead of localhost
      const API_URL = 'https://innatus.netlify.app/api/mobile/process-audio'; // Replace with your computer's IP

      // const API_URL = 'http://10.0.0.93:3000/api/mobile/process-audio'; // Replace with your computer's IP
      console.log('Making request to:', API_URL);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ProcessAudioResponse = await response.json();
      console.log('Successfully processed audio');
      setTranscript(data.transcript);
      setActionItems(data.actionItems.categories);
    } catch (error) {
      console.error('Error processing audio:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsProcessing(false);
    }
  };

  const renderActionItems = useCallback(() => {
    return actionItems.map((category, index) => (
      <View key={index} style={styles.category}>
        <Text style={styles.categoryTitle}>{category.name}</Text>
        {category.items.map((item, itemIndex) => (
          <View key={itemIndex} style={styles.actionItem}>
            <Text style={styles.actionItemText}>{item.actionItem}</Text>
            {item.nextSteps.map((step, stepIndex) => (
              <Text key={stepIndex} style={styles.nextStep}>• {step}</Text>
            ))}
          </View>
        ))}
      </View>
    ));
  }, [actionItems]);

  return (
    <View style={styles.container}>
      {transcript ? (
        <>
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptTitle}>Transcript</Text>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
            <View style={styles.actionItemsContainer}>
              <Text style={styles.actionItemsTitle}>Action Items</Text>
              {renderActionItems()}
            </View>
          </ScrollView>
        </>
      ) : (
        <View style={styles.centeredMicContainer}>
          <Text style={styles.placeholder}>
            Tap the microphone to start recording
          </Text>
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonRecording,
              isProcessing && styles.micButtonDisabled,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.8}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <MaterialIcons
                name={isRecording ? 'stop' : 'mic'}
                size={80}
                color="#fff"
              />
            )}
          </TouchableOpacity>
          <Text style={styles.voicePlateLabelLarge}>
            {isProcessing
              ? 'Processing...'
              : isRecording
              ? 'Recording... Tap to stop'
              : 'Tap to record your voice'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 460, // extra space for floating button
  },
  placeholder: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 60,
    fontWeight: '500',
  },
  transcriptContainer: {
    marginBottom: 20,
  },
  transcriptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  actionItemsContainer: {
    marginTop: 20,
  },
  actionItemsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  category: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#4285F4',
  },
  actionItem: {
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  actionItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  nextStep: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginTop: 4,
  },
  centeredMicContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f8fa',
  },
  micButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4285F4', // Modern blue
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#ff5f6d', // Red-ish when recording
    shadowColor: '#ff5f6d',
  },
  micButtonDisabled: {
    opacity: 0.6,
  },
  voicePlateLabelLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
});
