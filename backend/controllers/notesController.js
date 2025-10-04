const pool = require('../models/db');

// Get all notes for a group
exports.getGroupNotes = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the group
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Get all notes for the group
    const result = await pool.query(
      `SELECT 
        n.id,
        n.group_id,
        n.user_id,
        n.text,
        n.completed,
        n.created_at,
        n.updated_at,
        u.name as created_by_name
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.group_id = ?
      ORDER BY n.created_at DESC`,
      [groupId]
    );

    res.json({
      success: true,
      data: result.rows.map(note => ({
        id: note.id,
        groupId: note.group_id,
        userId: note.user_id,
        text: note.text,
        completed: note.completed === 1 || note.completed === true,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        createdByName: note.created_by_name
      }))
    });
  } catch (error) {
    console.error('getGroupNotes error:', error);
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
};

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    // Check if user is a member of the group
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Create the note
    const result = await pool.query(
      'INSERT INTO notes (group_id, user_id, text, completed) VALUES (?, ?, ?, FALSE)',
      [groupId, userId, text.trim()]
    );

    const noteId = result.rows.insertId;

    // Get the created note with user info
    const noteResult = await pool.query(
      `SELECT 
        n.id,
        n.group_id,
        n.user_id,
        n.text,
        n.completed,
        n.created_at,
        n.updated_at,
        u.name as created_by_name
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.id = ?`,
      [noteId]
    );

    const note = noteResult.rows[0];

    res.json({
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
    });
  } catch (error) {
    console.error('createNote error:', error);
    res.status(500).json({ message: 'Failed to create note' });
  }
};

// Update a note
exports.updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { text, completed } = req.body;
    const userId = req.user.id;

    // Check if note exists and user owns it
    const noteCheck = await pool.query(
      'SELECT id, group_id, user_id FROM notes WHERE id = ?',
      [noteId]
    );

    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = noteCheck.rows[0];

    // Check if user is the owner or a member of the group
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [note.group_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to update this note' });
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
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(noteId);

    await pool.query(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated note
    const updatedNote = await pool.query(
      `SELECT 
        n.id,
        n.group_id,
        n.user_id,
        n.text,
        n.completed,
        n.created_at,
        n.updated_at,
        u.name as created_by_name
      FROM notes n
      JOIN users u ON n.user_id = u.id
      WHERE n.id = ?`,
      [noteId]
    );

    const result = updatedNote.rows[0];

    res.json({
      success: true,
      data: {
        id: result.id,
        groupId: result.group_id,
        userId: result.user_id,
        text: result.text,
        completed: result.completed === 1 || result.completed === true,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        createdByName: result.created_by_name
      }
    });
  } catch (error) {
    console.error('updateNote error:', error);
    res.status(500).json({ message: 'Failed to update note' });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    // Check if note exists and user owns it
    const noteCheck = await pool.query(
      'SELECT id, group_id, user_id FROM notes WHERE id = ?',
      [noteId]
    );

    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = noteCheck.rows[0];

    // Check if user is the owner or a member of the group
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [note.group_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to delete this note' });
    }

    // Delete the note
    await pool.query('DELETE FROM notes WHERE id = ?', [noteId]);

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('deleteNote error:', error);
    res.status(500).json({ message: 'Failed to delete note' });
  }
};

// Toggle note completion status
exports.toggleNoteCompletion = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.id;

    // Check if note exists
    const noteCheck = await pool.query(
      'SELECT id, group_id, completed FROM notes WHERE id = ?',
      [noteId]
    );

    if (noteCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = noteCheck.rows[0];

    // Check if user is a member of the group
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [note.group_id, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'You do not have permission to update this note' });
    }

    // Toggle completion status
    const newStatus = !(note.completed === 1 || note.completed === true);
    
    await pool.query(
      'UPDATE notes SET completed = ? WHERE id = ?',
      [newStatus, noteId]
    );

    res.json({ 
      success: true, 
      data: { completed: newStatus }
    });
  } catch (error) {
    console.error('toggleNoteCompletion error:', error);
    res.status(500).json({ message: 'Failed to toggle note completion' });
  }
};

