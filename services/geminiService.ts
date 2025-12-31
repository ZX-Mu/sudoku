
import { GoogleGenAI, Type } from "@google/genai";
import { AIHint, SudokuGrid } from "../types";

export const getAIHint = async (grid: SudokuGrid, solution: number[][]): Promise<AIHint | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const gridState = grid.map(row => row.map(cell => cell.value || 0));
  
  const prompt = `
    你是一位专业的数独大师。我正在玩一局数独。
    当前棋盘状态（0表示空格）：
    ${JSON.stringify(gridState)}
    
    正确答案是：
    ${JSON.stringify(solution)}

    请帮我找出一个具有启发性的下一步。不要只给答案，要用中文详细解释逻辑。
    请使用标准的数独技巧术语，如“唯余 (Naked Single)”、“隐性数对 (Hidden Pair)”、“区块排除 (Pointing Pairs)”或“X-Wing”等。
    选择一个格子进行解答，并根据当前限制解释为什么它必须是那个数字。
    
    输出必须是 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            row: { type: Type.INTEGER, description: "行索引 0-8" },
            col: { type: Type.INTEGER, description: "列索引 0-8" },
            value: { type: Type.INTEGER, description: "该格子的正确数字" },
            strategy: { type: Type.STRING, description: "所使用的技巧名称" },
            explanation: { type: Type.STRING, description: "详细的中文逻辑解释" }
          },
          required: ["row", "col", "value", "strategy", "explanation"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result as AIHint;
  } catch (error) {
    console.error("Gemini AI Hint Error:", error);
    return null;
  }
};
