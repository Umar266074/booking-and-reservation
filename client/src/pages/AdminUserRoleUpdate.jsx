import { useState } from "react";
import useUsers from "../hooks/useUser";
import useAuth from "../hooks/useAuth";
import Button from "../components/Button";

const ROLES = ["customer", "provider"];

export default function AdminUserRoleUpdate() {
  const { users, loading, error, changeRole } = useUsers();
  const { userId } = useAuth();

  const [chosen, setChosen] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const roleOf = (user) => chosen[user.id] ?? user.role;
  const isChanged = (user) => roleOf(user) !== user.role;

  const handleSave = async (user) => {
    setSavingId(user.id);
    setMessage({ type: "", text: "" });
    try {
      await changeRole(user.id, roleOf(user));
      setChosen((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      setMessage({ type: "success", text: `${user.name} is ${roleOf(user)} now.` });
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Users</h2>
      </div>
      <p className="meta">
        User have to login again after changing the role.
      </p>

      {message.text && (
        <p className={message.type === "success" ? "success" : "field-error"}>{message.text}</p>
      )}
      {loading && <p>Loading...</p>}
      {error && <p className="field-error">{error}</p>}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isMe = user.id === userId;
            return (
              <tr key={user.id}>
                <td>{user.name}{isMe && " (you)"}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={roleOf(user)}
                    onChange={(e) => setChosen({ ...chosen, [user.id]: e.target.value })}
                    disabled={isMe}
                    aria-label={`Role of ${user.name}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {isChanged(user) && (
                    <Button onClick={() => handleSave(user)} disabled={savingId === user.id}>
                      {savingId === user.id ? "Saving..." : "Save"}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
