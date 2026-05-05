'use client';

import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'ANALYST' | 'TECHNICIAN' | null>(null);
  const [warehouse, setWarehouse] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = 'andreandersoncarvalhorocha1@gmail.com';

  useEffect(() => {
    let unsubscribeRole: (() => void) | undefined;
    let unsubscribePerms: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (unsubscribeRole) unsubscribeRole();
      if (unsubscribePerms) unsubscribePerms();

      if (user) {
        if (user.email === ADMIN_EMAIL) {
          setRole('ADMIN');
          setWarehouse(null);
          setPermissions({
            viewDashboard: true,
            registerWithdrawal: true,
            accessAnalystPanel: true,
            confirmTechnicalWithdrawal: true,
            viewGeneralHistory: true,
            managePermissions: true,
            deleteRecords: true,
            importData: true
          });
          setLoading(false);
        } else {
          const { onSnapshot } = await import('firebase/firestore');
          unsubscribeRole = onSnapshot(doc(db, 'userRoles', user.email || ''), (roleDoc) => {
            if (roleDoc.exists()) {
              const userRole = roleDoc.data().role as any;
              const userWarehouse = roleDoc.data().warehouse || null;
              setRole(userRole);
              setWarehouse(userWarehouse);
              
              if (unsubscribePerms) unsubscribePerms();
              unsubscribePerms = onSnapshot(doc(db, 'rolePermissions', userRole), (permDoc) => {
                if (permDoc.exists()) {
                  setPermissions(permDoc.data().permissions);
                } else {
                  // Fallback defaults
                  const defaults: any = {
                    TECHNICIAN: { viewDashboard: false, registerWithdrawal: true, accessAnalystPanel: false, confirmTechnicalWithdrawal: false, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: false },
                    ANALYST: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: true, confirmTechnicalWithdrawal: true, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: true }
                  };
                  setPermissions(defaults[userRole] || null);
                }
                setLoading(false);
              });
            } else {
              setRole('TECHNICIAN');
              setWarehouse(null);
              setPermissions({ viewDashboard: false, registerWithdrawal: true, accessAnalystPanel: false, confirmTechnicalWithdrawal: false, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: false });
              setLoading(false);
            }
          }, (error) => {
            console.error("Error fetching role:", error);
            setRole('TECHNICIAN');
            setWarehouse(null);
            setLoading(false);
          });
        }
      } else {
        setRole(null);
        setWarehouse(null);
        setPermissions(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRole) unsubscribeRole();
      if (unsubscribePerms) unsubscribePerms();
    };
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Try popup first
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      // If popup is blocked, we can't easily auto-fallback to redirect in this environment 
      // without proper redirect URL configuration, so we throw to let the UI handle it.
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up bloqueado pelo navegador. Por favor, permita pop-ups para este site.');
      }
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with Email/Password:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Initialize internal role (defaults to TECHNICIAN)
      await setDoc(doc(db, 'userRoles', email), {
        email: email,
        name: name,
        role: 'TECHNICIAN',
        warehouse: null,
        createdAt: new Date().toISOString()
      });

      return userCredential.user;
    } catch (error) {
      console.error("Error signing up with Email/Password:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error sending password reset:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { 
    user, 
    role, 
    warehouse, 
    permissions, 
    loading, 
    loginWithGoogle, 
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    logout 
  };
}
