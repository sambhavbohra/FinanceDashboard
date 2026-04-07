const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');

// Helper to calculate total group balances for a user
const calculateGroupBalances = async (userId) => {
  const expenses = await GroupExpense.find({
    $or: [{ 'payers.user': userId }, { 'splits.user': userId }]
  }).populate('payers.user splits.user');

  const balances = {}; // userId -> amount

  expenses.forEach(exp => {
    // Amount paid by this user for others
    const myContribution = exp.payers.find(p => p.user?._id?.toString() === userId.toString())?.amount || 0;
    
    // Amount this user owes for this expense
    const mySplit = exp.splits.find(s => s.user?._id?.toString() === userId.toString());
    const myShare = mySplit?.amount || 0;
    const isPaid = mySplit?.paid || false;

    // We only care about UNPAID splits for basic balance
    // This is a simplified calculation: 
    // Net = Total Paid by Me - My Share - Sum(Splits owed to me that are already paid?) 
    // Actually, easier to track per person.
  });
  // ... existing complex logic remains in routes
};

// Create group (already handles private friends via unique names)
router.post('/', auth, async (req, res) => {
  try {
    const { name, members, memberIds, isPrivate, emoji } = req.body;
    const allMembers = [...new Set([...(members || memberIds || []), req.user.userId])];
    const group = new Group({
      name,
      members: allMembers, // Ensure unique members
      createdBy: req.user.userId,
      isPrivate,
      emoji: emoji || '📁'
    });
    await group.save();
    res.status(201).json(await group.populate('members createdBy'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update group details
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name, emoji, members } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    if (group.createdBy.toString() !== req.user.userId) {
       return res.status(403).json({ message: 'Only creator can edit group details' });
    }

    if (name) group.name = name;
    if (emoji) group.emoji = emoji;
    if (members) group.members = [...new Set([...members, req.user.userId])];

    await group.save();
    res.json(await Group.findById(group._id).populate('members createdBy'));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get User's Groups (Filter out private 1-on-1 groups)
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ 
      members: req.user.userId,
      isPrivate: { $ne: true } 
    }).populate('members createdBy');
    res.json(groups);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Create Test Friend (Phantom user)
router.post('/:id/test-friends', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Check if user is member
    if (!group.members.includes(req.user.userId)) {
       return res.status(403).json({ message: 'Only members can add test friends' });
    }

    // Create shadow user
    const shadowEmail = `test_friend_${crypto.randomBytes(8).toString('hex')}@fintrack.local`;
    const shadowUser = new User({
       name: req.body.name,
       email: shadowEmail,
       isTest: true,
       profileComplete: true
    });
    await shadowUser.save();

    group.members.push(shadowUser._id);
    await group.save();

    res.json(shadowUser);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add Expense to Group
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId).populate('members');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const expense = new GroupExpense({
      ...req.body,
      group: groupId
    });
    await expense.save();

    // Determine name format: "Split - Name" for 1-on-1, or "Split: Desc" for group
    let txName = `Split: ${expense.description}`;
    if (group.isPrivate && group.members.length === 2) {
       const otherMember = group.members.find(m => m._id.toString() !== req.user.userId);
       const otherName = otherMember ? otherMember.name.split(' ')[0] : 'Friend';
       txName = `Split - ${otherName}`;
    }

    // SYNC LOGIC: 
    // 1. For Payer(s): Add an expense ONLY for the money that actually Left their wallet
    const myPayment = req.body.payers.find(p => p.user === req.user.userId);
    if (myPayment) {
       const personalTx = new Transaction({
          user: req.user.userId,
          name: txName, // "Split - FriendName"
          amount: myPayment.amount,
          type: 'expense',
          category: 'Split',
          date: expense.date || new Date()
       });
       await personalTx.save();
    }

    // 2. For Splitter(s) who are NOT payers: 
    // We DO NOT add a transaction yet. Their "Debt Matrix" will reflect what they owe.
    // They will get an 'expense' transaction only when they actually PAY (Settle).

    const populated = await GroupExpense.findById(expense._id).populate('payers.user splits.user');
    res.status(201).json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get Single Group
router.get('/:id', auth, async (req, res) => {
   try {
      const group = await Group.findById(req.params.id).populate('members createdBy');
      if (!group) return res.status(404).json({ message: 'Group not found' });
      res.json(group);
   } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get Group Expenses
router.get('/:id/expenses', auth, async (req, res) => {
   try {
      const expenses = await GroupExpense.find({ group: req.params.id })
         .populate('payers.user splits.user')
         .sort({ date: -1 });
      res.json(expenses);
   } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete Group Expense
router.delete('/:groupId/expenses/:expenseId', auth, async (req, res) => {
   try {
     const expense = await GroupExpense.findById(req.params.expenseId).populate('group');
     if (!expense) return res.status(404).json({ message: 'Expense not found' });
     
     const amIPayer = expense.payers.some(p => p.user?.toString() === req.user.userId);
     const isOwner = expense.group.createdBy.toString() === req.user.userId;
     if (!amIPayer && !isOwner) {
        return res.status(403).json({ message: 'Only payers or group owner can delete splits' });
     }

     await GroupExpense.findByIdAndDelete(req.params.expenseId);
     res.json({ message: 'Expense deleted' });
   } catch (err) {
      res.status(500).json({ message: err.message });
   }
});

// Update Group Expense
router.put('/:groupId/expenses/:expenseId', auth, async (req, res) => {
   try {
     const expense = await GroupExpense.findById(req.params.expenseId).populate('group');
     if (!expense) return res.status(404).json({ message: 'Expense not found' });
     
     // Ensure user is authorized to edit it (creator of group, or was an original payer, or new payer)
     const amIPayer = expense.payers.some(p => p.user?.toString() === req.user.userId);
     const isOwner = expense.group.createdBy.toString() === req.user.userId;
     if (!amIPayer && !isOwner) {
        return res.status(403).json({ message: 'Only payers or group owner can edit splits' });
     }

     const updated = await GroupExpense.findByIdAndUpdate(
        req.params.expenseId,
        {
           description: req.body.description,
           totalAmount: req.body.totalAmount,
           category: req.body.category,
           date: req.body.date,
           payers: req.body.payers,
           splits: req.body.splits
        },
        { new: true }
     ).populate('payers.user splits.user');

     res.json(updated);
   } catch (err) {
      res.status(500).json({ message: err.message });
   }
});

// Mark Split as Settled (Received)
router.patch('/:groupId/expenses/:expenseId/settle', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const expense = await GroupExpense.findById(req.params.expenseId).populate('payers.user group');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const amIPayer = expense.payers.some(p => p.user?._id?.toString() === req.user.userId);
    const isOwner = expense.group.createdBy.toString() === req.user.userId;
    
    if (!amIPayer && !isOwner) {
       return res.status(403).json({ message: 'Only the receiver or group owner can settle splits' });
    }

    const split = expense.splits.find(s => s.user.toString() === userId);
    if (split && !split.paid) {
       split.paid = true;
       await expense.save();

        const receiver = await User.findById(userId);
        const sender = await User.findById(req.user.userId);

        const incomeTx = new Transaction({
           user: req.user.userId,
           name: `Split - ${receiver ? receiver.name.split(' ')[0] : 'Friend'}`,
           amount: split.amount,
           type: 'income',
           category: 'Split',
           date: new Date()
        });
        await incomeTx.save();

        if (receiver && !receiver.isTest) {
           const repaymentTx = new Transaction({
              user: userId,
              name: `Split - ${sender ? sender.name.split(' ')[0] : 'Friend'}`,
              amount: split.amount,
              type: 'expense',
              category: 'Split',
              date: new Date()
           });
           await repaymentTx.save();
        }
    }
    
    const populated = await GroupExpense.findById(expense._id).populate('payers.user splits.user');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Settle All with User across all groups
router.post('/settle-with/:otherUserId', auth, async (req, res) => {
   try {
      const myId = req.user.userId;
      const otherId = req.params.otherUserId;

      // Find expenses where I am payer and other owes me (unpaid)
      const expensesMePayer = await GroupExpense.find({
         'payers.user': myId,
         'splits': { $elemMatch: { user: otherId, paid: false } }
      });

      // Find expenses where other is payer and I owe them (unpaid)
      const expensesOtherPayer = await GroupExpense.find({
         'payers.user': otherId,
         'splits': { $elemMatch: { user: myId, paid: false } }
      });

      // Nothing to settle
      if (expensesMePayer.length === 0 && expensesOtherPayer.length === 0) {
         return res.json({ success: true, meOwed: 0, otherOwed: 0, netDelta: 0 });
      }

      let amountOtherOwesMe = 0; // Other user owes me this much
      let amountIOweOther = 0;   // I owe other user this much

      for (const exp of expensesMePayer) {
         const split = exp.splits.find(s => s.user.toString() === otherId);
         if (split && !split.paid) {
            split.paid = true;
            amountOtherOwesMe += split.amount;
            await exp.save();
         }
      }

      for (const exp of expensesOtherPayer) {
         const split = exp.splits.find(s => s.user.toString() === myId);
         if (split && !split.paid) {
            split.paid = true;
            amountIOweOther += split.amount;
            await exp.save();
         }
      }

      const other = await User.findById(otherId);
      const me = await User.findById(myId);
      const netDelta = amountOtherOwesMe - amountIOweOther;

      if (netDelta > 0) {
         // I am net receiver (Incoming money)
         await Transaction.create({
            user: myId,
            name: `Settle: ${other?.name.split(' ')[0] || 'Friend'}`,
            amount: Math.abs(netDelta),
            type: 'income',
            category: 'Split',
            date: new Date()
         });
         
         if (other && !other.isTest) {
            await Transaction.create({
               user: otherId,
               name: `Settle: ${me?.name.split(' ')[0] || 'Friend'}`,
               amount: Math.abs(netDelta),
               type: 'expense',
               category: 'Split',
               date: new Date()
            });
         }
      } else if (netDelta < 0) {
         // I am net payer (Outgoing money)
         await Transaction.create({
            user: myId,
            name: `Settle: ${other?.name.split(' ')[0] || 'Friend'}`,
            amount: Math.abs(netDelta),
            type: 'expense',
            category: 'Split',
            date: new Date()
         });

         if (other && !other.isTest) {
            await Transaction.create({
               user: otherId,
               name: `Settle: ${me?.name.split(' ')[0] || 'Friend'}`,
               amount: Math.abs(netDelta),
               type: 'income',
               category: 'Split',
               date: new Date()
            });
         }
      }

      res.json({ success: true, meOwed: amountOtherOwesMe, otherOwed: amountIOweOther, netDelta });
   } catch (err) { 
      console.error('Settle error:', err);
      res.status(500).json({ message: err.message }); 
   }
});

// Delete Group
router.delete('/:id', auth, async (req, res) => {
   try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      
      const isMember = group.members.some(m => m.toString() === req.user.userId);
      const isCreator = group.createdBy.toString() === req.user.userId;

      if (!isCreator && !(group.isPrivate && isMember)) {
         return res.status(403).json({ message: 'Only the creator can delete this group' });
      }

      await GroupExpense.deleteMany({ group: req.params.id });
      await Group.findByIdAndDelete(req.params.id);
      
      res.json({ success: true, message: 'Group and all its expenses deleted' });
   } catch (err) { res.status(500).json({ message: err.message }); }
});

// Remove Member (Creator Only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
   try {
      const group = await Group.findById(req.params.id);
      if (group.createdBy.toString() !== req.user.userId) return res.status(403).json({ message: 'Unauthorized removal' });
      
      group.members = group.members.filter(m => m.toString() !== req.params.userId);
      await group.save();
      
      const populated = await Group.findById(group._id).populate('members createdBy');
      res.json(populated);
   } catch (err) { res.status(500).json({ message: err.message }); }
});

// Balances Summary
router.get('/balances/summary', auth, async (req, res) => {
  try {
    const expenses = await GroupExpense.find({
      group: { $in: await Group.find({ members: req.user.userId }).distinct('_id') }
    }).populate('payers.user splits.user');

    const balances = {}; // userId -> { user, amount }

    expenses.forEach(exp => {
      // For each payer who isn't me, if I owe them, amount decreases
      // For each splittee who isn't me, if I paid for them, amount increases
      
      const mySplit = exp.splits.find(s => s.user?._id?.toString() === req.user.userId);
      const IAmOwer = !!mySplit && !mySplit.paid;

      exp.payers.forEach(payer => {
         if (payer.user?._id?.toString() === req.user.userId) {
            // I paid. Others owe me.
            exp.splits.forEach(split => {
               if (split.user && split.user._id && split.user._id.toString() !== req.user.userId && !split.paid) {
                  const targetId = split.user._id.toString();
                  if (!balances[targetId]) balances[targetId] = { user: split.user, amount: 0 };
                  balances[targetId].amount += split.amount;
               }
            });
         } else if (IAmOwer && payer.user && payer.user._id) {
            // Someone else paid. I owe them my share.
            const payerId = payer.user._id.toString();
            if (!balances[payerId]) balances[payerId] = { user: payer.user, amount: 0 };
            const myShareToThisPayer = (mySplit.amount * (payer.amount / Math.max(exp.totalAmount, 1)));
            balances[payerId].amount -= myShareToThisPayer;
         }
      });
    });

    const finalBalances = Object.values(balances).filter(b => b.user && b.amount !== 0);
    res.json(finalBalances);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get or Create Private Group (1-on-1)
router.post('/private/:friendId', auth, async (req, res) => {
   try {
      const myId = req.user.userId;
      const friendId = req.params.friendId;
      
      // Find a group with EXACTLY these 2 members
      let group = await Group.findOne({
         members: { $all: [myId, friendId], $size: 2 },
         isPrivate: true
      }).populate('members');
      
      if (!group) {
         group = new Group({
            name: '1-on-1 Split',
            emoji: '🤝',
            members: [myId, friendId],
            createdBy: myId,
            isPrivate: true,
            inviteToken: crypto.randomBytes(4).toString('hex')
         });
         await group.save();
         group = await Group.findById(group._id).populate('members');
      }
      
      res.json(group);
   } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
