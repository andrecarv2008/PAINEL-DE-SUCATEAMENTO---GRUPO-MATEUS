'use client';

import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
                    TECHNICIAN: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: false, confirmTechnicalWithdrawal: false, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: false },
                    ANALYST: { viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: true, confirmTechnicalWithdrawal: true, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: true }
                  };
                  setPermissions(defaults[userRole] || null);
                }
                setLoading(false);
              });
            } else {
              setRole('TECHNICIAN');
              setWarehouse(null);
              setPermissions({ viewDashboard: true, registerWithdrawal: true, accessAnalystPanel: false, confirmTechnicalWithdrawal: false, viewGeneralHistory: true, managePermissions: false, deleteRecords: false, importData: false });
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
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { user, role, warehouse, permissions, loading, loginWithGoogle, logout };
}
