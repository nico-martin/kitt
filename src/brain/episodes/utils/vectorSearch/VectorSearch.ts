class VectorSearch {
  private queryEmbedding: Array<number> = [];
  private queryMagnitude: number = 0;

  private calculateMagnitude(embedding: number[]): number {
    let sumOfSquares = 0;
    for (const val of embedding) {
      sumOfSquares += val * val;
    }
    return Math.sqrt(sumOfSquares);
  }
  public constructor(queryEmbedding: Array<number>) {
    this.queryEmbedding = queryEmbedding;
    this.queryMagnitude = this.calculateMagnitude(queryEmbedding);
  }

  public calculateSimilarityScore(embedding: Array<number>): number {
    let dotProduct = 0;
    for (let i = 0; i < embedding.length; i++) {
      dotProduct += embedding[i] * this.queryEmbedding[i];
    }

    let score = this.getCosineSimilarityScore(
      dotProduct,
      this.calculateMagnitude(embedding),
      this.queryMagnitude
    );
    return this.normalizeScore(score);
  }

  private getCosineSimilarityScore(
    dotProduct: number,
    magnitudeA: number,
    magnitudeB: number
  ): number {
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private normalizeScore(score: number): number {
    return (score + 1) / 2;
  }
}

export default VectorSearch;
