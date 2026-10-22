// lib/ai/qAgent.ts
// Tabular Q-Learning Agent for discrete pathfinding

interface Vector2D {
  x: number;
  y: number;
}

export class QAgent {
  private qTable: Map<string, number[]>;
  private readonly gridSize = 40;
  private readonly epsilon = 0.1; // Exploration rate
  private readonly alpha = 0.5; // Learning rate
  private readonly gamma = 0.9; // Discount factor

  // 4 discrete actions: Up, Right, Down, Left
  private readonly actions: Vector2D[] = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 },  // Right
    { x: 0, y: 1 },  // Down
    { x: -1, y: 0 }, // Left
  ];

  constructor() {
    this.qTable = new Map();
  }

  /**
   * Discretize the continuous state into grid coordinates
   */
  getState(robotPos: Vector2D, targetPos: Vector2D): string {
    const deltaX = Math.floor((targetPos.x - robotPos.x) / this.gridSize);
    const deltaY = Math.floor((targetPos.y - robotPos.y) / this.gridSize);
    return `${deltaX},${deltaY}`;
  }

  /**
   * Get Q-values for a state (initialize if not seen before)
   */
  private getQValues(state: string): number[] {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, [0, 0, 0, 0]);
    }
    return this.qTable.get(state)!;
  }

  /**
   * Epsilon-greedy action selection
   */
  getBestAction(state: string): number {
    const qValues = this.getQValues(state);

    // Exploration: random action
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actions.length);
    }

    // Exploitation: best known action
    let maxQ = -Infinity;
    let bestAction = 0;

    for (let i = 0; i < qValues.length; i++) {
      if (qValues[i] > maxQ) {
        maxQ = qValues[i];
        bestAction = i;
      }
    }

    return bestAction;
  }

  /**
   * Get the action vector for a given action index
   */
  getActionVector(actionIndex: number): Vector2D {
    return this.actions[actionIndex];
  }

  /**
   * Update Q-value using Bellman equation
   */
  update(
    state: string,
    actionIndex: number,
    reward: number,
    nextState: string
  ): void {
    const qValues = this.getQValues(state);
    const nextQValues = this.getQValues(nextState);

    // Find max Q-value for next state
    const maxNextQ = Math.max(...nextQValues);

    // Bellman equation: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
    qValues[actionIndex] =
      qValues[actionIndex] +
      this.alpha * (reward + this.gamma * maxNextQ - qValues[actionIndex]);

    this.qTable.set(state, qValues);
  }

  /**
   * Calculate reward based on distance change
   */
  calculateReward(
    oldRobotPos: Vector2D,
    newRobotPos: Vector2D,
    targetPos: Vector2D
  ): number {
    const oldDistance = Math.hypot(
      targetPos.x - oldRobotPos.x,
      targetPos.y - oldRobotPos.y
    );
    const newDistance = Math.hypot(
      targetPos.x - newRobotPos.x,
      targetPos.y - newRobotPos.y
    );

    // Reward for getting closer
    if (newDistance < oldDistance) {
      return 10;
    }
    // Penalty for getting farther
    return -1;
  }
}
