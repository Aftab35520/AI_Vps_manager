from flask import Flask,jsonify,request,json,Response,send_from_directory
from flask_cors import CORS
import os
cancel_requests = {}
app = Flask(
    __name__,
    static_folder="frontend/dist",
    static_url_path=""
)
CORS(app)
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from vps_connection.connection import connection_manager
@app.route("/",methods=["GET"])
def Home():
    return send_from_directory(app.static_folder, "index.html")



@app.route("/<path:path>")
def serve_react(path):
    file_path = os.path.join(app.static_folder, path)

    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, "index.html")

@app.route("/connection", methods=["POST"])
def connection():

    data = request.get_json()

    try:

        connection_id = connection_manager.connect(data)

        return jsonify({
            "success": True,
            "connection_id": connection_id,
            "message": "VPS connected successfully."
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 400
    

cancel_requests = {}

@app.route("/cancel/<connection_id>", methods=["POST"])
def cancel_execution(connection_id):

    cancel_requests[connection_id] = True

    return jsonify({
        "success": True
    })


from langgraph.types import Command
from Agent.graph import graph


@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    connection_id = data["connection_id"]
    message = data["message"]

    cancel_requests[connection_id] = False

    config = {
        "configurable": {
            "thread_id": connection_id
        }
    }

    def generate():

        try:

            ssh = connection_manager.get(connection_id)

            if ssh is None:

                yield json.dumps({
                    "type": "error",
                    "reason": "connection_lost",
                    "message": "Connection expired."
                }) + "\n"

                cancel_requests.pop(connection_id, None)
                return

            transport = ssh.get_transport()

            if transport is None or not transport.is_active():

                connection_manager.disconnect(connection_id)

                yield json.dumps({
                    "type": "error",
                    "reason": "connection_lost",
                    "message": "Connection expired."
                }) + "\n"

                cancel_requests.pop(connection_id, None)
                return

            state = graph.get_state(config)

            if state.interrupts:
                inputs = Command(resume=message)
            else:
                inputs = {
                    "messages": message,
                    "connection_id": connection_id
                }

            for event in graph.stream(
                inputs,
                config=config,
                stream_mode="updates",
            ):

                # Stop execution if requested
                if cancel_requests.get(connection_id):

                    yield json.dumps({
                        "type": "cancelled",
                        "content": "Execution stopped by user."
                    }) + "\n"

                    cancel_requests.pop(connection_id, None)
                    return

                print("=" * 80)
                print(event)

                # Interrupt
                if "__interrupt__" in event:

                    interrupt = event["__interrupt__"][0]

                    value = interrupt.value

                    if isinstance(value, dict):
                        text = value.get("question", str(value))
                    else:
                        text = str(value)

                    yield json.dumps({
                        "type": "interrupt",
                        "content": text
                    }) + "\n"

                    cancel_requests.pop(connection_id, None)
                    return

                # Stream node messages
                for node_name, update in event.items():

                    if not isinstance(update, dict):
                        continue

                    for msg in update.get("messages", []):

                        content = getattr(msg, "content", None)

                        if content:

                            yield json.dumps({
                                "type": "node",
                                "node": node_name,
                                "content": content
                            }) + "\n"

            cancel_requests.pop(connection_id, None)

            yield json.dumps({
                "type": "done"
            }) + "\n"

        except Exception as e:

            import traceback
            traceback.print_exc()

            cancel_requests.pop(connection_id, None)

            yield json.dumps({
                "type": "error",
                "message": str(e)
            }) + "\n"

    return Response(
        generate(),
        mimetype="application/x-ndjson"
    )

@app.route("/connection/<connection_id>", methods=["GET"])
def verify_connection(connection_id):

    ssh = connection_manager.get(connection_id)

    if ssh is None:
        return jsonify({
            "success": False
        }), 404

    transport = ssh.get_transport()

    if transport is None or not transport.is_active():

        connection_manager.disconnect(connection_id)

        return jsonify({
            "success": False
        }), 404

    return jsonify({
        "success": True
    })

@app.route("/connection/<connection_id>", methods=["DELETE"])
def disconnect_connection(connection_id):

    ssh = connection_manager.get(connection_id)

    if ssh is None:
        return jsonify({
            "success": False,
            "message": "Connection not found."
        }), 404

    connection_manager.disconnect(connection_id)

    return jsonify({
        "success": True,
        "message": "Disconnected successfully."
    })

if __name__=="__main__":
    app.run(debug=True)