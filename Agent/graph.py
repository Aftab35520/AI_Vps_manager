
from Agent.state import AgentState
from langgraph.graph import StateGraph,START,END

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import ToolNode ,tools_condition 
from Agent.tools.ssh_execute import run_shell_command
from Agent.nodes.Plantask_node import Plantask_node
from Agent.nodes.devops_node import devops_node
from Agent.nodes.executer_node import devops_Execute_command


def route_node(state:AgentState):
    if state["workflow_status"]=="RUNNING":
        return "devops_Execute_command"
    return END

def route_plan_not(state:AgentState):
    if state["Intrupt"]=="YES":
        return END
    return "Plantask_node"

graph=StateGraph(AgentState)



graph.add_node("Plantask_node",Plantask_node)
graph.add_node("devops_Execute_command",devops_Execute_command)
graph.add_node("devops_node",devops_node)
graph.add_node("tools",ToolNode([run_shell_command]))
graph.add_edge(START,"Plantask_node")
graph.add_conditional_edges(
    "Plantask_node",
    route_plan_not,
    {
        "Plantask_node":"devops_node",
        END:END
    }
)
graph.add_conditional_edges(
    "devops_node",
    route_node,
    {
        "devops_Execute_command":"devops_Execute_command",
        END:END
    }
)
graph.add_conditional_edges(
    "devops_Execute_command",
    tools_condition,
    {
        "tools":"tools",
        END:"devops_node"
    }
)
graph.add_edge("tools","devops_node")

graph=graph.compile(checkpointer=InMemorySaver())

# Generate PNG
png = graph.get_graph().draw_mermaid_png()

# Save to file
with open("graph.png", "wb") as f:
    f.write(png)

print("Saved graph.png")
config = {
    "configurable": {
        "thread_id": "vps-session-1"
    }
}

# from langgraph.types import Command

# config = {
#     "configurable": {
#         "thread_id": "vps-session-1"
#     }
# }

# while True:

#     user = input("> ")

#     # Is the graph currently paused?
#     state = graph.get_state(config)

#     if state.interrupts:
#         inputs = Command(resume=user)
#     else:
#         inputs = {
#             "messages": user
#         }

#     for event in graph.stream(
#         inputs,
#         config=config,
#         stream_mode="updates",
#     ):

#         # -----------------------------
#         # Handle interrupt
#         # -----------------------------
#         if "__interrupt__" in event:

#             interrupt_obj = event["__interrupt__"][0]

#             print(f"\nAI: {interrupt_obj.value}\n")

#             continue

#         # -----------------------------
#         # Handle normal node updates
#         # -----------------------------
#         for node_name, update in event.items():

#             if not isinstance(update, dict):
#                 continue

#             messages = update.get("messages", [])

#             for msg in messages:
#                 print(f"\nAI: {msg.content}\n")