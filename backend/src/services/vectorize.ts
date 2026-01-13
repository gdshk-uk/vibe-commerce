/**
 * Vectorize Service
 * Handles vector similarity calculations and semantic search operations
 */

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
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

/**
 * Find top K similar vectors
 */
export function findTopKSimilar(
  queryVector: number[],
  vectors: Array<{ id: string; vector: number[]; data?: any }>,
  k: number = 10
): Array<{ id: string; similarity: number; data?: any }> {
  const similarities = vectors.map((item) => ({
    id: item.id,
    similarity: cosineSimilarity(queryVector, item.vector),
    data: item.data,
  }));

  // Sort by similarity in descending order
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Return top K results
  return similarities.slice(0, k);
}

/**
 * Normalize vector to unit length
 */
export function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

  if (norm === 0) {
    return vector;
  }

  return vector.map((val) => val / norm);
}

/**
 * Calculate average vector from multiple vectors
 */
export function averageVectors(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    return [];
  }

  const length = vectors[0].length;
  const avgVector = new Array(length).fill(0);

  for (const vector of vectors) {
    for (let i = 0; i < length; i++) {
      avgVector[i] += vector[i];
    }
  }

  return avgVector.map((val) => val / vectors.length);
}

/**
 * Euclidean distance between two vectors
 */
export function euclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Filter duplicate or highly similar results
 */
export function filterSimilarResults<T extends { similarity: number }>(
  results: T[],
  threshold: number = 0.95
): T[] {
  const filtered: T[] = [];

  for (const result of results) {
    // Check if this result is too similar to any already filtered result
    const isDuplicate = filtered.some(
      (existing) => Math.abs(existing.similarity - result.similarity) < (1 - threshold)
    );

    if (!isDuplicate) {
      filtered.push(result);
    }
  }

  return filtered;
}

/**
 * Combine text fields for vectorization
 */
export function combineProductFields(product: {
  name: string;
  description?: string;
  category: string;
  brand: string;
}): string {
  const parts = [
    product.name,
    product.brand,
    product.category,
    product.description || '',
  ].filter(Boolean);

  return parts.join(' ');
}
