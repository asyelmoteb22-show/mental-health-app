// src/utils/database.js
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const dbFunctions = {
  // Add a document to a collection
  add: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp() // Firebase server timestamp
      });
      console.log('Document added with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding document:', error);
      return { success: false, error: error.message };
    }
  },

  // Get documents for a specific user
  getUserDocuments: async (collectionName, userId) => {
    try {
      const q = query(
        collection(db, collectionName), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, documents };
    } catch (error) {
      console.error('Error getting documents:', error);
      return { success: false, error: error.message, documents: [] };
    }
  },

  // Delete a document
  delete: async (collectionName, documentId) => {
    try {
      await deleteDoc(doc(db, collectionName, documentId));
      console.log('Document deleted:', documentId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }
  },

  // Update a document
  update: async (collectionName, documentId, data) => {
    try {
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      console.log('Document updated:', documentId);
      return { success: true };
    } catch (error) {
      console.error('Error updating document:', error);
      return { success: false, error: error.message };
    }
  }
};