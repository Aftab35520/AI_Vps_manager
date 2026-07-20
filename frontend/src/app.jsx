import { useEffect, useState } from "react";
import ConfigureVps from "./component/configureVps";
import ChatBox from "./component/ChatBox";

export default function App() {

  const [connectionId, setConnectionId] = useState(undefined);

  useEffect(() => {

    const id = sessionStorage.getItem("connection_id");

    if (!id) {
      setConnectionId(null);
      return;
    }

    fetch(`http://127.0.0.1:5000/connection/${id}`)
      .then(r => r.json())
      .then(json => {

        if (json.success) {
          setConnectionId(id);
        } else {
          sessionStorage.removeItem("connection_id");
          setConnectionId(null);
        }

      })
      .catch(() => {
        sessionStorage.removeItem("connection_id");
        setConnectionId(null);
      });

  }, []);

  if (connectionId === undefined) {
    return <div>Checking connection...</div>;
  }

  if (!connectionId) {
    return (
      <ConfigureVps
        onConnected={(id) => {
          sessionStorage.setItem("connection_id", id);
          setConnectionId(id);
        }}
      />
    );
  }

  return (
    <ChatBox
      connectionId={connectionId}
      onDisconnected={() => {
        sessionStorage.removeItem("connection_id");
        setConnectionId(null);
      }}
    />
  );
}