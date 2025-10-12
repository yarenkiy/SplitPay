const notesService = require('../services/notesService');

// Get all notes for a group
exports.getGroupNotes = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const result = await notesService.getGroupNotes(groupId, userId);
    res.json(result);
  } catch (error) {
    console.error('getGroupNotes error:', error);
    if (error.message === 'You are not a member of this group') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const result = await notesService.createNote(groupId, userId, text);
    res.json(result);
  } catch (error) {
    console.error('createNote error:', error);
    if (error.message === 'Note text is required') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'You are not a member of this group') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create note' });
  }
};

// Update a note
exports.updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { text, completed } = req.body;
    const userId = req.user.id;

    const result = await notesService.updateNote(noteId, userId, text, completed);
    res.json(result);
  } catch (error) {
    console.error('updateNote error:', error);
    if (error.message === 'Note not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'You do not have permission to update this note') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'No fields to update') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to update note' });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    const result = await notesService.deleteNote(noteId, userId);
    res.json(result);
  } catch (error) {
    console.error('deleteNote error:', error);
    if (error.message === 'Note not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'You do not have permission to delete this note') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to delete note' });
  }
};

// Toggle note completion status
exports.toggleNoteCompletion = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    const result = await notesService.toggleNoteCompletion(noteId, userId);
    res.json(result);
  } catch (error) {
    console.error('toggleNoteCompletion error:', error);
    if (error.message === 'Note not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'You do not have permission to update this note') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to toggle note completion' });
  }
};
