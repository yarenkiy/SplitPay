const express = require('express');
const router = express.Router();
const { 
  getGroupNotes, 
  createNote, 
  updateNote, 
  deleteNote,
  toggleNoteCompletion
} = require('../controllers/notesController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/group/:groupId', authenticateToken, getGroupNotes);
router.post('/group/:groupId', authenticateToken, createNote);
router.put('/:noteId', authenticateToken, updateNote);
router.delete('/:noteId', authenticateToken, deleteNote);
router.patch('/:noteId/toggle', authenticateToken, toggleNoteCompletion);

module.exports = router;

