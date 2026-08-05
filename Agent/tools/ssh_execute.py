from collections import deque

from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from typing_extensions import Annotated

from vps_connection.connection import connection_manager


MAX_LINES = 200          # Keep only the last 200 lines
MAX_CHARS = 5000         # Maximum characters returned
import os
import psutil

@tool
def run_shell_command(
    command: str,
    state: Annotated[dict, InjectedState],
) -> dict:
    """
    Execute a shell command on the connected VPS.

    Returns only the last portion of stdout/stderr to prevent
    huge outputs from consuming memory.
    """
    

    process = psutil.Process(os.getpid())

    print(
        "RAM:",
        round(process.memory_info().rss / 1024 / 1024, 2),
        "MB"
    )

    connection_id = state.get("connection_id")

    ssh = connection_manager.get(connection_id)

    if ssh is None:
        raise Exception("VPS not connected.")

    stdin, stdout, stderr = ssh.exec_command(command)

    stdout_lines = deque(maxlen=MAX_LINES)
    stderr_lines = deque(maxlen=MAX_LINES)

    # Read stdout incrementally
    for line in iter(stdout.readline, ""):
        stdout_lines.append(line)

    # Read stderr incrementally
    for line in iter(stderr.readline, ""):
        stderr_lines.append(line)

    exit_code = stdout.channel.recv_exit_status()

    stdout_text = "".join(stdout_lines)
    stderr_text = "".join(stderr_lines)

    if len(stdout_text) > MAX_CHARS:
        stdout_text = (
            "...OUTPUT TRUNCATED...\n\n"
            + stdout_text[-MAX_CHARS:]
        )

    if len(stderr_text) > MAX_CHARS:
        stderr_text = (
            "...OUTPUT TRUNCATED...\n\n"
            + stderr_text[-MAX_CHARS:]
        )

    return {
        "command": command,
        "success": exit_code == 0,
        "exit_code": exit_code,
        "stdout": stdout_text,
        "stderr": stderr_text,
    }