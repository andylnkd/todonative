import { useClerk, useSignUp, useSSO } from "@clerk/clerk-expo";
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

export default function SignUpScreen() {
  const { signUp, isLoaded } = useSignUp();
  const { setActive } = useClerk();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the browser warm-up hook
  useWarmUpBrowser();

  // Handle sign up with email/password
  const handleSignUp = async () => {
    if (!isLoaded || !email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Start the sign-up process
      await signUp.create({
        emailAddress: email,
        password,
        username: username || undefined,
      });
      
      // Send user a verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Show verification screen
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Error signing up:", err);
      setErrorMessage(err.errors?.[0]?.message || 'Error signing up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth sign-up using the dedicated SSO hook
  const handleGoogleSignUp = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      // Create a redirect URI
      const redirectUrl = makeRedirectUri({
        scheme: 'innatus',
        path: 'callback',
      });

      // Use the startSSOFlow method which handles the entire flow
      const { createdSessionId, setActive: setActiveSession, signIn, signUp: signUpResource } = 
        await startSSOFlow({ strategy: 'oauth_google', redirectUrl });

      if (createdSessionId && setActiveSession) {
        // User was successfully authenticated
        await setActiveSession({ session: createdSessionId });
        router.replace("/(tabs)");
      } else if (signUpResource?.status === 'missing_requirements') {
        // Required fields are missing
        setErrorMessage('Additional information needed. Please use email sign-up.');
      } else if (signIn?.status === 'needs_first_factor') {
        // Additional verification needed
        setErrorMessage('Account exists. Please use the sign-in screen.');
        setTimeout(() => router.push("/sign-in"), 2000);
      } else {
        // Other issues
        console.log("SSO status:", { signIn, signUp: signUpResource });
        setErrorMessage('Could not complete sign-up with Google. Please try email sign-up.');
      }
    } catch (err: any) {
      console.error("Error with Google sign-up:", err);
      setErrorMessage(err.errors?.[0]?.message || 'Error signing up with Google');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Handle verification code submission
  const handleVerification = async () => {
    if (!isLoaded || !verificationCode) {
      setErrorMessage('Please enter the verification code sent to your email');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Attempt to verify the email address with the code
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });
      
      if (result.status === 'complete') {
        // Set the newly created session as active
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        console.log("Verification incomplete:", result);
        setErrorMessage('Verification incomplete. Please check your email again.');
      }
    } catch (err: any) {
      console.error("Error verifying email:", err);
      setErrorMessage(err.errors?.[0]?.message || 'Error verifying email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the verification form if email is being verified
  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verify Your Email</Text>
        
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        
        <Text style={styles.subtitle}>
          We've sent a verification code to {email}
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Verification Code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          editable={!isLoading}
        />
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={handleVerification}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Email</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setPendingVerification(false)} disabled={isLoading}>
          <Text style={styles.link}>Back to sign up</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render the sign up form
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      
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
        placeholder="Username (optional)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
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
        onPress={handleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign up with Email</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <TouchableOpacity 
        style={[styles.button, styles.googleButton, isLoading && styles.disabledButton]} 
        onPress={handleGoogleSignUp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign up with Google</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push("/sign-in")} disabled={isLoading}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
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
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
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