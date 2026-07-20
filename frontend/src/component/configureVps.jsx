import React, { useState } from "react";
import { 
  Server, 
  Key, 
  Upload, 
  Terminal, 
  Shield, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Lock,
  User,
  Globe,
  Hash,
  FileText,
  X
} from "lucide-react";

export default function ConfigureVps({onConnected}) {
  const [authType, setAuthType] = useState("password");
  const [formData, setFormData] = useState({
    host: "",
    port: "",
    username: "",
    password: "",
    privateKey: "",
    privateKeyName: "",
    passphrase: "",
    sshCommand: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const fileContent = await readFileAsText(file);
        
        setSelectedFile({
          name: file.name,
          size: file.size,
          content: fileContent
        });
        
        setFormData(prev => ({ 
          ...prev, 
          privateKey: fileContent,
          privateKeyName: file.name
        }));
        
        console.log("📄 File uploaded:", file.name);
        console.log("📏 File size:", file.size, "bytes");
        console.log("📝 File content preview:", fileContent.substring(0, 100) + "...");
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Error reading file. Please make sure it's a valid text file.");
      }
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({ 
      ...prev, 
      privateKey: "",
      privateKeyName: ""
    }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    let payload = {};

    switch (authType) {
      case "password":
        payload = {
          connectionType: "password",
          host: formData.host,
          port: formData.port || 22,
          username: formData.username,
          password: formData.password,
        };
        break;

      case "pem":
        payload = {
          connectionType: "pem",
          host: formData.host,
          port: formData.port || 22,
          username: formData.username,
          privateKey: formData.privateKey,
          passphrase: formData.passphrase,
        };
        break;

      case "paste-key":
        payload = {
          connectionType: "paste-key",
          host: formData.host,
          port: formData.port || 22,
          username: formData.username,
          privateKey: formData.privateKey,
          passphrase: formData.passphrase,
        };
        break;

      case "ssh-command":
        payload = {
          connectionType: "ssh-command",
          sshCommand: formData.sshCommand,
        };
        break;
    }

    try {
      let response = await fetch("/connection", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-type": 'application/json'
        }
      });
      let json = await response.json();
      console.log(json);
      if (json.success) {
        sessionStorage.setItem(
        "connection_id",
        json.connection_id
    );
        onConnected(json.connection_id);
      } else {
        alert(json.message);
      }
    } catch(e) {
      console.log(e);
    }
  }

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f0f2f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: 20
    }}>
      <div style={{
        width: "100%",
        maxWidth: 900,
        background: "white",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        border: "1px solid #e4e7eb",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #e4e7eb",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <div style={{
            background: "#667eea",
            padding: 10,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#1a1a2e",
              margin: 0
            }}>
              Connect to VPS
            </h1>
            <p style={{
              fontSize: 13,
              color: "#6b7280",
              margin: "2px 0 0 0"
            }}>
              Secure SSH connection to your Linux server
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {/* Connection Type */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block",
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
              marginBottom: 6
            }}>
              Authentication Method
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "2px solid #e4e7eb",
                borderRadius: 8,
                fontSize: 14,
                background: "white",
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.2s",
                color: "#1a1a2e"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
            >
              <option value="password">🔐 Username + Password</option>
              <option value="pem">📄 Private Key File (.pem/.key)</option>
              <option value="paste-key">📋 Paste Private Key</option>
              <option value="ssh-command">⚡ Paste SSH Command</option>
            </select>
          </div>

          {/* Connection Details */}
          {authType !== "ssh-command" && (
            <div style={{
              background: "#f8f9fa",
              borderRadius: 8,
              padding: 16,
              border: "1px solid #e4e7eb",
              marginBottom: 16
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12
              }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4
                  }}>
                    Host / IP Address
                  </label>
                  <input
                    name="host"
                    value={formData.host}
                    onChange={handleInputChange}
                    placeholder="44.220.154.190"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "2px solid #e4e7eb",
                      borderRadius: 6,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: "white"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
                  />
                </div>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4
                  }}>
                    Port
                  </label>
                  <input
                    name="port"
                    value={formData.port}
                    onChange={handleInputChange}
                    defaultValue="22"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "2px solid #e4e7eb",
                      borderRadius: 6,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: "white"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    marginBottom: 4
                  }}>
                    Username
                  </label>
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="ec2-user"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "2px solid #e4e7eb",
                      borderRadius: 6,
                      fontSize: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      background: "white"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#667eea"}
                    onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password Field */}
          {authType === "password" && (
            <div style={{
              background: "#f8f9fa",
              borderRadius: 8,
              padding: 16,
              border: "1px solid #e4e7eb",
              marginBottom: 16
            }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 4
              }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #e4e7eb",
                  borderRadius: 6,
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "white"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
              />
            </div>
          )}

          {/* PEM Upload */}
          {authType === "pem" && (
            <div style={{
              background: "#f8f9fa",
              borderRadius: 8,
              padding: 16,
              border: "1px solid #e4e7eb",
              marginBottom: 16
            }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 4
              }}>
                Upload Private Key
              </label>
              
              <input
                type="file"
                accept=".pem,.key,.txt"
                onChange={handleFileUpload}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px solid #e4e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                  background: "white",
                  cursor: "pointer"
                }}
              />

              {selectedFile && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: 6
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <p style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1a1a2e",
                          margin: 0
                        }}>
                          {selectedFile.name}
                        </p>
                        <p style={{
                          fontSize: 11,
                          color: "#6b7280",
                          margin: 0
                        }}>
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      style={{
                        padding: 4,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: 4
                      }}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <label style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4
                }}>
                  Passphrase (Optional)
                </label>
                <input
                  name="passphrase"
                  type="password"
                  value={formData.passphrase}
                  onChange={handleInputChange}
                  placeholder="Enter passphrase if key is encrypted"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "2px solid #e4e7eb",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    background: "white"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
                />
              </div>
            </div>
          )}

          {/* Paste Key */}
          {authType === "paste-key" && (
            <div style={{
              background: "#f8f9fa",
              borderRadius: 8,
              padding: 16,
              border: "1px solid #e4e7eb",
              marginBottom: 16
            }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 4
              }}>
                Private Key
              </label>
              <textarea
                name="privateKey"
                value={formData.privateKey}
                onChange={handleInputChange}
                rows={6}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #e4e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "monospace",
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "white",
                  resize: "vertical",
                  minHeight: 100
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
              />
              {formData.privateKey && (
                <div style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#6b7280"
                }}>
                  {formData.privateKey.length} characters
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <label style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4
                }}>
                  Passphrase (Optional)
                </label>
                <input
                  name="passphrase"
                  type="password"
                  value={formData.passphrase}
                  onChange={handleInputChange}
                  placeholder="Enter passphrase if key is encrypted"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "2px solid #e4e7eb",
                    borderRadius: 6,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    background: "white"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#667eea"}
                  onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
                />
              </div>
            </div>
          )}

          {/* SSH Command */}
          {authType === "ssh-command" && (
            <div style={{
              background: "#f8f9fa",
              borderRadius: 8,
              padding: 16,
              border: "1px solid #e4e7eb",
              marginBottom: 16
            }}>
              <label style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 4
              }}>
                Paste SSH Command
              </label>
              <textarea
                name="sshCommand"
                value={formData.sshCommand}
                onChange={handleInputChange}
                rows={3}
                placeholder="ssh -i ~/Downloads/mykey.pem ec2-user@44.220.154.190"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "2px solid #e4e7eb",
                  borderRadius: 6,
                  fontSize: 13,
                  fontFamily: "monospace",
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "white",
                  resize: "vertical"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e4e7eb"}
              />
              <div style={{
                marginTop: 8,
                padding: 8,
                background: "#eef2ff",
                borderRadius: 6,
                display: "flex",
                alignItems: "flex-start",
                gap: 6
              }}>
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" style={{ marginTop: 1 }} />
                <p style={{
                  fontSize: 12,
                  color: "#4b5563",
                  margin: 0
                }}>
                  We'll automatically extract the username, host, port, and key information from your SSH command.
                </p>
              </div>
            </div>
          )}

          {/* Connect Button */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 8
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Server className="w-4 h-4" />
            Connect VPS
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}