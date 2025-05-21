import { useClerk, useSignIn, useSSO } from "@clerk/clerk-expo";
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Configure the OAuth flow and ensure it completes
WebBrowser.maybeCompleteAuthSession();

// Warm up browser to improve user experience
const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    }
  }, []);
};

export default function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the browser warm-up hook
  useWarmUpBrowser();

  // Email/password sign-in
  const handleEmailSignIn = async () => {
    if (!isLoaded || !email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Start the sign-in process with email/password
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });
      
      if (signInAttempt.status === 'complete') {
        // Set the newly created session as active
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        // Need additional steps
        console.log("Sign-in needs more steps:", signInAttempt);
        setErrorMessage('Additional verification steps required. Please check your email.');
      }
    } catch (err: any) {
      console.error("Error signing in:", err);
      setErrorMessage(err.errors?.[0]?.message || 'Error signing in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth sign-in using the dedicated SSO hook
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      // Create a redirect URI
      const redirectUrl = makeRedirectUri({
        scheme: 'innatus',
        path: 'callback',
      });

      // Use the startSSOFlow method which handles the entire flow
      const { createdSessionId, setActive: setActiveSession, signIn: signInResource, signUp } = 
        await startSSOFlow({ strategy: 'oauth_google', redirectUrl });

      if (createdSessionId && setActiveSession) {
        // User was successfully authenticated
        await setActiveSession({ session: createdSessionId });
        router.replace("/(tabs)");
      } else if (signInResource?.status === 'needs_first_factor') {
        // Additional verification needed
        setErrorMessage('Additional verification needed. Please try email sign-in.');
      } else if (signUp?.status === 'missing_requirements') {
        // Required fields are missing
        setErrorMessage('Please complete sign-up with email instead.');
      } else {
        // Other issues
        console.log("SSO status:", { signIn: signInResource, signUp });
        setErrorMessage('Could not complete sign-in with Google. Please try email sign-in.');
      }
    } catch (err: any) {
      console.error("Error with Google sign-in:", err);
      setErrorMessage(err.errors?.[0]?.message || 'Error signing in with Google');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      
      {/* Email/Password Sign In */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={handleEmailSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Email</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>
      
      {/* Google Sign In */}
      <TouchableOpacity 
        style={[styles.button, styles.googleButton, isLoading && styles.disabledButton]} 
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push("/sign-up")} disabled={isLoading}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4285F4",
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleButton: {
    backgroundColor: "#DB4437",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  link: {
    color: "#4285F4",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 15,
  }
}); 