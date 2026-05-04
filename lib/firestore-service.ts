'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  where,
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserRole {
  id?: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'TECHNICIAN';
  warehouse?: string | null;
  updatedAt?: any;
}

export interface Registration {
  id?: string;
  plate: string;
  warehouse: string;
  reason: string;
  technician: string;
  dot: string;
  tireFogo: string;
  lifeCycle: string;
  date: string;
  time: string;
  attachment?: string | null;
  attachmentData?: string | null;
  renovadoraAttachment?: string | null;
  renovadoraData?: string | null;
  status: 'pending' | 'confirmed';
  createdAt?: any;
}

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'userRoles'), (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRole)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'userRoles');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const setRole = async (email: string, role: string, warehouse: string | null = null) => {
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'userRoles', email), {
        email,
        role,
        warehouse,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `userRoles/${email}`);
    }
  };

  const removeRole = async (email: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'userRoles', email));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `userRoles/${email}`);
    }
  };

  return { roles, loading, setRole, removeRole };
}

export interface RolePermissions {
  id?: string;
  role: string;
  permissions: {
    viewDashboard: boolean;
    registerWithdrawal: boolean;
    accessAnalystPanel: boolean;
    confirmTechnicalWithdrawal: boolean;
    viewGeneralHistory: boolean;
    managePermissions: boolean;
    deleteRecords: boolean;
    importData: boolean;
  };
}

export function useRolePermissions() {
  const [roleConfigs, setRoleConfigs] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'rolePermissions'), (snapshot) => {
      setRoleConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RolePermissions)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rolePermissions');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updatePermission = async (roleId: string, permissionKey: string, value: boolean) => {
    try {
      const { setDoc, doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'rolePermissions', roleId);
      const existing = await getDoc(docRef);
      
      const currentPermissions = existing.exists() 
        ? existing.data().permissions 
        : {
            viewDashboard: false,
            registerWithdrawal: false,
            accessAnalystPanel: false,
            confirmTechnicalWithdrawal: false,
            viewGeneralHistory: false,
            managePermissions: false,
            deleteRecords: false,
            importData: false
          };

      await setDoc(docRef, {
        role: roleId,
        permissions: {
          ...currentPermissions,
          [permissionKey]: value
        }
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rolePermissions/${roleId}`);
    }
  };

  return { roleConfigs, loading, updatePermission };
}

export function useRegistrations(filterWarehouse: string | null = null) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
    
    if (filterWarehouse) {
      q = query(collection(db, 'registrations'), where('warehouse', '==', filterWarehouse), orderBy('createdAt', 'desc'));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      setRegistrations(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'registrations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterWarehouse]);

  const addRegistration = async (registration: Omit<Registration, 'id' | 'createdAt' | 'status'>) => {
    try {
      await addDoc(collection(db, 'registrations'), {
        ...registration,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    }
  };

  const confirmRegistration = async (id: string) => {
    try {
      await updateDoc(doc(db, 'registrations', id), {
        status: 'confirmed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${id}`);
    }
  };

  const deleteRegistration = async (id: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'registrations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registrations/${id}`);
    }
  };

  return { registrations, loading, addRegistration, confirmRegistration, deleteRegistration };
}

export interface AppSettings {
  logo?: string | null;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
      setLoading(false);
    }, (error) => {
      // It's fine if the document doesn't exist yet
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateLogo = async (logoData: string | null) => {
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'app'), {
        logo: logoData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/app');
    }
  };

  return { settings, loading, updateLogo };
}
