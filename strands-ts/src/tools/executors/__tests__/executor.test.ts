import { describe, expect, it } from 'vitest'

import { Agent } from '../../../agent/agent.js'
import { MockMessageModel } from '../../../__fixtures__/mock-message-model.js'
import { createMockTool } from '../../../__fixtures__/tool-helpers.js'
import { BeforeToolCallEvent, ToolResultEvent } from '../../../hooks/events.js'
import { ToolExecutor } from '../executor.js'

import type { AgentStreamEvent } from '../../../types/agent.js'
import type { ToolExecutionInput, ToolExecutorOptions } from '../executor.js'

class ReverseToolExecutor extends ToolExecutor {
  override async *execute(
    options: ToolExecutorOptions,
    input: ToolExecutionInput
  ): AsyncGenerator<AgentStreamEvent, void, undefined> {
    for (const toolUseBlock of [...input.toolUseBlocks].reverse()) {
      const result = yield* this.executeTool(options, toolUseBlock, input.invocationState)
      input.toolResultBlocks.push(result)
      yield new ToolResultEvent({ agent: options.agent, result, invocationState: input.invocationState })
    }
  }
}

describe('ToolExecutor', () => {
  describe('when subclassed and configured on an Agent', () => {
    it('schedules tool uses with the subclass and runs each one through the tool lifecycle', async () => {
      const toolCalls: string[] = []
      const hookCalls: string[] = []
      const model = new MockMessageModel()
        .addTurn([
          { type: 'toolUseBlock', name: 'first', toolUseId: 'tool-1', input: {} },
          { type: 'toolUseBlock', name: 'second', toolUseId: 'tool-2', input: {} },
        ])
        .addTurn({ type: 'textBlock', text: 'done' })
      const tools = ['first', 'second'].map((name) =>
        createMockTool(name, () => {
          toolCalls.push(name)
          return `${name} result`
        })
      )
      const agent = new Agent({ model, tools, toolExecutor: new ReverseToolExecutor(), printer: false })
      agent.addHook(BeforeToolCallEvent, (event) => {
        hookCalls.push(event.toolUse.name)
      })

      const result = await agent.invoke('Go')

      expect({ toolCalls, hookCalls, stopReason: result.stopReason }).toEqual({
        toolCalls: ['second', 'first'],
        hookCalls: ['second', 'first'],
        stopReason: 'endTurn',
      })
      expect(agent.messages[2]!.content).toMatchObject([
        { type: 'toolResultBlock', toolUseId: 'tool-2', status: 'success', content: [{ text: 'second result' }] },
        { type: 'toolResultBlock', toolUseId: 'tool-1', status: 'success', content: [{ text: 'first result' }] },
      ])
    })
  })
})
