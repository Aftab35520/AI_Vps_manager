

from vps_connection.connection import connection_manager
from langgraph.prebuilt import InjectedState
from typing_extensions import Annotated
from langchain_core.tools import tool


@tool
def run_shell_command(
    command: str,
     state: Annotated[dict, InjectedState],
) -> dict:
    """
    Execute a shell command on the connected VPS.
    read file folder edit etc  everything on vps 

    Args:
        command: Linux shell command to execute.

    Returns:
        Dictionary containing command, stdout, stderr and success status.
    """
    connection_id=state.get("connection_id")
    ssh = connection_manager.get(connection_id)
    print("ssh:",ssh)

    if ssh is None:
        raise Exception("VPS not connected.")

    stdin, stdout, stderr = ssh.exec_command(command)

    stdout_text = stdout.read().decode().strip()
    stderr_text = stderr.read().decode().strip()

    exit_code = stdout.channel.recv_exit_status()

    return {
        "command": command,
        "success": exit_code == 0,
        "exit_code": exit_code,
        "stdout": stdout_text,
        "stderr": stderr_text,
    }