from typing import TypedDict,Annotated,Optional,Literal
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages:Annotated[list,add_messages]
    plan: list[str]
    task_to_execute:str
    Completed_task:list[str]
    workflow_status:Literal["RUNNING", "COMPLETED"]
    Intrupt:Literal["YES","NO"]
    Intrupt_Question:str
    connection_id:str
 
 
