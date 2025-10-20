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

  // Parse amount string that can contain comma or dot as decimal separator
  parseAmount(amountStr) {
    if (typeof amountStr === 'number') return amountStr;
    if (typeof amountStr !== 'string') return 0;
    
    // Replace comma with dot for consistent parsing
    const normalized = amountStr.replace(',', '.');
    return parseFloat(normalized) || 0;
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
    const totalAmount = this.parseAmount(amount);

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
      // Parse custom amounts to handle comma/dot decimal separators
      memberAmounts = {};
      Object.entries(customAmounts).forEach(([memberId, amount]) => {
        memberAmounts[memberId] = this.parseAmount(amount);
      });
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
        const shareAmount = this.parseAmount(memberAmounts[memberId] || 0);
        
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
      const amount = this.parseAmount(exp.amount);
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

    // Skip member shares calculation - only show total expenses
    
    // Skip my share calculation - only show total expenses
    
    // Calculate what the user actually PAID (their expenses) - only what they paid for others
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
    
    // Calculate what the user OWES (their individual share of all expenses)
    const myOwedExpensesByCurrency = {};
    uniqueExpenses.forEach((expense, key) => {
      const currency = expense.currency || 'TRY';
      const symbol = expense.symbol || '₺';
      
      // Check if this user participated in this expense
      const userAmount = expense.userAmounts[userId];
      if (userAmount !== undefined && userAmount > 0) {
        // This user owes money for this expense
        const positiveAmounts = expense.amounts.filter(amt => amt > 0);
        const negativeAmounts = expense.amounts.filter(amt => amt < 0);
        
        let userShare = 0;
        let calculationType = '';
        
        if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
          // Loan case - user owes the loan amount
          const loanAmount = Math.abs(negativeAmounts[0]);
          const otherMembers = members.filter(m => Number(m.id) !== Number(expense.paidBy));
          if (otherMembers.length === 1) {
            userShare = loanAmount;
          } else if (otherMembers.length > 1) {
            userShare = loanAmount / otherMembers.length;
          }
          calculationType = 'LOAN';
        } else if (positiveAmounts.length > 0) {
          // Shared expense case
          const sumPositives = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
          const participants = expense.participantsCount || (negativeAmounts.length > 0 ? positiveAmounts.length + 1 : positiveAmounts.length);
          
          if (negativeAmounts.length > 0 && participants > 1) {
            // Payer is a participant -> calculate user's share
            const totalExpense = (sumPositives * participants) / (participants - 1);
            userShare = totalExpense / participants;
          } else {
            // Payer not a participant -> user's share is their positive amount
            userShare = userAmount;
          }
          calculationType = 'SHARED EXPENSE';
        }
        
        if (userShare > 0) {
          if (!myOwedExpensesByCurrency[currency]) {
            myOwedExpensesByCurrency[currency] = { total: 0, symbol };
          }
          myOwedExpensesByCurrency[currency].total += userShare;
        }
      }
    });
    
    console.log('\n💳 My Owed Expenses (User', userId, '):', myOwedExpensesByCurrency);
    uniqueExpenses.forEach((expense, key) => {
      const currency = expense.currency || 'TRY';
      const userAmount = expense.userAmounts[userId];
      
      if (userAmount !== undefined && userAmount > 0) {
        const positiveAmounts = expense.amounts.filter(amt => amt > 0);
        const negativeAmounts = expense.amounts.filter(amt => amt < 0);
        
        let userShare = 0;
        let calculationType = '';
        
        if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
          const loanAmount = Math.abs(negativeAmounts[0]);
          const otherMembers = members.filter(m => Number(m.id) !== Number(expense.paidBy));
          if (otherMembers.length === 1) {
            userShare = loanAmount;
          } else if (otherMembers.length > 1) {
            userShare = loanAmount / otherMembers.length;
          }
          calculationType = 'LOAN';
        } else if (positiveAmounts.length > 0) {
          const sumPositives = positiveAmounts.reduce((sum, amt) => sum + amt, 0);
          const participants = expense.participantsCount || (negativeAmounts.length > 0 ? positiveAmounts.length + 1 : positiveAmounts.length);
          
          if (negativeAmounts.length > 0 && participants > 1) {
            const totalExpense = (sumPositives * participants) / (participants - 1);
            userShare = totalExpense / participants;
          } else {
            userShare = userAmount;
          }
          calculationType = 'SHARED EXPENSE';
        }
        
        if (userShare > 0) {
          console.log(`  ${key.split('-')[0]} (${calculationType}): ${userShare} ${currency}`);
        }
      }
    });
    
    // Skip my share display
    
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

    const expensesByCurrency = totalExpensesByCurrency;

    let totalExpenses = 0;
    Object.values(expensesByCurrency).forEach(curr => totalExpenses += curr.total);
    
    console.log('\n📈 FINAL SUMMARY:');
    console.log('  My Owed Expenses:', Object.values(myOwedExpensesByCurrency).reduce((sum, curr) => sum + curr.total, 0));
    console.log('  Total Group Expenses:', totalExpenses);
    console.log('=== END DEBUG ===\n');

    // Create balance matrix
