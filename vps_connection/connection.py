# import io
# import paramiko

# HOST = "34.226.208.97"
# PORT = 22
# USERNAME = "ec2-user"

# # Load RSA private key
# key_file = io.StringIO(PRIVATE_KEY)
# private_key = paramiko.RSAKey.from_private_key(key_file)

# # Create SSH client
# ssh = paramiko.SSHClient()
# ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

# print("Connecting...")

# ssh.connect(
#     hostname=HOST,
#     port=PORT,
#     username=USERNAME,
#     pkey=private_key,
#     timeout=10,
# )

# print("Connected!")

# # Execute a command
# stdin, stdout, stderr = ssh.exec_command("hostname")

# print("STDOUT:")
# print(stdout.read().decode())

# print("STDERR:")
# print(stderr.read().decode())

# stdin, stdout, stderr = ssh.exec_command("ls -la")

# print(stdout.read().decode())
# print(stderr.read().decode())

# ssh.close()


# connection_manager.py
import uuid
import io
import shlex
import paramiko


class ConnectionManager:

    def __init__(self):
        self.connections = {}

    def connect(self, data):

        connection_type = data["connectionType"]

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        if connection_type == "password":

            ssh.connect(
                hostname=data["host"],
                port=data.get("port", 22),
                username=data["username"],
                password=data["password"],
            )

        elif connection_type in ["pem", "paste-key"]:

            key_file = io.StringIO(data["privateKey"])

            try:
                key = paramiko.RSAKey.from_private_key(
                    key_file,
                    password=data.get("passphrase") or None,
                )
            except Exception:
                key_file.seek(0)
                key = paramiko.Ed25519Key.from_private_key(
                    key_file,
                    password=data.get("passphrase") or None,
                )

            ssh.connect(
                hostname=data["host"],
                port=data.get("port", 22),
                username=data["username"],
                pkey=key,
            )

        elif connection_type == "ssh-command":

            parsed = self.parse_ssh_command(data["sshCommand"])

            ssh.connect(
                hostname=parsed["host"],
                port=parsed["port"],
                username=parsed["username"],
                pkey=parsed["key"],
            )

        connection_id = str(uuid.uuid4())

        self.connections[connection_id] = ssh

        return connection_id

    def get(self, connection_id):

        return self.connections.get(connection_id)

    def disconnect(self, connection_id):

        ssh = self.connections.pop(connection_id, None)

        if ssh:
            ssh.close()

    def parse_ssh_command(self, command):

        tokens = shlex.split(command)

        host = ""
        username = ""
        port = 22
        key = None

        i = 0

        while i < len(tokens):

            if tokens[i] == "-i":

                with open(tokens[i + 1]) as f:
                    key = paramiko.RSAKey.from_private_key(f)

                i += 2
                continue

            if tokens[i] == "-p":

                port = int(tokens[i + 1])

                i += 2
                continue

            if "@" in tokens[i]:

                username, host = tokens[i].split("@", 1)

            i += 1

        return {
            "host": host,
            "username": username,
            "port": port,
            "key": key,
        }


connection_manager = ConnectionManager()