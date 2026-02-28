import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useUpdateEmployeeMutation,
} from "../features/employeeApi";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Loader2, X } from "lucide-react";

function Employees() {
  const { data: employees, isLoading, isError, error } = useGetEmployeesQuery();

  const [createEmployee, { isLoading: isCreating }] =
    useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] =
    useUpdateEmployeeMutation();
  const [deleteEmployee, { isLoading: isDeleting }] =
    useDeleteEmployeeMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    employee_id: "",
    name: "",
    email: "",
    department: "",
    role: "",
    salary: "",
  });

  // ---------------- VALIDATION ----------------
  const validateForm = () => {
    const errors = {};

    if (!form.employee_id.trim())
      errors.employee_id = "Employee ID is required";
    else if (form.employee_id.length < 3)
      errors.employee_id = "Employee ID must be at least 3 characters";

    if (!form.name.trim()) errors.name = "Name is required";

    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errors.email = "Invalid email format";

    if (!form.department.trim()) errors.department = "Department is required";

    if (!form.role.trim()) errors.role = "Role is required";

    if (!form.salary) errors.salary = "Salary is required";
    else if (Number(form.salary) <= 0)
      errors.salary = "Salary must be greater than 0";

    return errors;
  };

  const handleChange = (e) => {
    const value =
      e.target.name === "employee_id"
        ? e.target.value.toUpperCase()
        : e.target.value;

    setForm({ ...form, [e.target.name]: value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormError(null);
    setFieldErrors({});
    setForm({
      employee_id: "",
      name: "",
      email: "",
      department: "",
      role: "",
      salary: "",
    });
    setIsOpen(true);
  };

  const openEditModal = (emp) => {
    setIsEditing(true);
    setSelectedId(emp.id);
    setFormError(null);
    setFieldErrors({});
    setForm({
      employee_id: emp.employee_id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      salary: emp.salary,
    });
    setIsOpen(true);
  };

  const openDeleteModal = (emp) => {
    setEmployeeToDelete(emp);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteEmployee(employeeToDelete.id).unwrap();
      setIsDeleteOpen(false);
      setEmployeeToDelete(null);
    } catch (err) {
      alert(err?.data?.detail || "Failed to delete employee");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      if (isEditing) {
        await updateEmployee({
          id: selectedId,
          ...form,
          salary: Number(form.salary),
        }).unwrap();
      } else {
        await createEmployee({
          ...form,
          salary: Number(form.salary),
        }).unwrap();
      }
      setIsOpen(false);
    } catch (err) {
      setFormError(err?.data?.detail || "Something went wrong. Please try again.");
    }
  };

  const isSubmitting = isCreating || isUpdating;
  const isBusy = isSubmitting || isDeleting;

  const renderInput = (name, label, type = "text", disabled = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-rose-500">*</span>
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        disabled={disabled || isBusy}
        placeholder={
          name === "employee_id"
            ? "EMP001"
            : name === "name"
              ? "John Doe"
              : name === "email"
                ? "example@gmail.com"
                : name === "department"
                  ? "Engineering"
                  : name === "role"
                    ? "Software Developer"
                    : name === "salary"
                      ? "50000"
                      : ""
        }
        className={`w-full border rounded-xl px-4 py-2 bg-gray-50 focus:bg-white transition-all duration-200 focus:ring-2 outline-none ${
          fieldErrors[name]
            ? "border-rose-500 focus:ring-rose-300"
            : "focus:ring-indigo-500 border-gray-200"
        } ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      />
      {fieldErrors[name] && (
        <p className="text-rose-600 text-sm mt-1">{fieldErrors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/40">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Employee Management
            </h1>
            <p className="text-gray-500 mt-1">
              Create, update and manage employees with a modern dashboard.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all duration-200"
          >
            + Add Employee
          </button>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {isLoading && (
            <div className="p-14 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin" />
              <p className="text-gray-500 text-sm">Loading employees...</p>
            </div>
          )}

          {isError && (
            <p className="p-6 text-rose-600 text-center">
              {error?.data?.detail || "Failed to load employees"}
            </p>
          )}

          {/* Empty State */}
          {!isLoading && employees && employees.length === 0 && (
            <div className="p-16 text-center">
              <h3 className="text-xl font-semibold text-gray-800">
                No Employees Found
              </h3>
              <p className="text-gray-500 mt-2">
                Click “Add Employee” to create your first employee.
              </p>
            </div>
          )}

          {employees && employees.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 text-sm uppercase text-gray-600">
                  <tr>
                    <th className="px-6 py-4">Employee ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Salary</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-indigo-50/60 transition duration-200"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {emp.employee_id}
                      </td>
                      <td className="px-6 py-4">{emp.name}</td>
                      <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                      <td className="px-6 py-4">{emp.department}</td>
                      <td className="px-6 py-4">{emp.role}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                          ₹ {Number(emp.salary).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            onClick={() => openDeleteModal(emp)}
                            className="text-rose-500 hover:bg-rose-100 p-2 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 border border-gray-100 relative"
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                <h2 className="text-xl font-semibold mb-1">
                  {isEditing ? "Edit Employee" : "Add New Employee"}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {isEditing
                    ? "Update employee details and save changes."
                    : "Fill in details to create a new employee."}
                </p>

                {formError && (
                  <div className="mb-4 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl p-3">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {renderInput("employee_id", "Employee ID", "text", isEditing)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("name", "Full Name")}
                    {renderInput("email", "Email", "email")}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput("department", "Department")}
                    {renderInput("role", "Role")}
                  </div>
                  {renderInput("salary", "Salary", "number")}

                  <div className="flex justify-end gap-3 pt-5">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      {isEditing ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Modal */}
        <AnimatePresence>
          {isDeleteOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100"
              >
                <h2 className="text-lg font-semibold mb-2">Confirm Delete</h2>
                <p className="mb-6 text-gray-600">
                  Are you sure you want to delete{" "}
                  <strong className="text-gray-900">
                    {employeeToDelete?.name}
                  </strong>
                  ? This action can’t be undone.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteOpen(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-rose-500 to-red-600 shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-60"
                  >
                    {isDeleting && <Loader2 size={16} className="animate-spin" />}
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Employees;