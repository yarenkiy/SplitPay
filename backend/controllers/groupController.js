const pool = require('../models/db');

exports.createGroup = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;
  const group = await pool.query(
    'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
    [name, userId]
  );
  await pool.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
    [group.rows[0].id, userId]);
  res.json(group.rows[0]);
};

exports.addExpense = async (req, res) => {
  const { groupId } = req.params;
  const { title, amount, paid_by, participants } = req.body;
  const result = await pool.query(
    'INSERT INTO expenses (group_id, title, total_amount, paid_by) VALUES ($1, $2, $3, $4) RETURNING id',
    [groupId, title, amount, paid_by]
  );
  const expenseId = result.rows[0].id;

  for (const p of participants) {
    await pool.query(
      'INSERT INTO expense_participants (expense_id, user_id, share_amount) VALUES ($1, $2, $3)',
      [expenseId, p.user_id, p.share]
    );
  }

  res.json({ message: 'Expense added', expenseId });
};
