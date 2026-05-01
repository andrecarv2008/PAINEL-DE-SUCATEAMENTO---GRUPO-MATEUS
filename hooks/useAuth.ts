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
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
        const { onSnapshot, getDoc, setDoc } = await import('firebase/firestore');
        const userEmail = user.email?.toLowerCase().trim() || '';
        
        if (!userEmail) {
          setLoading(false);
          return;
        }
        
        // Auto-initialize user role if it doesn't exist
        const checkAndInitRole = async () => {
          try {
            const roleDocRef = doc(db, 'userRoles', userEmail);
            const roleDocSnap = await getDoc(roleDocRef);
            
            if (!roleDocSnap.exists()) {
              await setDoc(roleDocRef, {
                email: userEmail,
                role: userEmail === ADMIN_EMAIL ? 'ADMIN' : 'TECHNICIAN',
                warehouse: null,
                displayName: user.displayName || userEmail.split('@')[0],
                createdAt: serverTimestamp()
              }, { merge: true });
            }
          } catch (error) {
            console.error("Error initializing user role:", error);
          }
        };

        checkAndInitRole();

        unsubscribeRole = onSnapshot(doc(db, 'userRoles', userEmail), (roleDoc) => {
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
                  TECHNICIAN: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: false, confirmTechnicalWithdrawal: false, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: false },
                  ANALYST: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: true, confirmTechnicalWithdrawal: true, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: true },
                  ADMIN: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: true, confirmTechnicalWithdrawal: true, viewGeneralHistory: true, managePermissions: true, deleteRecords: true, importData: true }
                };
                setPermissions(defaults[userRole] || null);
              }
              setLoading(false);
            });
          } else {
            // Hardcoded Admin fallback if doc creation is pending or fails
            if (userEmail === ADMIN_EMAIL) {
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
            } else {
              setRole('TECHNICIAN');
              setWarehouse(null);
              setPermissions({ viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: false, confirmTechnicalWithdrawal: false, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: false });
            }
            setLoading(false);
          }
        }, (error) => {
          console.error("Error fetching role:", error);
          setRole('TECHNICIAN');
          setWarehouse(null);
          setLoading(false);
        });
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
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with Email/Pass:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Initialize basic user metadata
      await setDoc(doc(db, 'userRoles', email.toLowerCase().trim()), {
        email: email.toLowerCase().trim(),
        role: 'TECHNICIAN',
        warehouse: null,
        displayName: name,
        createdAt: serverTimestamp()
      }, { merge: true });

      return userCredential.user;
    } catch (error) {
      console.error("Error signing up with Email/Pass:", error);
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

  return { user, role, warehouse, permissions, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout };
}