// Logic: A owes B = (What B paid for A) - (What A paid for B)
const balanceMatrix = [];

// Track what each person paid FOR each other person, by currency
// Structure: paidForMatrix[payerId][beneficiaryId][currency] = amount
const paidForMatrix = {};

console.log('\n💰 === CALCULATING WHO PAID FOR WHOM ===');

uniqueExpenses.forEach((expense, key) => {
  const currency = expense.currency || 'TRY';
  const symbol = expense.symbol || '₺';
  const paidBy = Number(expense.paidBy);
  
  console.log(`\n📝 Expense: ${key.split('-')[0]}`);
  console.log(`   Paid by: User ${paidBy}`);
  console.log(`   Currency: ${currency}`);

  const positiveAmounts = expense.amounts.filter(a => a > 0);
  const negativeAmounts = expense.amounts.filter(a => a < 0);
  
  // Initialize paidBy's matrix if needed
  if (!paidForMatrix[paidBy]) {
    paidForMatrix[paidBy] = {};
  }

  // Handle LOAN case
  if (positiveAmounts.length === 0 && negativeAmounts.length > 0) {
    const loanAmount = Math.abs(negativeAmounts[0]);
    const otherMembers = members.filter(m => Number(m.id) !== paidBy);
    
    console.log(`   Type: LOAN`);
    console.log(`   Loan amount: ${loanAmount}`);
    console.log(`   Borrowers: ${otherMembers.length} members`);

    if (otherMembers.length === 1) {
      // Single borrower - they owe the full amount
      const borrowerId = Number(otherMembers[0].id);
      if (!paidForMatrix[paidBy][borrowerId]) {
        paidForMatrix[paidBy][borrowerId] = {};
      }
      if (!paidForMatrix[paidBy][borrowerId][currency]) {
        paidForMatrix[paidBy][borrowerId][currency] = { amount: 0, symbol };
      }
      paidForMatrix[paidBy][borrowerId][currency].amount += loanAmount;
      console.log(`   -> User ${paidBy} paid ${loanAmount} ${currency} for User ${borrowerId}`);
    } else if (otherMembers.length > 1) {
      // Multiple borrowers - split equally
      const splitAmount = loanAmount / otherMembers.length;
      otherMembers.forEach(m => {
        const borrowerId = Number(m.id);
        if (!paidForMatrix[paidBy][borrowerId]) {
          paidForMatrix[paidBy][borrowerId] = {};
        }
        if (!paidForMatrix[paidBy][borrowerId][currency]) {
          paidForMatrix[paidBy][borrowerId][currency] = { amount: 0, symbol };
        }
        paidForMatrix[paidBy][borrowerId][currency].amount += splitAmount;
        console.log(`   -> User ${paidBy} paid ${splitAmount} ${currency} for User ${borrowerId}`);
      });
    }
    return;
  }

  // Handle SHARED EXPENSE case
  console.log(`   Type: SHARED EXPENSE`);
  
  // Calculate what payer paid FOR each participant
  Object.entries(expense.userAmounts).forEach(([uid, amt]) => {
    const beneficiaryId = Number(uid);
    if (beneficiaryId === paidBy) return; // Skip payer themselves
    
    const owedAmount = this.parseAmount(amt);
    if (owedAmount <= 0) return;
    
    // Payer paid this amount FOR the beneficiary
    if (!paidForMatrix[paidBy][beneficiaryId]) {
      paidForMatrix[paidBy][beneficiaryId] = {};
    }
    if (!paidForMatrix[paidBy][beneficiaryId][currency]) {
      paidForMatrix[paidBy][beneficiaryId][currency] = { amount: 0, symbol };
    }
    paidForMatrix[paidBy][beneficiaryId][currency].amount += owedAmount;
    console.log(`   -> User ${paidBy} paid ${owedAmount} ${currency} for User ${beneficiaryId}`);
  });
});

