import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Research, Criterion, Service, Evaluation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateLeadsByIndustry = async (industry: string): Promise<Partial<Lead>[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a list of 5 real companies in the ${industry} industry that might need professional services. Provide their name and website if possible.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            website: { type: Type.STRING },
            industry: { type: Type.STRING }
          },
          required: ["name"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse leads:", e);
    return [];
  }
};

export const researchCompanyAI = async (
  companyName: string,
  criteria: Criterion[]
): Promise<Omit<Research, 'id' | 'leadId' | 'userId' | 'createdAt'>[]> => {
  const criteriaText = criteria.map(c => `- ${c.name}: ${c.description}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Research the company "${companyName}". 
    
    Specifically look for information related to these evaluation criteria:
    ${criteriaText}
    
    Find recent news, social media activity (LinkedIn, Twitter), blog posts, and general market presence. Summarize the findings into key facts that help evaluate the company against the criteria.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING, description: "e.g. LinkedIn, Twitter, News, Blog" },
            content: { type: Type.STRING, description: "Summarized facts related to the criteria" },
            sourceUrl: { type: Type.STRING, description: "URL to the source" }
          },
          required: ["platform", "content"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse research:", e);
    return [];
  }
};

export const evaluateLeadAI = async (
  lead: Lead,
  research: Research[],
  criteria: Criterion[],
  services: Service[]
): Promise<Omit<Evaluation, 'id' | 'leadId' | 'userId' | 'createdAt'>> => {
  const researchText = research.map(r => `[${r.platform}]: ${r.content}`).join('\n');
  const criteriaText = criteria.map(c => `- ${c.name} (Weight: ${c.weight}): ${c.description}`).join('\n');
  const servicesText = services.map(s => `- ${s.name}: ${s.description}`).join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Evaluate the company "${lead.name}" based on the following research, criteria, and services offered.
    
    Research:
    ${researchText}
    
    Criteria (Consider their weights):
    ${criteriaText}

    Services Offered (Evaluate how well the company fits these services):
    ${servicesText}
    
    Provide a probability score (0-100) of them needing services, a confidence score (0-100) indicating how certain you are about this analysis, detailed insights, and a breakdown of scores for each criterion based on the research and services. 
    
    IMPORTANT: In the "criteriaScores" object, use the EXACT names of the criteria provided above as keys. Provide a score from 0-100 for EVERY criterion listed.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Overall probability score (0-100)" },
          confidenceScore: { type: Type.NUMBER, description: "AI's certainty about the analysis (0-100)" },
          insights: { type: Type.STRING, description: "Detailed analysis and reasoning" },
          criteriaScores: {
            type: Type.OBJECT,
            description: "Map of criterion name to score (0-100)"
          }
        },
        required: ["score", "confidenceScore", "insights", "criteriaScores"]
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    
    // Calculate weighted score based on user formula: sum(score * weight) / total_criteria
    if (result.criteriaScores && criteria.length > 0) {
      let weightedSum = 0;
      criteria.forEach(c => {
        const score = result.criteriaScores[c.name] || 0;
        weightedSum += score * c.weight;
      });
      result.score = Math.round(weightedSum / criteria.length);
    }

    return result;
  } catch (e) {
    console.error("Failed to parse evaluation:", e);
    return { 
      score: 0, 
      confidenceScore: 0, 
      insights: "Error generating insights", 
      criteriaScores: {} 
    };
  }
}

export const generateOutreachEmail = async (
  lead: Lead,
  evaluation: Evaluation,
  services: Service[]
): Promise<string> => {
  const servicesText = services.map(s => `- ${s.name}: ${s.description}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Compose a personalized outreach email for "${lead.name}". 
    Use these insights: ${evaluation.insights}.
    Our services:
    ${servicesText}
    
    Make it professional, concise, and highly relevant to their current situation as found in research.`,
  });

  return response.text || "Failed to generate email.";
};

export const generateSalesDeckAI = async (
  lead: Lead,
  evaluation: Evaluation,
  services: Service[]
): Promise<string> => {
  const servicesText = services.map(s => `- ${s.name}: ${s.description}`).join('\n');

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a one-pager sales deck (Markdown format) for "${lead.name}".
    Include:
    1. Executive Summary
    2. Key Challenges (based on insights: ${evaluation.insights})
    3. Proposed Solutions (using our services: ${servicesText})
    4. Why Now? (Urgency)
    5. Next Steps
    
    Use a professional and persuasive tone.`,
  });

  return response.text || "Failed to generate sales deck.";
};

export const suggestCriteriaAI = async (
  lead: Lead | null,
  services: Service[]
): Promise<Omit<Criterion, 'id' | 'userId'>[]> => {
  const servicesText = services.map(s => `- ${s.name}: ${s.description}`).join('\n');
  
  const contextText = lead 
    ? `Based on the company "${lead.name}" (Industry: ${lead.industry || 'Unknown'}) and the services we provide:`
    : `Based on the services we provide:`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${contextText}
    ${servicesText}
    
    Suggest 3-5 specific evaluation criteria that would help determine if a company is a good lead for our services.
    Each criterion should have a name, a clear description of what to look for in research, and a suggested weight (0.1 to 1.0).
    The criteria should be designed to trigger a sale.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            weight: { type: Type.NUMBER }
          },
          required: ["name", "description", "weight"]
        }
      }
    }
  });

  try {
    const suggestions = JSON.parse(response.text || '[]');
    return suggestions.map((s: any) => {
      const suggestion: any = { ...s };
      if (lead?.id) {
        suggestion.leadId = lead.id;
      }
      return suggestion;
    });
  } catch (e) {
    console.error("Failed to parse criteria suggestions:", e);
    return [];
  }
};
