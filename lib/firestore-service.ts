'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  where,
  getDocs,
  getDoc,
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
  removalDate?: string | null;
  attachment?: string | null;
  attachmentData?: string | null;
  renovadoraAttachment?: string | null;
  renovadoraData?: string | null;
  userEmail?: string | null;
  status: 'pending' | 'confirmed';
  createdAt?: any;
}

export function useUserRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'userRoles'));
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRole)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'userRoles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
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
      await fetchRoles();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `userRoles/${email}`);
    }
  };

  const removeRole = async (email: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'userRoles', email));
      await fetchRoles();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `userRoles/${email}`);
    }
  };

  return { roles, loading, setRole, removeRole, refresh: fetchRoles };
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

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'rolePermissions'));
      setRoleConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RolePermissions)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'rolePermissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
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
      await fetchPermissions();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rolePermissions/${roleId}`);
    }
  };

  return { roleConfigs, loading, updatePermission, refresh: fetchPermissions };
}

export function useRegistrations(filterWarehouse: string | null = null) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      let q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
      
      if (filterWarehouse) {
        q = query(collection(db, 'registrations'), where('warehouse', '==', filterWarehouse), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      setRegistrations(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filterWarehouse]);

  const addRegistration = async (registration: Omit<Registration, 'id' | 'createdAt' | 'status'>) => {
    try {
      await addDoc(collection(db, 'registrations'), {
        ...registration,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      await fetchRegistrations();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    }
  };

  const confirmRegistration = async (id: string) => {
    try {
      await updateDoc(doc(db, 'registrations', id), {
        status: 'confirmed'
      });
      await fetchRegistrations();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registrations/${id}`);
    }
  };

  const deleteRegistration = async (id: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'registrations', id));
      await fetchRegistrations();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registrations/${id}`);
    }
  };

  return { registrations, loading, addRegistration, confirmRegistration, deleteRegistration, refresh: fetchRegistrations };
}

export interface AppSettings {
  logo?: string | null;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const snapshot = await getDoc(doc(db, 'settings', 'app'));
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    } catch (error) {
      // It's fine if the document doesn't exist
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateLogo = async (logoData: string | null) => {
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'app'), {
        logo: logoData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await fetchSettings();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/app');
    }
  };

  return { settings, loading, updateLogo, refresh: fetchSettings };
}
