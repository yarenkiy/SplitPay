const notesRepository = require('../repositories/notesRepository');

class NotesService {
  async getGroupNotes(groupId, userId) {
    // Check if user is a member of the group
    const isMember = await notesRepository.checkMembership(groupId, userId);

    if (!isMember) {
      throw new Error('You are not a member of this group');
    }

    const notes = await notesRepository.getGroupNotes(groupId);

    return {
      success: true,
      data: notes.map(note => ({
        id: note.id,
        groupId: note.group_id,
        userId: note.user_id,
        text: note.text,
        completed: note.completed === 1 || note.completed === true,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        createdByName: note.created_by_name
      }))
    };
  }

  async createNote(groupId, userId, text) {
    if (!text || !text.trim()) {
      throw new Error('Note text is required');
    }

    // Check if user is a member of the group
    const isMember = await notesRepository.checkMembership(groupId, userId);

    if (!isMember) {
      throw new Error('You are not a member of this group');
    }

    // Create the note
    const noteId = await notesRepository.createNote(groupId, userId, text.trim());

    // Get the created note with user info
    const note = await notesRepository.getNoteById(noteId);

    return {
      success: true,
      data: {
        id: note.id,
        groupId: note.group_id,
        userId: note.user_id,
        text: note.text,
        completed: note.completed === 1 || note.completed === true,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        createdByName: note.created_by_name
      }
    };
  }

  async updateNote(noteId, userId, text, completed) {
    // Check if note exists
    const note = await notesRepository.findNoteForCheck(noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    // Check if user is a member of the group
    const isMember = await notesRepository.checkMembership(note.group_id, userId);

    if (!isMember) {
      throw new Error('You do not have permission to update this note');
    }

    // Build update query
    const updates = [];
    const values = [];

    if (text !== undefined) {
      updates.push('text = ?');
      values.push(text.trim());
    }

    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(noteId);

    await notesRepository.updateNote(noteId, updates, values);

    // Get updated note
    const updatedNote = await notesRepository.getNoteById(noteId);

    return {
      success: true,
      data: {
        id: updatedNote.id,
        groupId: updatedNote.group_id,
        userId: updatedNote.user_id,
        text: updatedNote.text,
        completed: updatedNote.completed === 1 || updatedNote.completed === true,
        createdAt: updatedNote.created_at,
        updatedAt: updatedNote.updated_at,
        createdByName: updatedNote.created_by_name
      }
    };
  }

  async deleteNote(noteId, userId) {
    // Check if note exists
    const note = await notesRepository.findNoteForCheck(noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    // Check if user is a member of the group
    const isMember = await notesRepository.checkMembership(note.group_id, userId);

    if (!isMember) {
      throw new Error('You do not have permission to delete this note');
    }

    // Delete the note
    await notesRepository.deleteNote(noteId);

    return { success: true, message: 'Note deleted successfully' };
  }

  async toggleNoteCompletion(noteId, userId) {
    // Check if note exists
    const note = await notesRepository.findNoteForCheck(noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    // Check if user is a member of the group
    const isMember = await notesRepository.checkMembership(note.group_id, userId);

    if (!isMember) {
      throw new Error('You do not have permission to update this note');
    }

    // Toggle completion status
    const newStatus = !(note.completed === 1 || note.completed === true);
    
    await notesRepository.toggleNoteCompletion(noteId, newStatus);

    return {
      success: true,
      data: { completed: newStatus }
    };
  }
}

module.exports = new NotesService();

