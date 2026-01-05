
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, FitnessSettings, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFitnessPlan = async (settings: FitnessSettings, currentWeight: number) => {
  const prompt = `
    请根据以下用户信息，推荐3项具体的健身运动和今日三餐饮食计划（早餐、午餐、晚餐）。
    用户信息：${settings.gender === 'MALE' ? '男' : '女'}，${settings.age}岁，当前体重 ${currentWeight}kg，身高 ${settings.height || '未知'}cm。
    健身目标：${settings.goal === 'LOSE_WEIGHT' ? '减脂' : settings.goal === 'GAIN_MUSCLE' ? '增肌' : '保持'}。
    活动水平：${settings.activityLevel}。
    
    必须使用【中文】回答。
    回答必须符合以下 JSON 格式：
    {
      "exercises": [{"name": "运动名称", "duration": "持续时间", "intensity": "强度描述"}],
      "meals": {"breakfast": "建议内容", "lunch": "建议内容", "dinner": "建议内容"},
      "advice": "一句话专业建议"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "你是一位专业的中文健身教练 and 营养师，请给出专业、接地气且精准的中文健身与饮食方案。"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Fitness AI Error", error);
    return null;
  }
};

export const parseAiTask = async (input: string) => {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `解析以下日程描述，提取任务标题、预计开始时间（HH:mm格式）、日期（YYYY-MM-DD格式，如果不明确则默认今天${today}）、分类（WORK, STUDY, ENTERTAINMENT 选其一）、以及是否为重点日程（isPriority）。如果是重点、紧急、重要或必须完成的任务，isPriority应为true。描述内容：“${input}”`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            time: { type: Type.STRING },
            date: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['WORK', 'STUDY', 'ENTERTAINMENT'] },
            isPriority: { type: Type.BOOLEAN }
          },
          required: ["title", "time", "date", "category", "isPriority"]
        },
        systemInstruction: "你是一个智能日程助手，擅长从自然语言中提取结构化的日程信息，并能敏锐识别用户的紧迫感和重要性需求。"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Task Parse Error", error);
    return null;
  }
};

export const parseVoiceTask = async (audioBase64: string, mimeType: string) => {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `听取这段录音并将其转化为日程任务。请提取：任务标题、预计开始时间（HH:mm格式）、日期（YYYY-MM-DD格式，默认今天${today}）、分类（WORK, STUDY, ENTERTAINMENT）、以及是否为重点日程（isPriority）。如果是重点、紧急、重要或必须完成的任务，isPriority应为true。请以JSON格式返回。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            time: { type: Type.STRING },
            date: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['WORK', 'STUDY', 'ENTERTAINMENT'] },
            isPriority: { type: Type.BOOLEAN }
          },
          required: ["title", "time", "date", "category", "isPriority"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Voice Task Parse Error", error);
    return null;
  }
};

export const getDailySummary = async (tasks: Task[]) => {
  const prompt = `这是我今天的日程：${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, category: t.category })))}。请从心情、成长、效率三个维度进行点评，给出一段温馨、充满动力且幽默的总结（100字以内）。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一个充满活力、幽默感和洞察力的私人生活导师。你会用‘玩家’来称呼用户，用游戏化的口吻评价他的一天。"
      }
    });
    return response.text?.trim() || "今天也是元气满满的一天，继续保持！";
  } catch (error) {
    return "解析今日成就时发生了一个小意外，但你的努力大家有目共睹！";
  }
};

export const getDailyHappiness = async () => {
  const prompt = `请随机生成一件能够提升情绪的“今日幸福小事”（例如：在窗台发呆5分钟、给好久没见的朋友发个问候、买一束喜欢的花等）。要求：温馨、简单易行、富有生活气息。字数在15字以内。请直接返回该文本内容。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一个温柔的生活疗愈师，擅长发现日常中的微小幸福。"
      }
    });
    return response.text?.trim() || "在窗边静静感受5分钟阳光";
  } catch (error) {
    return "为自己泡一杯香浓的咖啡";
  }
};

export const getHealthTrendAnalysis = async (timeRange: string, logs: any[]) => {
  const prompt = `
    请分析以下时间段（${timeRange}）的健康日志数据：
    ${JSON.stringify(logs)}
    
    任务：
    1. 标出异常项（如睡眠严重不足、水分摄入过低）。
    2. 提供具体的中文健康建议。
    
    回答必须简洁有力，分点输出。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一位资深的中文健康管理专家。请根据数据提供精准的异常分析和建议。"
      }
    });
    return response.text;
  } catch (error) {
    return "分析失败，请检查数据。";
  }
};

export const getDeeperAnalysis = async (timeRange: string, data: any) => {
  const prompt = `分析以下数据趋势并给出建议：${JSON.stringify(data)}`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: "资深数据分析师，中文输出。" }
    });
    return response.text;
  } catch (error) {
    return "分析失败。";
  }
};

export const estimateFoodCalories = async (foodName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `估算 100g 【${foodName}】 的卡路里，请返回 JSON。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { caloriesPer100g: { type: Type.NUMBER } },
          required: ["caloriesPer100g"]
        }
      }
    });
    const result = JSON.parse(response.text || "{}");
    return result.caloriesPer100g || 0;
  } catch (e) {
    return 0;
  }
};
