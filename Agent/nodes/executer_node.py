
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.types import Command,interrupt
from Agent.nodes.llm import llm
from Agent.state import AgentState
from Agent.tools.ssh_execute import run_shell_command

# Tool-enabled LLM
devops_llm = llm.bind_tools([run_shell_command])

system_message = SystemMessage(
    content="""You are a Linux execution agent.

Your only responsibility is to complete the current task.

Before executing any command:

- Read the deployment plan.
- Read completed tasks.
- Read the previous command output.
- Read the conversation.

If you already have enough information to complete the task,
execute the command.

If information is missing,
use Linux commands to inspect the VPS.

Examples:

- ls
- cat
- grep
- find
- systemctl status
- journalctl
- ss
- ps
- npm
- node

Execute exactly ONE shell command.

Always use run_shell_command.

Never answer normally.
never open large files like 
 - node_modules/
  - .next/
  - dist/
  - target/
  - vendor/
  - .git/
  - coverage/
  - .cache/
  - __pycache__/
- once again never open large file like venv files   nodemodules files etc and never logout vps from tool never execute command to logout vps it will be done by user from frontend
"""
)

def devops_Execute_command(state:AgentState):

    if state["Intrupt"]=='YES':
        
        answer = interrupt(state["Intrupt_Question"])

        # Graph resumes here after user answers
        state["messages"].append(
            HumanMessage(content=answer)
        )
    


    response = devops_llm.invoke(
        [
            system_message,
            HumanMessage(
                content=f"""
Plan:
{state['plan']}

Completed Tasks:
{state['Completed_task'][-4:]}

Current Task:
{state['task_to_execute']}

Conversation:
{state["messages"][-4:]}


"""
            ),
        ]
    )

    return {
        "messages": [response],
    }