// lib/ai/matchmaker.ts
// Semantic routing engine using embeddings

import { getEmbedding, cosineSimilarity } from './transformers';

interface Project {
  id: string;
  title: string;
  summary: string;
  techTags: string[];
}

// In-memory embedding cache
let projectEmbeddings: Record<string, number[]> = {};

/**
 * Initialize the matchmaker by pre-computing project embeddings
 */
export async function initMatchmaker(projects: Project[]): Promise<void> {
  console.log('[Matchmaker] Initializing with', projects.length, 'projects...');
  
  for (const project of projects) {
    try {
      const embedding = await getEmbedding(project.summary);
      if (embedding.length > 0) {
        projectEmbeddings[project.id] = embedding;
        console.log(`[Matchmaker] Embedded project: ${project.id}`);
      }
    } catch (error) {
      console.error(`[Matchmaker] Failed to embed project ${project.id}:`, error);
    }
  }
  
  console.log('[Matchmaker] Ready with', Object.keys(projectEmbeddings).length, 'embeddings');
}

/**
 * Route a token to the most semantically similar project
 * Returns project ID if similarity >= 0.40, otherwise null
 */
export async function routeToken(text: string): Promise<string | null> {
  try {
    console.log('[Matchmaker] Routing token:', text);
    
    // Get embedding for the input token
    const tokenEmbedding = await getEmbedding(text);
    
    if (tokenEmbedding.length === 0) {
      console.warn('[Matchmaker] Failed to generate embedding for token');
      return null;
    }
    
    // Compare against all project embeddings
    let bestMatch: { id: string; score: number } | null = null;
    
    for (const [projectId, projectEmbedding] of Object.entries(projectEmbeddings)) {
      const similarity = cosineSimilarity(tokenEmbedding, projectEmbedding);
      
      console.log(`[Matchmaker] Similarity with ${projectId}:`, similarity.toFixed(3));
      
      if (!bestMatch || similarity > bestMatch.score) {
        bestMatch = { id: projectId, score: similarity };
      }
    }
    
    // Return match if score meets threshold
    if (bestMatch && bestMatch.score >= 0.40) {
      console.log(`[Matchmaker] ✓ Matched to ${bestMatch.id} (score: ${bestMatch.score.toFixed(3)})`);
      return bestMatch.id;
    }
    
    console.log('[Matchmaker] ✗ No match found (best score:', bestMatch?.score.toFixed(3), ')');
    return null;
  } catch (error) {
    console.error('[Matchmaker] Routing failed:', error);
    return null;
  }
}
