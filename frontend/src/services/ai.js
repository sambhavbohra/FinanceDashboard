import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
  dangerouslyAllowBrowser: true // Required when calling from browser
});

export const generateFinancialInsights = async (transactions, totalIncome, totalExpenses, goals) => {
  try {
    const prompt = `
You are an expert AI financial assistant helping a student manage their money. 
Here is their financial data:
Total Income: ₹${totalIncome}
Total Expenses: ₹${totalExpenses}
Transactions: ${JSON.stringify(transactions.map(t => ({ category: t.category, amount: t.amount, name: t.name, type: t.type })))}
Goals: ${JSON.stringify(goals.map(g => ({ name: g.name, target: g.target, current: g.current })))}

Analyze this data. Are there unusual spending patterns? Can they save more?
Provide your response strictly as a JSON array of 3 insight objects. Each object must have:
- "id": a unique string (e.g., "ai-1")
- "type": one of "warning", "suggestion", or "success"
- "message": A 1-2 sentence detailed insight/recommendation.

Output ONLY valid JSON.
`;

    const response = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL || "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Some models might wrap the array in an object when using json_object format (e.g., {"insights": [...]})
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.insights && Array.isArray(parsed.insights)) {
      return parsed.insights;
    } else {
      // Fallback if parsing didn't return an exact array format
      return Object.values(parsed).find(val => Array.isArray(val)) || [];
    }
  } catch (error) {
    console.error("Failed to generate AI insights:", error);
    throw error;
  }
};
