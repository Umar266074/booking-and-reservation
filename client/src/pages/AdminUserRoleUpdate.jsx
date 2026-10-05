import { useState } from "react";
import useUsers from "../hooks/useUser";
import useAuth from "../hooks/useAuth";
import Button from "../components/Button";

const ROLES = ["customer", "provider", "admin"];

export default function AdminUserRoleUpdate() {
  const { users, loading, error, changeRole } = useUsers();
  const { userId } = useAuth();

  const [chosen, setChosen] = useState({});          // { [userId]: naya role } sirf badli hui rows ke liye
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
      setMessage({ type: "success", text: `${user.name} ab ${roleOf(user)} hai.` });
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
        Role badalne ke baad us user ko dobara login karna hoga, tab naya role uske token mein aayega.
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
                <td>{user.name}{isMe && " (aap)"}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={roleOf(user)}
                    onChange={(e) => setChosen({ ...chosen, [user.id]: e.target.value })}
                    disabled={isMe}                      // admin apna role galti se na hata de
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
