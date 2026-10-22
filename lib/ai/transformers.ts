// lib/ai/transformers.ts
// Singleton wrapper for @xenova/transformers pipeline

// Singleton instances
let toxicityClassifier: any = null;
let embeddingModel: any = null;

/**
 * Initialize the toxicity classifier (lazy loading)
 */
async function getToxicityClassifier() {
  if (!toxicityClassifier) {
    // Dynamic import to avoid SSR issues
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    
    toxicityClassifier = await pipeline(
      'text-classification',
      'Xenova/toxic-bert'
    );
  }
  return toxicityClassifier;
}

/**
 * Initialize the embedding model (lazy loading)
 */
async function getEmbeddingModel() {
  if (!embeddingModel) {
    // Dynamic import to avoid SSR issues
    const { pipeline, env } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embeddingModel;
}

/**
 * Check if text contains toxic content
 * Returns true if 'toxic' score > 0.8
 */
export async function checkToxicity(text: string): Promise<boolean> {
  // Only run in browser
  if (typeof window === 'undefined') return false;
  
  try {
    const classifier = await getToxicityClassifier();
    const result = await classifier(text);

    // Result format: [{ label: 'toxic', score: 0.xx }, { label: 'non-toxic', score: 0.xx }]
    if (Array.isArray(result) && result.length > 0) {
      const toxicResult = result.find((r: any) => r.label === 'toxic');
      if (toxicResult && toxicResult.score > 0.8) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[Transformers] Toxicity check failed:', error);
    // Fail open: allow content if model fails
    return false;
  }
}

/**
 * Get embedding vector for text
 * Returns normalized embedding as number array
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // Only run in browser
  if (typeof window === 'undefined') return [];
  
  try {
    const model = await getEmbeddingModel();
    const output = await model(text, { pooling: 'mean', normalize: true });

    // Extract the embedding array from the tensor
    return Array.from(output.data);
  } catch (error) {
    console.error('[Transformers] Embedding extraction failed:', error);
    return [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
