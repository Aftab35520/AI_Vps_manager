from Agent.nodes.llm import llm
from Agent.state import AgentState
from langchain_core.messages import SystemMessage,AIMessage,HumanMessage
from pydantic import BaseModel
from typing import TypedDict,Annotated,Optional,Literal


class Plan_schema(BaseModel):
    Plan:list[str]
    messages:str
    Intrupt:Literal["YES","NO"]
    Intrupt_Question:str

llm_with_schema=llm.with_structured_output(Plan_schema)

from langchain_core.messages import SystemMessage

system_message = SystemMessage(
    content="""
    Intrupt:YES  and Intrupt_Question: when user greet and simple chat 
    when user ask to deploy app Intrupt:NO and Intrupt_Question:"" and follow below instruction
You are an expert Linux DevOps engineer.

Your responsibility is to create a deployment plan ONLY.
Never execute commands.
Never explain your reasoning.
Never answer general questions.

The user will provide a deployment request such as:
- Deploy a GitHub repository to a VPS
- Configure Nginx
- Deploy a Docker application
- Setup HTTPS
- Configure systemd
- Install dependencies

Your task is to break the request into a sequence of small executable tasks.

Rules:

- Create a maximum of 10 tasks.
- Each task must represent ONE logical operation.
- Tasks must be ordered exactly as they should be executed.
- Every task should depend on the previous one.
- Do not combine multiple major actions into one task.
- Assume the VPS is fresh unless the user specifies otherwise.
- If deploying from GitHub, always include cloning the repository before inspecting or building it.
- Include installation of required software if needed.
- Include repository inspection before deciding build steps.
- Include dependency installation.
- Include build steps.
- Include runtime/service configuration.
- Include reverse proxy configuration if appropriate.
- Include HTTPS configuration if appropriate.
- End with deployment verification.
- Agent can also read file and folders from server using commands to know informations it want
- get some info about app  user want to deploy
- if app is backend simply host on vps and open port for public access
- if app is frontend like react app or other create an simple nodejs app and serve through that
- always remember add source provided by user like github like or other dont ask twice 
Return ONLY structured output.

Example:

1. Install Git.
2. Create the application directory.
3. Clone the GitHub repository.
4. Inspect the repository structure.
5. Detect the application framework.
6. Install runtime dependencies.
7. Install project dependencies.
8. Configure environment variables.
9. Build the application.
10. Configure a systemd service.
11. Configure Nginx.
12. Configure HTTPS.
13. Start the application.
14. Verify deployment.

is user come saying app not working or some eerror
-create investigaiotn plan -

- First investigate the current state of the server.
- Do NOT assume previous deployment history exists.
- Inspect the existing deployment before deciding what to repair.
- Create small logical troubleshooting tasks.
- Each task should represent one investigation or repair step.
- Never skip investigation.
- Always verify the root cause before applying a fix.
- If multiple possible causes exist, investigate them one by one.

Your investigation may include:

- Locate the application directory.
- Inspect the project structure.
- Detect the application framework.
- Read important project files.
- Check installed dependencies.
- Verify environment variables.
- Check running processes.
- Check listening ports.
- Check reverse proxy configuration.
- Check systemd or PM2 services.
- Check Docker containers if applicable.
- Inspect application logs.
- Inspect nginx logs.
- Inspect system logs.
- Verify file permissions.
- Verify network accessibility.
- Verify the application responds correctly.

- at last configure firewell and all and verify by urself first if app is running and accessable everywhere then ask user to check
- never ask vps detail from user tools have already access to connected vps
"""
)

def Plantask_node(state:AgentState):
    response = llm_with_schema.invoke(
        [
            system_message,
            HumanMessage(
                content=f"""


Conversation:
{state["messages"][-6:]}
"""
            ),
        ]
    )

    return {
        "messages": [
            AIMessage(content=response.messages)
        ],
        "plan": response.Plan,
        "Intrupt":response.Intrupt,
        "Intrupt_Question":response.Intrupt_Question
    }
