import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { dashboardAPI, notesAPI } from '../src/services/api';

export default function NotesScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getUserGroups();
      if (response.data.success) {
        setGroups(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedGroup(response.data.data[0]);
          fetchNotes(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (groupId) => {
    try {
      const response = await notesAPI.getGroupNotes(groupId);
      if (response.data.success) {
        setNotes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Error', 'Please enter a note');
      return;
    }

    try {
      if (editingNote) {
        // Update existing note
        const response = await notesAPI.updateNote(editingNote.id, { text: noteText.trim() });
        if (response.data.success) {
          setNotes(notes.map(note => 
            note.id === editingNote.id 
              ? response.data.data
              : note
          ));
        }
        setEditingNote(null);
      } else {
        // Add new note
        const response = await notesAPI.createNote(selectedGroup.id, noteText.trim());
        if (response.data.success) {
          setNotes([response.data.data, ...notes]);
        }
      }

      setNoteText('');
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleToggleNote = async (noteId) => {
    try {
      const response = await notesAPI.toggleNoteCompletion(noteId);
      if (response.data.success) {
        setNotes(notes.map(note =>
          note.id === noteId
            ? { ...note, completed: response.data.data.completed }
            : note
        ));
      }
    } catch (error) {
      console.error('Error toggling note:', error);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteText(note.text);
    setModalVisible(true);
  };

  const handleDeleteNote = (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notesAPI.deleteNote(noteId);
              setNotes(notes.filter(note => note.id !== noteId));
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    fetchNotes(group.id);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notes & To-Do</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>Create a group to start adding notes</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notes & To-Do</Text>
        <TouchableOpacity 
          onPress={() => {
            setEditingNote(null);
            setNoteText('');
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Group Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.groupSelector}
        contentContainerStyle={styles.groupSelectorContent}
      >
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.groupChip,
              selectedGroup?.id === group.id && styles.groupChipActive
            ]}
            onPress={() => handleGroupChange(group)}
          >
            <View style={[styles.groupChipDot, { backgroundColor: group.color }]} />
            <Text style={[
              styles.groupChipText,
              selectedGroup?.id === group.id && styles.groupChipTextActive
            ]}>
              {group.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notes List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <View style={styles.emptyNotesContainer}>
            <Ionicons name="clipboard-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyNotesText}>No notes yet</Text>
            <Text style={styles.emptyNotesSubtext}>Tap + to add your first note</Text>
          </View>
        ) : (
          notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <TouchableOpacity 
                style={styles.noteCheckbox}
                onPress={() => handleToggleNote(note.id)}
              >
                <Ionicons 
                  name={note.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={note.completed ? "#10B981" : "#9CA3AF"} 
                />
              </TouchableOpacity>
              <View style={styles.noteContent}>
                <Text style={[
                  styles.noteText,
                  note.completed && styles.noteTextCompleted
                ]}>
                  {note.text}
                </Text>
              </View>
              <View style={styles.noteActions}>
                <TouchableOpacity 
                  onPress={() => handleEditNote(note)}
                  style={styles.noteActionButton}
                >
                  <Ionicons name="pencil" size={18} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteNote(note.id)}
                  style={styles.noteActionButton}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Note Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNote ? 'Edit Note' : 'Add Note'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Enter your note or task..."
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddNote}
            >
              <Text style={styles.saveButtonText}>
                {editingNote ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  groupSelector: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 50,
  },
  groupSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  groupChipActive: {
    backgroundColor: '#10B981',
  },
  groupChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  groupChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyNotesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyNotesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
  },
  emptyNotesSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteCheckbox: {
    marginRight: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  noteTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  noteActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  noteActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

