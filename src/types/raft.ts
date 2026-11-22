export type NodeRole = 'FOLLOWER' | 'CANDIDATE' | 'LEADER' | 'CRASHED';

export interface LogEntry {
  index: number;
  term: number;
  command: string; // e.g. "PUT x = 10", "DELETE y"
  committed?: boolean;
}

export interface RaftNodeState {
  id: number;
  role: NodeRole;
  currentTerm: number;
  votedFor: number | null;
  log: LogEntry[];
  commitIndex: number;
  lastApplied: number;
  stateMachine: Record<string, any>;
  electionTimeout: number;
  heartbeatInterval: number;
  votesReceived: number[];
  leaderId: number | null;
  isIsolated?: boolean;
  partitionGroup?: string; // 'A' | 'B' | 'C'
  lastHeartbeatTime: number;
}

export type MessageType =
  | 'REQUEST_VOTE'
  | 'REQUEST_VOTE_RESPONSE'
  | 'APPEND_ENTRIES'
  | 'APPEND_ENTRIES_RESPONSE'
  | 'CLIENT_REQUEST'
  | 'CLIENT_RESPONSE';

export interface MessagePacket {
  id: string;
  type: MessageType;
  from: number;
  to: number;
  term: number;
  payload: any;
  sentTime: number;
  deliveryTime: number;
  status: 'IN_FLIGHT' | 'DELIVERED' | 'DROPPED' | 'DELAYED' | 'DUPLICATED';
}

export type EventType =
  | 'ELECTION_TIMEOUT'
  | 'START_ELECTION'
  | 'VOTE_REQUEST'
  | 'VOTE_GRANTED'
  | 'VOTE_DENIED'
  | 'BECOME_LEADER'
  | 'HEARTBEAT_SENT'
  | 'APPEND_ENTRIES'
  | 'LOG_REPLICATED'
  | 'ENTRY_COMMITTED'
  | 'STATE_APPLIED'
  | 'NODE_CRASH'
  | 'NODE_RESTART'
  | 'NETWORK_PARTITION'
  | 'NETWORK_HEAL'
  | 'MESSAGE_DROP'
  | 'MESSAGE_DELAY'
  | 'CLIENT_WRITE'
  | 'CLIENT_READ'
  | 'INVARIANT_VIOLATION';

export interface SimulationEvent {
  id: number;
  virtualTime: number; // in ms
  type: EventType;
  nodeId?: number;
  targetId?: number;
  details: string;
  metadata?: Record<string, any>;
  severity?: 'info' | 'warn' | 'error' | 'success';
}

export type InvariantId =
  | 'INV01' // Election Safety: at most 1 leader per term
  | 'INV02' // Term Monotonicity: terms never decrease
  | 'INV03' // Commit Index Monotonicity: commit index never decreases
  | 'INV04' // State Machine Safety: same index applied across nodes matches
  | 'INV05' // Durability: committed entries preserved across crash/recovery
  | 'INV06' // Log Matching: matching index & term implies identical prefix
  | 'INV07' // Leader Completeness: leader has all committed entries of prior terms
  | 'INV08' // Convergence: active nodes converge after partition heal
  | 'INV09' // Client Ack Correctness: no ack before commit & application
  | 'INV_LIN'; // Linearizability Checker: strict sequential ordering

export interface InvariantCheckResult {
  id: InvariantId;
  name: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'NOT_TESTED';
  details?: string;
  evidence?: {
    term?: number;
    nodeIds?: number[];
    eventIds?: number[];
    expected?: string;
    observed?: string;
  };
}

export type Verdict = 'PASS' | 'SAFETY_FAIL' | 'LIVENESS_FAIL' | 'TIMEOUT' | 'HARNESS_FAIL';

export interface SimulationConfig {
  clusterSize: number; // 3, 5, 7, 9
  seed: number;
  heartbeatInterval: number;
  electionTimeoutMin: number;
  electionTimeoutMax: number;
  networkLatency: number; // base ms
  networkJitter: number;
  dropRate: number; // 0.0 - 1.0
  duplicateRate: number;
  reorderRate: number;
  faultProfile: 'healthy' | 'lossy' | 'partitioned' | 'crashy' | 'chaotic' | 'custom';
}

export interface Scenario {
  id: string;
  title: string;
  category: 'Elections' | 'Partitions' | 'Replication' | 'Storage Faults' | 'Linearizability';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  goal: string;
  clusterSize: number;
  expectedVerdict: Verdict;
  config: Partial<SimulationConfig>;
  faultScript: { timeMs: number; action: string; params?: any }[];
  workload: { timeMs: number; command: string }[];
}

export interface SimulationRunRecord {
  id: string;
  scenarioId?: string;
  scenarioTitle: string;
  timestamp: string;
  seed: number;
  clusterSize: number;
  virtualDuration: number;
  executionDuration: number;
  eventCount: number;
  verdict: Verdict;
  leaderChanges: number;
  messagesSent: number;
  messagesDropped: number;
  clientSuccess: number;
  clientErrors: number;
  invariants: InvariantCheckResult[];
  linearizabilityPassed: boolean;
  events: SimulationEvent[];
  snapshots: { time: number; nodes: RaftNodeState[] }[];
}
