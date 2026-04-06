import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
  dangerouslyAllowBrowser: true // Required when calling from browser
});

export const generateFinancialInsights = async (transactions, totalIncome, totalExpenses, goals, friendBalances = [], pastInsights = [], persona = 'coach') => {
  try {
    // 1. Transaction-level precision: Group spending by name/merchant
    const merchantMap = {};
    const categoryMap = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const amount = Number(t.amount) || 0;
        // Merchant Logic
        if (!merchantMap[t.name]) merchantMap[t.name] = { count: 0, total: 0 };
        merchantMap[t.name].count += 1;
        merchantMap[t.name].total += amount;

        // Category Logic
        categoryMap[t.category] = (categoryMap[t.category] || 0) + amount;
      }
    });

    const frequentMerchants = Object.entries(merchantMap)
      .filter(([_, v]) => v.count > 2)
      .map(([name, v]) => `${name} (${v.count}x, ₹${v.total})`)
      .join(', ');

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([cat, amt]) => `${cat}: ₹${amt}`)
      .join(', ');

    // 2. Financial Metrics
    const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0;
    const dateRange = transactions.length > 0 ? 'Last 30 days' : 'No recent history';

    // 3. Persona logic
    const personaMap = {
      'strict': 'Act as a strict, direct accountability coach. Use logic-driven, no-fluff warnings. Focus on saving first.',
      'gentle': 'Act as a supportive, gentle friend. Use encouraging language. Focus on ease of habit.',
      'coach': 'Act as a professional financial co-pilot. Balanced and strategic. Focused on milestones.'
    };

    const prompt = `
Context:
${personaMap[persona]}
Time Period: ${dateRange}
Savings Rate: ${savingsRate}% (${totalIncome > totalExpenses ? 'surplus' : 'deficit'})
Total Income: ₹${totalIncome} | Total Expenses: ₹${totalExpenses}
Category Breakdown: ${categoryBreakdown || 'No expenses yet.'}
Frequent Transactions: ${frequentMerchants || 'No recurring patterns found.'}
Savings Goals: ${goals.map(g => `${g.name}: ${Math.round((g.current/g.target)*100)}% complete`).join(', ')}
Communal Splits: ${friendBalances.map(f => `${f.name} owes you ₹${f.balance} (${f.daysSince || 0} days ago)`).join(', ') || 'No pending debts.'}
Memory (Past Warnings): ${pastInsights.map(i => `[${i.type}] ${i.message}`).slice(0, 3).join(' | ') || 'No previous history.'}

Instructions:
Reason at the TRANSACTION level. If a user has repeatedly hit a specific merchant (e.g. Swiggy), flag the total spend. If a friend has owed money for over 7 days, prioritize it as a recovery insight.

Format Output STRICTLY as a JSON array of 3 objects:
- "id": unique string
- "type": "warning", "milestone", "recovery", or "strategy"
- "message": 1-2 powerful, specific sentences.
- "actionLabel": One-click CTA text
- "actionCode": Code handle (e.g., "BUDGET_ALRT", "REMIND_SPLIT")

Output ONLY valid JSON.
`;

    const response = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    
    // Isolated Parsing for Better Debugging
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("Malformed AI JSON:", content);
      return [];
    }

    if (Array.isArray(parsed)) return parsed;
    if (parsed.insights && Array.isArray(parsed.insights)) return parsed.insights;
    return Object.values(parsed).find(val => Array.isArray(val)) || [];

  } catch (error) {
    console.error("AI Assistant Error:", error);
    throw error;
  }
};