console.log('\n💳 === PAID FOR MATRIX (Raw) ===');
Object.entries(paidForMatrix).forEach(([payerId, beneficiaries]) => {
  console.log(`User ${payerId} paid for:`);
  Object.entries(beneficiaries).forEach(([beneficiaryId, currencies]) => {
    Object.entries(currencies).forEach(([currency, data]) => {
      console.log(`  -> User ${beneficiaryId}: ${data.amount} ${currency}`);
    });
  });
});

// Now calculate net balances: A owes B = (B paid for A) - (A paid for B)
console.log('\n🔄 === CALCULATING NET BALANCES ===');
const processed = new Set();

members.forEach(memberA => {
  const idA = Number(memberA.id);
  
  members.forEach(memberB => {
    const idB = Number(memberB.id);
    if (idA >= idB) return; // Process each pair only once
    
    const pairKey = `${idA}_${idB}`;
    if (processed.has(pairKey)) return;
    processed.add(pairKey);
    
    // Get all currencies involved between these two users
    const currenciesInvolved = new Set();
    
    if (paidForMatrix[idA]?.[idB]) {
      Object.keys(paidForMatrix[idA][idB]).forEach(c => currenciesInvolved.add(c));
    }
    if (paidForMatrix[idB]?.[idA]) {
      Object.keys(paidForMatrix[idB][idA]).forEach(c => currenciesInvolved.add(c));
    }
    
    // Calculate net balance for each currency
    currenciesInvolved.forEach(currency => {
      const aPaidForB = paidForMatrix[idA]?.[idB]?.[currency]?.amount || 0;
      const bPaidForA = paidForMatrix[idB]?.[idA]?.[currency]?.amount || 0;
      
      // Net: positive means A owes B, negative means B owes A
      const net = bPaidForA - aPaidForB;
      
      console.log(`\nPair: User ${idA} vs User ${idB} (${currency})`);
      console.log(`  User ${idA} paid for User ${idB}: ${aPaidForB}`);
      console.log(`  User ${idB} paid for User ${idA}: ${bPaidForA}`);
      console.log(`  Net: ${net} (${net > 0 ? `User ${idA} owes User ${idB}` : `User ${idB} owes User ${idA}`})`);
      
      if (Math.abs(net) > 0.009) {
        const fromId = net > 0 ? idA : idB;
        const toId = net > 0 ? idB : idA;
        const amount = Math.round(Math.abs(net) * 100) / 100;
        const symbol = paidForMatrix[idA]?.[idB]?.[currency]?.symbol || 
                      paidForMatrix[idB]?.[idA]?.[currency]?.symbol || '₺';
        
        const fromName = members.find(m => Number(m.id) === fromId)?.name || `User ${fromId}`;
        const toName = members.find(m => Number(m.id) === toId)?.name || `User ${toId}`;
        
        balanceMatrix.push({
          from: fromName,
          to: toName,
          amount,
          currency,
          currencySymbol: symbol
        });
        
        console.log(`  ✅ Balance: ${fromName} owes ${toName} ${amount} ${currency}`);
      }
    });
  });
});

console.log('\n✅ === FINAL BALANCE MATRIX ===');
balanceMatrix.forEach(b => {
  console.log(`${b.from} owes ${b.to}: ${b.amount} ${b.currency}`);
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
          balance: this.parseAmount(m.balance)
        })),
        summary: {
          totalExpenses,
          memberCount: members.length,
          expenseCount: uniqueExpenses.size,
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

