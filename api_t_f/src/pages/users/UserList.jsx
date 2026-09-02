import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Loader2,
  X,
  UserCircle,
} from "lucide-react";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ១. កែសម្រួលតម្លៃ default នៃ role មកជា ID វិញ (ឧ. '3' សម្រាប់ Cashier)
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    password: "",
    role_id: "3",
  });

  // Map រវាង Role Name និង Role ID តាម Database របស់អ្នក
  const roleMapToId = { Admin: "1", Manager: "2", Cashier: "3" };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/users");
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedUserId(null);
    setFormData({ full_name: "", username: "", password: "", role_id: "3" });
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    const userId = u.user_id || u.id;

    // ស្វែងរក Role Name រួចបម្លែងទៅជា Role ID
    let currentRoleName = "Cashier";
    if (Array.isArray(u.roles) && u.roles.length > 0) {
      currentRoleName =
        typeof u.roles[0] === "string"
          ? u.roles[0]
          : u.roles[0].role_name || u.roles[0].name || "Cashier";
    }

    setIsEditing(true);
    setSelectedUserId(userId);
    setFormData({
      full_name: u.full_name || "",
      username: u.username || "",
      password: "",
      role_id: roleMapToId[currentRoleName] || "3",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // ផ្ញើ field 'role_id' ទៅកាន់ Backend ឱ្យត្រូវតាម Validation rule
    const payload = {
      full_name: formData.full_name,
      username: formData.username,
      role_id: parseInt(formData.role_id, 10), // បម្លែងទៅជា Integer
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (isEditing) {
        await axiosClient.put(`/users/${selectedUserId}`, payload);
      } else {
        await axiosClient.post("/users", payload);
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} user`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axiosClient.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const formatRoles = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) return "No Role";
    return roles
      .map((r) =>
        typeof r === "string" ? r : r.role_name || r.name || "Unknown",
      )
      .join(", ");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-amber-600" /> Users Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage system staff and access roles
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Plus size={18} /> Add New User
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Username</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" /> Loading users...
                  </span>
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((u) => {
                const userId = u.user_id || u.id;
                const roleString = formatRoles(u.roles);

                return (
                  <tr key={userId} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <UserCircle size={32} className="text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-800">
                            {u.full_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      @{u.username}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          roleString.includes("Admin")
                            ? "bg-amber-100 text-amber-700"
                            : roleString.includes("Manager")
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {roleString}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(userId)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? "Edit User" : "Create New User"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Password{" "}
                  {isEditing && (
                    <span className="text-slate-400 font-normal">
                      (Leave blank to keep existing)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder={isEditing ? "••••••••" : ""}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Role
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) =>
                    setFormData({ ...formData, role_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-amber-500 bg-white outline-none"
                >
                  <option value="3">Cashier</option>
                  <option value="2">Manager</option>
                  <option value="1">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  {isEditing ? "Update User" : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
