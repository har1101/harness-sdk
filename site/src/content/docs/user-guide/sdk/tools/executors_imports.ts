// @ts-nocheck
// Imports for executors page snippets

// --8<-- [start:concurrent_imports]
import { Agent } from '@strands-agents/sdk'
// --8<-- [end:concurrent_imports]

// --8<-- [start:sequential_imports]
import { Agent } from '@strands-agents/sdk'
// --8<-- [end:sequential_imports]

// --8<-- [start:custom_imports]
import { Agent, ConcurrentToolExecutor } from '@strands-agents/sdk'
import type {
  AgentStreamEvent,
  ToolExecutionInput,
  ToolExecutorOptions,
} from '@strands-agents/sdk'
// --8<-- [end:custom_imports]
