const groupRepository = require('../repositories/groupRepository');

class GroupService {
  // Generate random 6-character alphanumeric code
  generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createGroup(name, description, color, members, userId) {
    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = this.generateInviteCode();
      isUnique = !(await groupRepository.findGroupByInviteCode(inviteCode));
    }

    // Create group
    const groupId = await groupRepository.createGroup(name, description, color, inviteCode, userId);

    // Add creator as member
    await groupRepository.addGroupMember(groupId, userId);

    // Optionally add additional members (excluding creator)
    if (Array.isArray(members) && members.length > 0) {
      const uniqueMemberIds = [...new Set(members.map((m) => Number(m)).filter((id) => id && id !== Number(userId)))];
      for (const memberId of uniqueMemberIds) {
        try {
          await groupRepository.addGroupMember(groupId, memberId);
        } catch (e) {
          // ignore duplicates or FK errors silently
        }
      }
    }

    return {
      id: groupId,
      name,
      description: description || null,
      color: color || '#6366F1',
      invite_code: inviteCode
    };
  }

  async addExpense(groupId, amount, description, paidBy, participants, customAmounts, splitType, currency, currencySymbol, userId) {
    const expenseCurrency = currency || 'TRY';
    const expenseCurrencySymbol = currencySymbol || '₺';

    // Basic validation
    if (!amount || Number(amount) <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const paidById = paidBy || userId;
    const totalAmount = parseFloat(amount);

    // Determine which members to split between
    let participantIds = participants;
    if (!participantIds || participantIds.length === 0) {
      // If no participants specified, use all group members
      const members = await groupRepository.getGroupMembers(groupId);
      participantIds = members.map(m => m.id);
    }

    if (participantIds.length === 0) {
      throw new Error('No participants found');
    }

    // Calculate amounts for each participant
    let memberAmounts = {};
    
    if (splitType === 'custom' && customAmounts) {
      memberAmounts = customAmounts;
    } else {
      // Equal split
      const splitAmount = totalAmount / participantIds.length;
      participantIds.forEach(id => {
        memberAmounts[id] = splitAmount;
      });
    }

    // Check if payer is among participants
    const payerIsParticipant = participantIds.some(id => parseInt(id) === paidById);
    const participantsCount = participantIds.length;

    // Check if this is a loan
    const isLoan = splitType === 'loan' || (participantIds.length === 1 && !payerIsParticipant);

    if (isLoan) {
      // Loan: Only create negative record for the payer (lender)
      console.log('Creating LOAN expense:', description, 'Amount:', totalAmount);
      
      await groupRepository.addExpense(
        groupId, paidById, paidById, -totalAmount,
        description, expenseCurrency, expenseCurrencySymbol, 1
      );
    } else {
      // Shared expense: Create records for all participants
      console.log('Creating SHARED expense:', description, 'Amount:', totalAmount, 'Participants:', participantIds.length);
      
      for (const participantId of participantIds) {
        const memberId = parseInt(participantId);
        const shareAmount = parseFloat(memberAmounts[memberId] || 0);
        
        if (shareAmount <= 0) continue;

        let memberAmount;
        
        if (memberId === paidById) {
          // Payer who is also participant: credit = paid amount - their share
          memberAmount = -(totalAmount - shareAmount);
        } else {
          // Others: debt = their share
          memberAmount = shareAmount;
        }

        await groupRepository.addExpense(
          groupId, memberId, paidById, memberAmount,
          description, expenseCurrency, expenseCurrencySymbol, participantsCount
        );
      }

      // If payer is NOT among participants, create a separate record for them
      if (!payerIsParticipant) {
        await groupRepository.addExpense(
          groupId, paidById, paidById, -totalAmount,
          description, expenseCurrency, expenseCurrencySymbol, participantsCount
        );
      }
    }

    return { message: 'Expense added successfully' };
  }

  async getGroupMembers(groupId, userId) {
    // Check if user is a member
    const isMember = await groupRepository.checkMembership(groupId, userId);
    if (!isMember) {
      throw new Error('You are not a member of this group');
    }

    return await groupRepository.getGroupMembers(groupId);
  }

  async searchUsers(query) {
    if (!query || !query.trim()) {
      return [];
    }
    return await groupRepository.searchUsers(query.trim());
  }

  async joinGroupByCode(inviteCode, userId) {
    if (!inviteCode || inviteCode.length !== 6) {
      throw new Error('Invalid invite code');
    }

    // Find group by invite code
    const group = await groupRepository.findGroupByInviteCodeFull(inviteCode);

    if (!group) {
      throw new Error('Group not found with this code');
    }

    // Check if user is already a member
    const isMember = await groupRepository.checkMembership(group.id, userId);

    if (isMember) {
      throw new Error('You are already a member of this group');
    }

    // Add user to group
    await groupRepository.addGroupMember(group.id, userId);

    return {
      success: true,
      message: `Successfully joined ${group.name}!`,
      group: {
        id: group.id,
        name: group.name,
        color: group.color
      }
    };
  }

  async deleteGroup(groupId, userId) {
    console.log(`Attempting to delete group ${groupId} by user ${userId}`);

    // Check if user is a member
    const isMember = await groupRepository.checkMembership(groupId, userId);

    if (!isMember) {
      throw new Error('You are not a member of this group');
    }

    // Delete all expenses, members, and the group
    await groupRepository.deleteExpenses(groupId);
    await groupRepository.deleteGroupMembers(groupId);
    await groupRepository.deleteGroup(groupId);

    console.log('✅ Group deleted successfully');
    return { success: true, message: 'Group deleted successfully' };
  }

  async deleteExpense(expenseId, userId) {
    console.log(`Attempting to delete expense ${expenseId} by user ${userId}`);

    // Get expense details
    const expense = await groupRepository.getExpenseById(expenseId);

    if (!expense) {
      throw new Error('Expense not found');
    }

    // Check if user is a member of the group
    const isMember = await groupRepository.checkMembership(expense.group_id, userId);

    if (!isMember) {
      throw new Error('You are not a member of this group');
    }

    // Delete ALL expenses with the same transaction
    const deletedCount = await groupRepository.deleteExpenseTransaction(
      expense.description,
      expense.paid_by,
      expense.created_at,
      expense.currency,
      expense.group_id
    );

    console.log(`✅ Deleted ${deletedCount} expense records`);
    
    if (deletedCount === 0) {
      throw new Error('Expense not found or already deleted');
    }

    return {
      success: true,
      message: 'Expense deleted successfully',
      deletedRecords: deletedCount
    };
  }

  async getGroupDetails(groupId, userId) {
    // Check if user is a member
    const isMember = await groupRepository.checkMembership(groupId, userId);

    if (!isMember) {
      throw new Error('You are not a member of this group');
    }

    const details = await groupRepository.getGroupDetails(groupId);

    if (!details) {
      throw new Error('Group not found');
    }

    // Calculate expenses and balances (complex business logic)
    const { group, members, expenses, recentExpenses } = details;

    console.log('\n🔍 === GROUP DETAILS DEBUG ===');
    console.log('Group:', group.name, '(ID:', group.id, ')');
    console.log('Members:', members.length);
    console.log('Total expense records:', expenses.length);
    
    // Calculate my expenses and total expenses by currency
    const myExpensesByCurrency = {};
    const totalExpensesByCurrency = {};
    
    const uniqueExpenses = new Map();
    const memberShares = {};

    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount);
      const currency = exp.currency || 'TRY';
      const symbol = exp.currency_symbol || '₺';
      const uid = exp.user_id;
      
      const expenseKey = `${exp.description}-${exp.paid_by}-${exp.created_at}-${currency}`;
      
      if (!uniqueExpenses.has(expenseKey)) {
        uniqueExpenses.set(expenseKey, {
          currency,
          symbol,
          paidBy: exp.paid_by,
          amounts: [],
          userAmounts: {},
          participantsCount: undefined // Will be calculated from amounts array
        });
      }
      const expense = uniqueExpenses.get(expenseKey);
      expense.amounts.push(amount);
      expense.userAmounts[uid] = amount;
      if (!expense.participantsCount && Number(exp.participants_count)) {
        expense.participantsCount = Number(exp.participants_count);
      }
    });

    // Calculate participants count from amounts array length
    uniqueExpenses.forEach((expense) => {
      expense.participantsCount = expense.amounts.length;
    });

    console.log('\n📊 Unique Expenses Count:', uniqueExpenses.size);
    console.log('📋 All Expense Keys:');
    uniqueExpenses.forEach((expense, key) => {
      console.log(`  Key: ${key}`);
      console.log(`    Amounts: [${expense.amounts.join(', ')}]`);
      console.log(`    User Amounts:`, expense.userAmounts);
      console.log(`    Participants Count: ${expense.participantsCount}`);
    });

    // Calculate member shares
    uniqueExpenses.forEach((expense, key) => {
      const positiveAmounts = expense.amounts.filter(amt => amt > 0);
      const negativeAmounts = expense.amounts.filter(amt => amt < 0);
      const payerId = expense.paidBy;

      // Loan case
      if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
        const loanAmount = Math.abs(negativeAmounts[0]);
        const otherMembers = members.filter(m => Number(m.id) !== Number(payerId));

        if (otherMembers.length === 1) {
          const borrowerId = otherMembers[0].id;
          if (!memberShares[borrowerId]) memberShares[borrowerId] = {};
          if (!memberShares[borrowerId][expense.currency]) memberShares[borrowerId][expense.currency] = { total: 0, symbol: expense.symbol };
          memberShares[borrowerId][expense.currency].total += loanAmount;
        } else if (otherMembers.length > 1) {
          const split = loanAmount / otherMembers.length;
          otherMembers.forEach(m => {
            if (!memberShares[m.id]) memberShares[m.id] = {};
            if (!memberShares[m.id][expense.currency]) memberShares[m.id][expense.currency] = { total: 0, symbol: expense.symbol };
            memberShares[m.id][expense.currency].total += split;
          });
        } else {
          Object.entries(expense.userAmounts).forEach(([uid, amount]) => {
            if (amount > 0) {
              if (!memberShares[uid]) memberShares[uid] = {};
              if (!memberShares[uid][expense.currency]) memberShares[uid][expense.currency] = { total: 0, symbol: expense.symbol };
              memberShares[uid][expense.currency].total += loanAmount;
            }
          });
        }
        return;
      }
      
      // Shared expense (payer included as participant)
      if (positiveAmounts.length > 0 && negativeAmounts.length > 0) {
        // Infer the real total using positives and participant count
        const sumPositives = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
        const participants = expense.participantsCount || (positiveAmounts.length + 1);
        const inferredTotal = participants > 1 ? (sumPositives * participants) / (participants - 1) : sumPositives;

        const avgShare = inferredTotal / participants;
        
        Object.entries(expense.userAmounts).forEach(([uid, amount]) => {
          const numericUid = Number(uid);
          if (!memberShares[numericUid]) memberShares[numericUid] = {};
          if (!memberShares[numericUid][expense.currency]) memberShares[numericUid][expense.currency] = { total: 0, symbol: expense.symbol };
          memberShares[numericUid][expense.currency].total += avgShare;
        });
      }
      
      // Only positive amounts (payer NOT a participant)
      if (positiveAmounts.length > 0 && negativeAmounts.length === 0) {
        const totalExpenseAmount = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
        const participantsCount = positiveAmounts.length;
        const avgShare = totalExpenseAmount / participantsCount;
        
        Object.entries(expense.userAmounts).forEach(([uid, amount]) => {
          if (amount > 0) {
            const numericUid = Number(uid);
            if (!memberShares[numericUid]) memberShares[numericUid] = {};
            if (!memberShares[numericUid][expense.currency]) memberShares[numericUid][expense.currency] = { total: 0, symbol: expense.symbol };
            memberShares[numericUid][expense.currency].total += avgShare;
          }
        });
      }
    });

    console.log('\n👥 Member Shares:', JSON.stringify(memberShares, null, 2));
    
    // Calculate logged-in user's expenses (their share)
    const myShareByCurrency = {};
    if (memberShares[userId]) {
      Object.entries(memberShares[userId]).forEach(([currency, data]) => {
        myShareByCurrency[currency] = data;
      });
    }
    
    // Calculate what the user actually PAID (their expenses)
    uniqueExpenses.forEach((expense, key) => {
      const paidBy = Number(expense.paidBy);
      if (paidBy === userId) {
        const currency = expense.currency || 'TRY';
        const symbol = expense.symbol || '₺';
        
        // Calculate the actual total amount of this expense
        const positiveAmounts = expense.amounts.filter(amt => amt > 0);
        const negativeAmounts = expense.amounts.filter(amt => amt < 0);
        
        let expenseTotal = 0;
        
        if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
          // Loan: Count as expense (amount that will be paid back)
          expenseTotal = Math.abs(negativeAmounts[0]);
        } else if (positiveAmounts.length > 0) {
          // Shared expense: infer full total from positive shares
          const sumPositives = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
          const participants = expense.participantsCount || (negativeAmounts.length > 0 ? positiveAmounts.length + 1 : positiveAmounts.length);
          if (negativeAmounts.length > 0 && participants > 1) {
            // Payer is a participant -> positives exclude payer's own share
            expenseTotal = (sumPositives * participants) / (participants - 1);
          } else {
            // Payer not a participant -> positives already sum to total
            expenseTotal = sumPositives;
          }
        } else if (negativeAmounts.length > 0) {
          // Fallback: use absolute sum of negative amounts
          expenseTotal = Math.abs(negativeAmounts.reduce((sum, amt) => sum + amt, 0));
        }
        
        if (!myExpensesByCurrency[currency]) {
          myExpensesByCurrency[currency] = { total: 0, symbol };
        }
        myExpensesByCurrency[currency].total += expenseTotal;
      }
    });
    
    console.log('\n💰 My Paid Expenses (User', userId, '):', myExpensesByCurrency);
    uniqueExpenses.forEach((expense, key) => {
      const paidBy = Number(expense.paidBy);
      if (paidBy === userId) {
        const currency = expense.currency || 'TRY';
        const positiveAmounts = expense.amounts.filter(amt => amt > 0);
        const negativeAmounts = expense.amounts.filter(amt => amt < 0);
        
        let expenseTotal = 0;
        let calculationType = '';
        
        if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
          expenseTotal = Math.abs(negativeAmounts[0]);
          calculationType = 'LOAN';
        } else if (positiveAmounts.length > 0) {
          const sumPositives = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
          const participants = expense.participantsCount || (negativeAmounts.length > 0 ? positiveAmounts.length + 1 : positiveAmounts.length);
          if (negativeAmounts.length > 0 && participants > 1) {
            expenseTotal = (sumPositives * participants) / (participants - 1);
          } else {
            expenseTotal = sumPositives;
          }
          calculationType = 'SHARED EXPENSE';
        } else if (negativeAmounts.length > 0) {
          expenseTotal = Math.abs(negativeAmounts.reduce((sum, amt) => sum + amt, 0));
          calculationType = 'FALLBACK';
        }
        
        console.log(`  ${key.split('-')[0]} (${calculationType}): ${expenseTotal} ${currency}`);
      }
    });
    
    console.log('\n💳 My Share (User', userId, '):', myShareByCurrency);
    
    // Calculate Total Expenses (each expense counted once, INCLUDING loans)
    // NOTE: Both LOANS and SHARED expenses count towards total expenses!
    uniqueExpenses.forEach((expense, key) => {
      const currency = expense.currency || 'TRY';
      const symbol = expense.symbol || '₺';
      
      // Calculate the actual total amount of this expense
      const positiveAmounts = expense.amounts.filter(amt => amt > 0);
      const negativeAmounts = expense.amounts.filter(amt => amt < 0);
      
      let expenseTotal = 0;
      let calculationType = '';
      let isLoan = false;
      
      if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
        // Loan: Count as expense (amount that will be paid back)
        expenseTotal = Math.abs(negativeAmounts[0]);
        calculationType = 'LOAN';
        isLoan = true;
      } else if (positiveAmounts.length > 0) {
        // Shared expense: infer full total from positive shares
        const sumPositives = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
        const participants = expense.participantsCount || (negativeAmounts.length > 0 ? positiveAmounts.length + 1 : positiveAmounts.length);
        if (negativeAmounts.length > 0 && participants > 1) {
          // Payer is a participant -> positives exclude payer's own share
          expenseTotal = (sumPositives * participants) / (participants - 1);
        } else {
          // Payer not a participant -> positives already sum to total
          expenseTotal = sumPositives;
        }
        calculationType = 'SHARED EXPENSE';
      } else if (negativeAmounts.length > 0) {
        // Fallback: use absolute sum of negative amounts
        expenseTotal = Math.abs(negativeAmounts.reduce((sum, amt) => sum + amt, 0));
        calculationType = 'FALLBACK';
      }
      
      console.log(`  ${key.split('-')[0]} (${calculationType}): ${expenseTotal} ${currency}`);
      
      // Add ALL expenses to total (both loans and shared)
      if (!totalExpensesByCurrency[currency]) {
        totalExpensesByCurrency[currency] = { total: 0, symbol };
      }
      totalExpensesByCurrency[currency].total += expenseTotal;
    });
    
    console.log('\n💵 Total Expenses by Currency:', totalExpensesByCurrency);

    const incomesByCurrency = myShareByCurrency;
    const expensesByCurrency = totalExpensesByCurrency;

    let totalIncome = 0;
    let totalExpenses = 0;
    Object.values(incomesByCurrency).forEach(curr => totalIncome += curr.total);
    Object.values(expensesByCurrency).forEach(curr => totalExpenses += curr.total);
    
    console.log('\n📈 FINAL SUMMARY:');
    console.log('  My Share (My portion):', totalIncome);
    console.log('  Total Group Expenses:', totalExpenses);
    console.log('=== END DEBUG ===\n');

    // Create balance matrix
    const balanceMatrix = [];
    const pairBalances = {};

    uniqueExpenses.forEach((expense) => {
      const currency = expense.currency || 'TRY';
      const symbol = expense.symbol || '₺';
      const paidBy = Number(expense.paidBy);

      const positiveAmounts = expense.amounts.filter(a => a > 0);
      const negativeAmounts = expense.amounts.filter(a => a < 0);

      if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
        const loanAmount = Math.abs(negativeAmounts[0]);
        const otherMembers = members.filter(m => Number(m.id) !== paidBy);

        if (otherMembers.length === 1) {
          const borrowerId = otherMembers[0].id;
          const key = `${borrowerId}_${paidBy}_${currency}`;
          if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
          pairBalances[key].amount += loanAmount;
        } else if (otherMembers.length > 1) {
          const split = loanAmount / otherMembers.length;
          otherMembers.forEach(m => {
            const key = `${m.id}_${paidBy}_${currency}`;
            if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
            pairBalances[key].amount += split;
          });
        } else {
          Object.entries(expense.userAmounts).forEach(([uid, amt]) => {
            if (amt > 0) {
              const key = `${uid}_${paidBy}_${currency}`;
              if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
              pairBalances[key].amount += loanAmount;
            }
          });
        }
        return;
      }

      Object.entries(expense.userAmounts).forEach(([uid, amt]) => {
        const numericUid = Number(uid);
        if (numericUid === paidBy) return;
        const owed = parseFloat(amt) > 0 ? parseFloat(amt) : 0;
        if (owed <= 0) return;
        const key = `${numericUid}_${paidBy}_${currency}`;
        if (!pairBalances[key]) pairBalances[key] = { amount: 0, symbol };
        pairBalances[key].amount += owed;
      });
    });

    // Net pair balances
    const processed = new Set();
    Object.keys(pairBalances).forEach(key => {
      if (processed.has(key)) return;
      const [fromIdStr, toIdStr, currency] = key.split('_');
      const reverseKey = `${toIdStr}_${fromIdStr}_${currency}`;

      const forward = pairBalances[key]?.amount || 0;
      const reverse = pairBalances[reverseKey]?.amount || 0;
      const net = forward - reverse;

      if (Math.abs(net) > 0.009) {
        const fromId = net > 0 ? fromIdStr : toIdStr;
        const toId = net > 0 ? toIdStr : fromIdStr;
        const amount = Math.round(Math.abs(net) * 100) / 100;
        const symbol = pairBalances[key]?.symbol || pairBalances[reverseKey]?.symbol || '₺';
        const fromName = (members.find(m => String(m.id) === String(fromId)) || {}).name || `User ${fromId}`;
        const toName = (members.find(m => String(m.id) === String(toId)) || {}).name || `User ${toId}`;

        balanceMatrix.push({
          from: fromName,
          to: toName,
          amount,
          currency,
          currencySymbol: symbol
        });
      }

      processed.add(key);
      processed.add(reverseKey);
    });

    return {
      success: true,
      data: {
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          color: group.color,
          inviteCode: group.invite_code,
          createdAt: group.created_at
        },
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          balance: parseFloat(m.balance)
        })),
        summary: {
          totalIncome,
          totalExpenses,
          netBalance: totalIncome - totalExpenses,
          memberCount: members.length,
          expenseCount: uniqueExpenses.size,
          incomesByCurrency,
          expensesByCurrency
        },
        balances: balanceMatrix,
        recentExpenses: Array.from(uniqueExpenses.entries()).map(([key, expense]) => {
          // Calculate the correct total amount for this expense
          const positiveAmounts = expense.amounts.filter(amt => amt > 0);
          const negativeAmounts = expense.amounts.filter(amt => amt < 0);
          
          let correctAmount = 0;
          let isLoan = false;
          
          if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
            // Loan: Count as expense (amount that will be paid back)
            correctAmount = Math.abs(negativeAmounts[0]);
            isLoan = true;
          } else if (positiveAmounts.length > 0) {
            // Shared expense: infer full total from positive shares
            const sumPositives = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
            const participants = expense.participantsCount || (negativeAmounts.length > 0 ? positiveAmounts.length + 1 : positiveAmounts.length);
            if (negativeAmounts.length > 0 && participants > 1) {
              // Payer is a participant -> positives exclude payer's own share
              correctAmount = (sumPositives * participants) / (participants - 1);
            } else {
              // Payer not a participant -> positives already sum to total
              correctAmount = sumPositives;
            }
          } else if (negativeAmounts.length > 0) {
            // Fallback: use absolute sum of negative amounts
            correctAmount = Math.abs(negativeAmounts.reduce((sum, amt) => sum + amt, 0));
          }
          
          // Get the first expense record for this unique expense to get metadata
          const firstExpenseRecord = expenses.find(exp => {
            const expenseKey = `${exp.description}-${exp.paid_by}-${exp.created_at}-${exp.currency || 'TRY'}`;
            return expenseKey === key;
          });
          
          return {
            id: firstExpenseRecord?.id || key,
            description: key.split('-')[0],
            amount: correctAmount,
            paidByName: firstExpenseRecord?.paid_by_name || 'Unknown',
            participants: expense.participantsCount || 1,
            createdAt: firstExpenseRecord?.created_at || new Date().toISOString(),
            currency: expense.currency || 'TRY',
            currencySymbol: expense.symbol || '₺',
            isLoan
          };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by date, newest first
      }
    };
  }

  async fixParticipantsCount() {
    const expenseGroups = await groupRepository.getAllExpenseGroups();
    
    console.log('Found expense groups:', expenseGroups);
    
    let totalUpdated = 0;
    
    for (const group of expenseGroups) {
      const affectedRows = await groupRepository.updateParticipantsCount(
        group.participant_count,
        group.description,
        group.paid_by,
        group.created_at,
        group.currency
      );
      
      totalUpdated += affectedRows;
      console.log(`Updated ${affectedRows} expenses for ${group.description} to participants_count = ${group.participant_count}`);
    }
    
    return {
      message: 'Migration completed!',
      totalUpdated,
      groupsProcessed: expenseGroups.length
    };
  }
}

module.exports = new GroupService();

