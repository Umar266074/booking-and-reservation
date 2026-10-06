import { useState } from "react";
import useResources from "../hooks/useResources";
import useAuth from "../hooks/useAuth";
import ResourceCard from "../components/ResourceCard";
import ResourceForm from "../components/ResourceForm";
import Button from "../components/Button";

export default function ResourceListPage() {
  const { items, loading, error, create, remove } = useResources();
  const { canManageResources, canEditResource } = useAuth();
  const [showForm, setShowForm] = useState(false);

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

      {loading && <p>Loading...</p>}
      {error && <p className="field-error">{error}</p>}
      {!loading && items.length === 0 && <p>Resources not Found.</p>}

      <div className="grid">
        {items.map((r) => (
          <ResourceCard key={r.id} resource={r} canManage={canEditResource(r)} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}