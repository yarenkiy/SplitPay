const pool = require('../models/db');

class NotesRepository {
  async checkMembership(groupId, userId) {
    const { rows } = await pool.query(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return rows.length > 0;
  }

  async getGroupNotes(groupId) {
    const { rows } = await pool.query(
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
    return rows;
  }

  async createNote(groupId, userId, text) {
    const result = await pool.query(
      'INSERT INTO notes (group_id, user_id, text, completed) VALUES (?, ?, ?, FALSE)',
      [groupId, userId, text]
    );
    return result.rows.insertId;
  }

  async getNoteById(noteId) {
    const { rows } = await pool.query(
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
    return rows[0] || null;
  }

  async findNoteForCheck(noteId) {
    const { rows } = await pool.query(
      'SELECT id, group_id, user_id, completed FROM notes WHERE id = ?',
      [noteId]
    );
    return rows[0] || null;
  }

  async updateNote(noteId, updates, values) {
    await pool.query(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteNote(noteId) {
    await pool.query('DELETE FROM notes WHERE id = ?', [noteId]);
  }

  async toggleNoteCompletion(noteId, newStatus) {
    await pool.query(
      'UPDATE notes SET completed = ? WHERE id = ?',
      [newStatus, noteId]
    );
  }
}

module.exports = new NotesRepository();

