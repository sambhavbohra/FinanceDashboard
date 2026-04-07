// Direct Neural Link via Fetch API

export const generateFinancialInsights = async (transactions, totalIncome, totalExpenses, goals, friendBalances = [], pastInsights = [], persona = 'coach', userName = 'User') => {
  try {
    const rawKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    const apiKey = rawKey.trim().replace(/['"]/g, '');
    const rawBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
    const baseUrl = rawBaseUrl.trim().replace(/['"]/g, '').replace(/\/+$/, '');
    
    if (!apiKey || apiKey === 'undefined') {
       console.error("AI Core: Missing or invalid API Key! Please check .env and RESTART npm run dev.");
       return [];
    }

    if (!Array.isArray(transactions)) {
       console.error("AI Insight Error: Transactions must be an array");
       return [];
    }

    // 1. Transaction-level precision: Group spending by name/merchant
    const merchantMap = {};
    const categoryMap = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const amount = Number(t.amount) || 0;
        // Merchant Logic
        const merchantName = t.name?.split(' ')[0] || 'Unknown';
        if (!merchantMap[merchantName]) merchantMap[merchantName] = { count: 0, total: 0 };
        merchantMap[merchantName].count += 1;
        merchantMap[merchantName].total += amount;

        // Category Logic
        categoryMap[t.category] = (categoryMap[t.category] || 0) + amount;
      }
    });

    const frequentMerchants = Object.entries(merchantMap)
      .filter(([_, v]) => v.count > 1)
      .map(([name, v]) => `${name} (${v.count}x, ₹${v.total})`)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .join(', ');

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([cat, amt]) => `${cat}: ₹${amt}`)
      .join(', ');

    // 2. Financial Metrics
    const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0;
    const dateRange = 'Last 30 days';

    // 3. Persona logic
    const personaMap = {
      'strict': 'Act as a strict, direct accountability coach. Use logic-driven, no-fluff warnings. Focus on saving first.',
      'gentle': 'Act as a supportive, gentle friend. Use encouraging language. Focus on ease of habit.',
      'coach': 'Act as a professional financial co-pilot. Balanced and strategic. Focused on milestones.'
    };

    const prompt = `
Context:
User Name: ${userName}
Role: ${personaMap[persona]}
Time Period: ${dateRange}
Savings Rate: ${savingsRate}% (${totalIncome > totalExpenses ? 'surplus' : 'deficit'})
Total Income: ₹${totalIncome} | Total Expenses: ₹${totalExpenses}
Category Breakdown: ${categoryBreakdown || 'No expenses yet.'}
Frequent Transactions: ${frequentMerchants || 'No recurring patterns found.'}
Savings Goals: ${goals.map(g => `${g.name}: ${Math.round((g.current/g.target)*100)}% complete`).join(', ') || 'No active goals.'}
Communal Splits: ${friendBalances.map(f => `${f.name} owes you ₹${f.balance} (${f.daysSince || 0} days ago)`).join(', ') || 'No pending debts.'}
Memory (Past Warnings): ${pastInsights.map(i => `[${i.type}] ${i.message}`).slice(0, 3).join(' | ') || 'No previous history.'}

Instructions:
Reason at the TRANSACTION level. If a user has repeatedly hit a specific merchant, flag the total spend. If a friend has owed money for over 7 days, prioritize it as a recovery insight. 

Format Output STRICTLY as a JSON object with a root key "insights" containing an array of 3 objects:
- "id": unique string
- "type": "warning", "milestone", "recovery", or "strategy"
- "message": 1-2 powerful, specific sentences.
- "actionLabel": One-click CTA text
- "actionCode": Code handle (e.g., "BUDGET_ALRT", "REMIND_SPLIT")

Output ONLY valid JSON.
`;

    console.log(`[AI-CORE-REASONING] Initializing with key length: ${apiKey.length}`);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENAI_MODEL?.trim().replace(/['"]/g, '') || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a financial AI core. Always output JSON with an 'insights' key. No conversational filler." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
       const errBody = await response.text();
       console.error("AI API Error Status:", response.status, errBody);
       throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Robust extraction
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
         console.error("No JSON found in AI response:", content);
         return [];
      }
      const jsonString = content.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonString);
      
      if (parsed.insights && Array.isArray(parsed.insights)) return parsed.insights;
      if (Array.isArray(parsed)) return parsed;
      return Object.values(parsed).find(val => Array.isArray(val)) || [];
    } catch (parseError) {
      console.error("AI Parse Critical Error:", content);
      return [];
    }

  } catch (error) {
    console.error("AI Core Sync Error:", error);
    throw error;
  }
};
