# import io
# import paramiko

# HOST = "34.226.208.97"
# PORT = 22
# USERNAME = "ec2-user"

# # Imagine this comes from a textarea in your frontend
# PRIVATE_KEY = """-----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEAvyMekKzyqyHrxSQ763jMhUNeJy1IQjcbLtOQjnnpNhBNdvyF
# fG59m6mkAhaHGKEtCcE8RTX3wYuNMNjs6csQZZGvHNqsjicW+VodLfqUtPR8rFXo
# Yqeu98l9FFqK2zEjhRQxuZYhDiwM0T81WTDL7HYIZvYd2r4YlnwzwV9X85bPAXzt
# UBq1K3naAGJC4KQmAq6XecS19bt4nRt6uYfJDsH1BXMFPc+xpA+CwmIv7pzNcw6V
# Job69CzEBdYTZO6Gh4R0n8Ary/COlWLino/dKDP/FYwTAUoHBooz+DFVRT97mv7o
# zkntltxbRcMdqPs+mwXuiZHIli6xQrNjjPYoJQIDAQABAoIBAQCCS+qWLY/v4Vvc
# NGs0hlDFt7sDcfcETJSXQ1oUBj9Yv5xPNK26uYefCfHoCntl6tnNAJGZjMSsh/lk
# BzzZ07gFxV5eiSOAdF1Q9oFVyrB8+v3SbW3RcwXvnMdLjL2D1uej3LRZE2LNSnIi
# Yrh3aLBbLctkhPqtF1GjpF+Tvu8x+brXCp5FPhDx7DGrwKLM8zHGHnB8hwZiKHZw
# e63OgGFhj4n7kU5nMkklrwsk0jtckl+iLsQieHmYr2V6p8rs41E6VPxJ6yuar0sl
# z9JogZttn5KlP26A3EKFZOYWpXFA2mgg6o1K+BsRFuNdMBVQsQdqN8DImkEFQ+LA
# oZPGpBgxAoGBAOFyid1Po5mcNeRH10eFFOj/m22QZBB41czrAM3ollmov/D+s7bq
# CVpLM2ozNwuMCQwXogUSQH1fELOsUUztq4gHNpAZHD4py8sVPjtVj9uwmtV6Y748
# Ds70H6I1UWwf33XO2tFbhRL5+rlivIvXW1/3qrMfJVhbzqtLwybhfZDPAoGBANkK
# QPwnRJQB4oD8lLVfPQGvnqqX/UTe72K2DqyqieFwrv//WRd/knJwfWIilflS+zHZ
# ITWmgVPKpXu4ikRjPTqcyCiysmHmHAU6/2f/4h4fUF1+W33GEET3fOin4Hv8KnOd
# I2/pvd/a0xNAaEQFnixGQfq1eJmUWyn+KBG3I2zLAoGAKXZcPpSH/RdKngpMYH3s
# Q5HG7xaQIKtofsB1rGjrReAQNO1S9gAC6lVMRmrW48vEWjH6fT5HGAek1baKWUCY
# vHK/KS9FD3W2Ykos4NKym2/Weg6BS5pWCt/A9Z8is2UFPvBlM/3F8qCA6Rlsnbdk
# ubid70V6I872qnBLmtn7sucCgYEAnGpuYQrvuncNRQZDKd9EOTXW9Hzq8zpzbUFl
# m/yft9Ac3rOpAm1XHpCBXDsuuGucStV/wImKBNgzoNFjHFwk4VviSKpYMoPCx+Y3
# 8TyROkI5CdgpmaAnU3zFEWsDNneKJJ4nzty2kWDD48j0G6msz52mqUclbhFkDgRz
# 3iiNKDcCgYBUamov/zhK8QxqN5y3FzKqfZZoyv0VXkzAt0EoCok07Q47Zx1rASOh
# xa+JztrbaMIlyoz3Vo+nLErGmhM0PGzF2n9jlgWiBL378eUeo1SYaR6OsTYQFrP4
# QFxaeqdqyoSI2obncZHtL4yUw7c72doWML0IivsdL/5mSLdWfXRFmQ==
# -----END RSA PRIVATE KEY-----
# """
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