import { useState } from "react";
import useResources from "../hooks/useResources";
import useAuth from "../hooks/useAuth";
import ResourceCard from "../components/ResourceCard";
import ResourceForm from "../components/ResourceForm";
import Button from "../components/Button";
import Input from "../components/Input";

export default function ResourceListPage() {
  const { items, loading, error, create, remove } = useResources();
  const { canManageResources } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = items.filter((r) =>
    `${r.name} ${r.description ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreate = async (data) => {
    await create(data);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Is resource ko deactivate karna hai?")) return;
    try {
      await remove(id);
    } catch (err) {
      alert(err);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Resources</h2>
        {canManageResources && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Resource"}
          </Button>
        )}
      </div>

      {showForm && <ResourceForm onSubmit={handleCreate} submitLabel="Create" />}

      {/* 🔍 Search Input */}
      <Input
        name="search"
        placeholder="Search resources..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading && <p>Loading...</p>}
      {error && <p className="field-error">{error}</p>}
      {!loading && items.length === 0 && <p>Koi resource nahi mila.</p>}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <p>Koi resource search se match nahi hua.</p>
      )}

      <div className="grid">
        {filtered.map((r) => (
          <ResourceCard
            key={r.id}
            resource={r}
            canManage={canManageResources}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}