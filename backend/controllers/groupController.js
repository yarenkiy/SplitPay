const groupService = require('../services/groupService');

// Create a new group and add creator as a member
exports.createGroup = async (req, res) => {
  try {
    const { name, description, color, members } = req.body;
    const userId = req.user.id;

    const result = await groupService.createGroup(name, description, color, members, userId);
    res.json(result);
  } catch (error) {
    console.error('createGroup error:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
};

// Add expense and split among group members
exports.addExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, description, paid_by, participants, custom_amounts, split_type, currency, currency_symbol } = req.body;
    const userId = req.user.id;

    const result = await groupService.addExpense(
      groupId, amount, description, paid_by, participants,
      custom_amounts, split_type, currency, currency_symbol, userId
    );
    
    res.json(result);
  } catch (error) {
    console.error('addExpense error:', error);
    if (error.message === 'Amount must be greater than 0' || error.message === 'No participants found') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to add expense' });
  }
};

// Migration: Fix participants_count for existing expenses
exports.fixParticipantsCount = async (req, res) => {
  try {
    const result = await groupService.fixParticipantsCount();
    res.json(result);
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ message: 'Migration failed' });
  }
};

// Get members of a group
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const members = await groupService.getGroupMembers(groupId, userId);
    res.json(members);
  } catch (error) {
    console.error('getGroupMembers error:', error);
    if (error.message === 'You are not a member of this group') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to fetch group members' });
  }
};

// Search users by name or email (partial, case-insensitive)
exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q || '';
    const users = await groupService.searchUsers(q);
    res.json(users);
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
};

// Join a group by invite code
exports.joinGroupByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    const result = await groupService.joinGroupByCode(inviteCode, userId);
    res.json(result);
  } catch (error) {
    console.error('joinGroupByCode error:', error);
    if (error.message === 'Invalid invite code') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Group not found with this code') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'You are already a member of this group') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to join group' });
  }
};

// Delete a group (only creator or member can delete)
exports.deleteGroup = async (req, res) => {
  try {
    console.log('🗑️  DELETE GROUP REQUEST RECEIVED');
    console.log('Params:', req.params);
    console.log('User ID:', req.user?.id);
    
    const { groupId } = req.params;
    const userId = req.user.id;

    const result = await groupService.deleteGroup(groupId, userId);
    res.json(result);
  } catch (error) {
    console.error('❌ deleteGroup error:', error);
    if (error.message === 'You are not a member of this group') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to delete group' });
  }
};

// Delete an expense/activity (only the user who created it or group member can delete)
exports.deleteExpense = async (req, res) => {
  try {
    console.log('🗑️  DELETE EXPENSE REQUEST RECEIVED');
    console.log('Params:', req.params);
    console.log('User ID:', req.user?.id);
    
    const { expenseId } = req.params;
    const userId = req.user.id;

    const result = await groupService.deleteExpense(expenseId, userId);
    res.json(result);
  } catch (error) {
    console.error('❌ deleteExpense error:', error);
    if (error.message === 'Expense not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'You are not a member of this group') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Expense not found or already deleted') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to delete expense' });
  }
};

// Get detailed group information
exports.getGroupDetails = async (req, res) => {
  console.log('🔵 getGroupDetails called - groupId:', req.params.groupId, 'userId:', req.user?.id);
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const result = await groupService.getGroupDetails(groupId, userId);
    res.json(result);
  } catch (error) {
    console.error('getGroupDetails error:', error);
    if (error.message === 'You are not a member of this group') {
      return res.status(403).json({ message: error.message });
    }
    if (error.message === 'Group not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to fetch group details' });
  }
};
