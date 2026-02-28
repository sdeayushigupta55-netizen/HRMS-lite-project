import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Pencil, Trash2, X, CalendarDays, BadgeCheck } from "lucide-react";
import { useGetEmployeesQuery } from "../features/employeeApi";
import {
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} from "../features/attendanceApi";

function Attendance() {
  /* ===============================
     Employees Query
  =============================== */
  const { data: employees, isLoading: employeesLoading } = useGetEmployeesQuery();

  /* ===============================
     Attendance Query
  =============================== */
  const { data: attendanceRecords, isLoading, isError, error } =
    useGetAttendanceQuery();

  const [markAttendance, { isLoading: isMarking }] = useMarkAttendanceMutation();
  const [updateAttendance, { isLoading: isUpdating }] =
    useUpdateAttendanceMutation();
  const [deleteAttendance, { isLoading: isDeleting }] =
    useDeleteAttendanceMutation();

  /* ===============================
     Local States
  =============================== */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    employee_id: "",
    date: "",
    status: "Present",
  });

  const today = new Date().toISOString().split("T")[0];

  /* ===============================
     Employee Map
  =============================== */
  const employeeMap = useMemo(() => {
    const map = {};
    employees?.forEach((emp) => {
      map[emp.id] = emp.name;
    });
    return map;
  }, [employees]);

  /* ===============================
     Filter attendance of deleted employees
  =============================== */
  const filteredAttendance = useMemo(() => {
    if (!attendanceRecords || !employees) return [];
    const employeeIds = new Set(employees.map((e) => e.id));
    return attendanceRecords.filter((record) => employeeIds.has(record.employee_id));
  }, [attendanceRecords, employees]);

  /* ===============================
     Stats
  =============================== */
  const totalRecords = filteredAttendance.length;
  const presentCount = filteredAttendance.filter((r) => r.status === "Present").length;
  const absentCount = Math.max(totalRecords - presentCount, 0);
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0.0";

  /* ===============================
     VALIDATION
  =============================== */
  const validate = () => {
    const errors = {};
    if (!form.employee_id) errors.employee_id = "Please select an employee";
    if (!form.date) errors.date = "Please select a date";
    if (form.date && form.date > today) errors.date = "Date cannot be in the future";
    if (!form.status) errors.status = "Please select status";
    return errors;
  };

  /* ===============================
     Modal Handlers
  =============================== */
  const openAddModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setForm({ employee_id: "", date: today, status: "Present" });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setIsEditing(true);
    setSelectedId(record.id);
    setForm({
      employee_id: record.employee_id,
      date: record.date,
      status: record.status,
    });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    try {
      if (isEditing) {
        await updateAttendance({ id: selectedId, ...form }).unwrap();
      } else {
        await markAttendance(form).unwrap();
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err?.data?.detail || "Something went wrong");
    }
  };

  const openDelete = (record) => {
    setRecordToDelete(record);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAttendance(recordToDelete.id).unwrap();
      setIsDeleteOpen(false);
      setRecordToDelete(null);
    } catch {
      alert("Failed to delete attendance");
    }
  };

  const isSubmitting = isMarking || isUpdating;

  /* ===============================
     No Employees State
  =============================== */
  if (!employeesLoading && (!employees || employees.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-10">
        <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-lg border border-white/40 rounded-3xl shadow-lg p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">No Employees Found</h2>
          <p className="text-gray-500 mt-2">Please add employees before marking attendance.</p>
        </div>
      </div>
    );
  }

  /* ===============================
     Main UI
  =============================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-white/40">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Attendance Management
              </h1>
              <p className="text-gray-500 mt-1">
                Track and manage employee attendance records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/70 px-4 py-2 text-gray-700">
                <CalendarDays size={18} className="text-indigo-600" />
                <span className="text-sm font-medium">{today}</span>
              </div>

              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-all"
              >
                + Mark Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Records" value={totalRecords} tone="indigo" />
          <StatCard title="Present" value={presentCount} tone="emerald" helper={`${absentCount} absent`} />
          <StatCard title="Absent" value={absentCount} tone="rose" />
          <StatCard title="Attendance Rate" value={`${attendanceRate}%`} tone="purple" progress={Number(attendanceRate)} />
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {isLoading && (
            <div className="p-14 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin" />
              <p className="text-gray-500 text-sm">Loading attendance...</p>
            </div>
          )}

          {isError && (
            <p className="p-6 text-rose-600 text-center">
              {error?.data?.detail || "Failed to load attendance"}
            </p>
          )}

          {!isLoading && filteredAttendance.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No attendance records found.
            </div>
          )}

          {filteredAttendance.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-600 text-sm uppercase">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.map((record) => {
                    const isPresent = record.status === "Present";
                    return (
                      <tr key={record.id} className="hover:bg-indigo-50/60 transition">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {employeeMap[record.employee_id] || "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{record.date}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold border inline-flex items-center gap-2 ${
                              isPresent
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                          >
                            {isPresent && <BadgeCheck size={16} />}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(record)}
                              className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>

                            <button
                              onClick={() => openDelete(record)}
                              disabled={isDeleting}
                              className="text-rose-500 hover:bg-rose-100 p-2 rounded-lg transition disabled:opacity-60"
                              title="Delete"
                            >
                              {isDeleting ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 border border-gray-100 relative"
                initial={{ scale: 0.92, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 transition"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                <h2 className="text-xl font-semibold mb-1">
                  {isEditing ? "Edit Attendance" : "Mark Attendance"}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {isEditing
                    ? "Update record details and save."
                    : "Select employee, date and status to mark attendance."}
                </p>

                {formError && (
                  <div className="mb-4 text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-xl p-3">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="employee_id"
                      value={form.employee_id}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className={`w-full border rounded-xl px-4 py-2 bg-gray-50 focus:bg-white transition-all duration-200 focus:ring-2 outline-none ${
                        fieldErrors.employee_id
                          ? "border-rose-500 focus:ring-rose-300"
                          : "border-gray-200 focus:ring-indigo-500"
                      }`}
                    >
                      <option value="">Select Employee</option>
                      {employees?.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.employee_id && (
                      <p className="text-rose-600 text-sm mt-1">{fieldErrors.employee_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      max={today}
                      value={form.date}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className={`w-full border rounded-xl px-4 py-2 bg-gray-50 focus:bg-white transition-all duration-200 focus:ring-2 outline-none ${
                        fieldErrors.date
                          ? "border-rose-500 focus:ring-rose-300"
                          : "border-gray-200 focus:ring-indigo-500"
                      }`}
                    />
                    {fieldErrors.date && (
                      <p className="text-rose-600 text-sm mt-1">{fieldErrors.date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`w-full border rounded-xl px-4 py-2 bg-gray-50 focus:bg-white transition-all duration-200 focus:ring-2 outline-none ${
                        fieldErrors.status
                          ? "border-rose-500 focus:ring-rose-300"
                          : "border-gray-200 focus:ring-indigo-500"
                      }`}
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                    {fieldErrors.status && (
                      <p className="text-rose-600 text-sm mt-1">{fieldErrors.status}</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
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
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      {isEditing ? "Update" : "Mark"}
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-gray-100"
                initial={{ scale: 0.92, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 12 }}
                transition={{ duration: 0.18 }}
              >
                <h2 className="text-lg font-semibold mb-2">Confirm Delete</h2>

                <p className="mb-6 text-gray-600">
                  Delete attendance for{" "}
                  <strong className="text-gray-900">
                    {employeeMap[recordToDelete?.employee_id] || "Unknown"}
                  </strong>{" "}
                  on <strong className="text-gray-900">{recordToDelete?.date}</strong>?
                  <br />
                  <span className="text-sm text-gray-500">
                    This action can’t be undone.
                  </span>
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
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

function StatCard({ title, value, tone = "indigo", helper, progress }) {
  const toneStyles = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500" },
  };
  const t = toneStyles[tone] || toneStyles.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition"
    >
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
      {helper && <p className="text-sm text-gray-500 mt-2">{helper}</p>}

      {typeof progress === "number" && (
        <div className="mt-5">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full ${t.bar}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Attendance;