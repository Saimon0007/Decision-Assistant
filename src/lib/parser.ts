export interface Recommendation {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  statement: string;
  status: string;
  facts: string;
  sources: string;
}

export function parseRecommendations(markdown: string): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Find Section 3
  const section3Regex = /SECTION 3 — DECISION RECOMMENDATIONS([\s\S]*?)(?=SECTION 4|$)/;
  const match = markdown.match(section3Regex);
  
  if (!match) return recommendations;
  
  const sectionContent = match[1];
  
  // Split by Recommendation ID to find blocks
  // Assuming format: - Recommendation ID: ...
  const blocks = sectionContent.split(/- Recommendation ID:/g).slice(1);
  
  for (const block of blocks) {
    try {
      const idMatch = block.match(/^\s*(.*?)(?:\n|$)/);
      const id = idMatch ? idMatch[1].trim() : 'Unknown';
      
      const priorityMatch = block.match(/- Priority:\s*(HIGH|MEDIUM|LOW)/i);
      const priority = priorityMatch ? (priorityMatch[1].toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW') : 'MEDIUM';
      
      const statementMatch = block.match(/- Decision Statement:\s*([\s\S]*?)(?=\n- Supporting Facts|\n- Source|\n- Status|$)/);
      const statement = statementMatch ? statementMatch[1].trim() : '';
      
      const statusMatch = block.match(/- Status:\s*([\s\S]*?)(?=\n|$)/);
      const status = statusMatch ? statusMatch[1].trim() : '';

      const factsMatch = block.match(/- Supporting Facts \(Fact IDs\):\s*([\s\S]*?)(?=\n- Source|\n- Status|$)/);
      const facts = factsMatch ? factsMatch[1].trim() : '';

      const sourcesMatch = block.match(/- Source\(s\):\s*([\s\S]*?)(?=\n- Status|$)/);
      const sources = sourcesMatch ? sourcesMatch[1].trim() : '';
      
      if (statement) {
        recommendations.push({
          id,
          priority,
          statement,
          status,
          facts,
          sources
        });
      }
    } catch (e) {
      console.error("Error parsing recommendation block:", e);
    }
  }
  
  return recommendations;
}
