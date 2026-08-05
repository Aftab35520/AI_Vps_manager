from typing import Annotated, Literal, TypedDict
from langchain_core.messages import BaseMessage


def keep_last_5_messages(
    left: list[BaseMessage],
    right: list[BaseMessage] | BaseMessage,
) -> list[BaseMessage]:
    if not isinstance(right, list):
        right = [right]

    return (left + right)[-20:]


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], keep_last_5_messages]
    plan: list[str]
    task_to_execute: str
    Completed_task: list[str]
    workflow_status: Literal["RUNNING", "COMPLETED"]
    Intrupt: Literal["YES", "NO"]
    Intrupt_Question: str
    connection_id: str