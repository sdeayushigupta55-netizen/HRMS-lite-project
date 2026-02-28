import { useMemo } from "react";
import { useGetEmployeesQuery } from "../features/employeeApi";
import { useGetAttendanceQuery } from "../features/attendanceApi";
import { motion } from "framer-motion";
import {
  Loader2,
  Users,
  ClipboardList,
  UserCheck,
  Percent,
  CalendarDays,
} from "lucide-react";

function Dashboard() {
  const { data: employees, isLoading: employeesLoading } = useGetEmployeesQuery();
  const { data: attendanceRecords, isLoading: attendanceLoading } =
    useGetAttendanceQuery();

  const today = new Date().toISOString().split("T")[0];

  const totalEmployees = employees?.length || 0;

  // Employee Map: id -> name
  const employeeMap = useMemo(() => {
    const map = {};
    employees?.forEach((emp) => {
      map[emp.id] = emp.name;
    });
    return map;
  }, [employees]);

  // Remove deleted employees attendance
  const validAttendance = useMemo(() => {
    if (!attendanceRecords || !employees) return [];
    const employeeIds = new Set(employees.map((e) => e.id));
    return attendanceRecords.filter((rec) => employeeIds.has(rec.employee_id));
  }, [attendanceRecords, employees]);

  // Today's attendance only
  const todaysAttendance = useMemo(() => {
    return validAttendance.filter((rec) => rec.date === today);
  }, [validAttendance, today]);

  const totalAttendanceToday = todaysAttendance.length;

  const presentCountToday = todaysAttendance.filter(
    (rec) => rec.status === "Present"
  ).length;

  const absentCountToday = Math.max(totalAttendanceToday - presentCountToday, 0);

  const attendanceRateToday =
    totalAttendanceToday > 0
      ? ((presentCountToday / totalAttendanceToday) * 100).toFixed(1)
      : "0.0";

  const recentAttendance = useMemo(() => {
    return validAttendance.slice(-8).reverse();
  }, [validAttendance]);

  const isLoading = employeesLoading || attendanceLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-10"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-lg border border-white/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-500 mt-1">
                Summary of employees and today’s attendance performance.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/70 px-4 py-2 text-gray-700">
              <CalendarDays size={18} className="text-indigo-600" />
              <span className="text-sm font-medium">{today}</span>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-14">
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="animate-spin" />
              <span className="text-sm">Loading dashboard...</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {!isLoading && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            <StatCard
              title="Total Employees"
              value={totalEmployees}
              icon={<Users size={18} />}
              tone="indigo"
            />
            <StatCard
              title="Today's Records"
              value={totalAttendanceToday}
              icon={<ClipboardList size={18} />}
              tone="purple"
            />
            <StatCard
              title="Today's Present"
              value={presentCountToday}
              icon={<UserCheck size={18} />}
              tone="emerald"
              helper={totalAttendanceToday ? `${absentCountToday} absent` : "No records"}
            />
            <StatCard
              title="Attendance Rate"
              value={`${attendanceRateToday}%`}
              icon={<Percent size={18} />}
              tone="rose"
              progress={Number(attendanceRateToday)}
            />
          </motion.div>
        )}

        {/* Recent Attendance */}
        {!isLoading && (
          <motion.div
            className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Recent Attendance
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Latest records (filtered to existing employees).
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Showing {Math.min(recentAttendance.length, 8)} records
              </span>
            </div>

            {recentAttendance.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No attendance records available.
              </div>
            )}

            {recentAttendance.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-600 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentAttendance.map((rec) => {
                      const isPresent = rec.status === "Present";
                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-indigo-50/60 transition"
                        >
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {employeeMap[rec.employee_id] || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{rec.date}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                                isPresent
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : "bg-rose-100 text-rose-700 border-rose-200"
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, tone = "indigo", helper, progress }) {
  const toneStyles = {
    indigo: {
      ring: "ring-indigo-200/60",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
    },
    purple: {
      ring: "ring-purple-200/60",
      bg: "bg-purple-50",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    emerald: {
      ring: "ring-emerald-200/60",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    rose: {
      ring: "ring-rose-200/60",
      bg: "bg-rose-50",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
  };

  const t = toneStyles[tone] || toneStyles.indigo;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.35 }}
      className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
          {helper && <p className="text-sm text-gray-500 mt-2">{helper}</p>}
        </div>

        <div
          className={`shrink-0 h-11 w-11 rounded-2xl ${t.bg} ${t.text} ring-1 ${t.ring} grid place-items-center`}
        >
          {icon}
        </div>
      </div>

      {/* Optional progress bar (for attendance rate card) */}
      {typeof progress === "number" && (
        <div className="mt-5">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full ${t.dot}`}
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

export default Dashboard;