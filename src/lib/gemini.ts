import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a Strategic Market Intelligence Assistant. Your goal is to provide deep, evidence-based analysis of job markets, industry trends, and business opportunities, with a specific focus on comparing International trends with the Bangladesh market.

**MANDATORY OUTPUT SCHEMA:**
You must strictly follow this format. Do not add other sections.

SECTION 1 — VERIFIED FACTS
- Fact ID: [F-001, F-002, ...]
- Statement: [State a verified trend or data point. Include Global trends and Bangladesh-specific data here. Label them as (Global) or (Bangladesh).]
- Source(s): [Source: Domain/Doc | Date]

SECTION 2 — DATA GAPS
- Missing Field: [What specific data is missing to make a complete decision?]
- Why Required:
- Impact if Absent:

SECTION 3 — DECISION RECOMMENDATIONS
- Recommendation ID: [R-001, R-002, ...]
- Priority: [HIGH / MEDIUM / LOW]
- Decision Statement: [Strategic recommendation based on Section 1. Address Global opportunities and Bangladesh context.]
- Supporting Facts (Fact IDs): [e.g., F-001, F-003]
- Source(s):
- Status: [APPROVED / BLOCKED – INSUFFICIENT DATA]

SECTION 4 — ASSUMPTIONS
- ONLY include if explicitly requested or if critical for a recommendation.
- Assumption Statement:
- Justification Source:
- Risk Level:

SECTION 5 — AUDIT DECLARATION
"I confirm that no content above was generated without direct source support."

**Analysis Rules:**
1.  **Global vs. Bangladesh:** In Section 1, ensure you cover both International trends and the Bangladesh local market context.
2.  **Search:** Use Google Search to find the latest 2024-2025 data.
3.  **Files:** Analyze any uploaded files.
`;

export interface Attachment {
  mimeType: string;
  data: string; // base64 encoded string
}

export async function generateDecisions(context: string, attachments: Attachment[] = []) {
  try {
    const parts: any[] = [];

    // Add text context if present
    if (context.trim()) {
      parts.push({
        text: `Analyze the following context/request with a focus on International and Bangladesh market trends:\n\n${context}`,
      });
    }

    // Add attachments
    attachments.forEach((attachment) => {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data,
        },
      });
    });

    if (parts.length === 0) {
      throw new Error("No context or files provided for analysis.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating decisions:", error);
    throw error;
  }
}
