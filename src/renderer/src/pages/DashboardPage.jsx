import { useEffect, useState } from 'react'
import { FileText, CheckCircle, Wallet, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await window.api.getDashboardStats()
      setStats(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57']

  const Card = ({ title, value, icon }) => (
    <div className="bg-white border border-gray-300 rounded p-6 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h2 className="text-2xl font-semibold text-gray-900">{loading ? '...' : value}</h2>
      </div>
      <div className="bg-gray-100 p-3 rounded-md text-gray-700">{icon}</div>
    </div>
  )

  // Custom tooltip for BarChart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <p className="font-semibold">{data.upazilaName}</p>
          <p>Total Applications: {data.totalApplications}</p>
          <p>Approved: {data.totalApproved}</p>
          <p>Disbursed: {data.totalDisbursement}</p>
          <p>Amount: ৳ {data.totalAmount?.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Overview of application statistics</p>
      </div>

      {/* Overall Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Total Applications"
          value={stats?.totals?.totalApplications || 0}
          icon={<FileText size={22} />}
        />

        <Card
          title="Total Approved"
          value={stats?.totals?.totalApproved || 0}
          icon={<CheckCircle size={22} />}
        />

        <Card
          title="Total Disbursement"
          value={stats?.totals?.totalDisbursement || 0}
          icon={<Wallet size={22} />}
        />

        <Card
          title="Total Amount"
          value={`৳ ${stats?.totals?.totalAmount?.toLocaleString() || 0}`}
          icon={<DollarSign size={22} />}
        />
      </div>

      {/* Upazila Breakdown as BarChart */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">Upazila Breakdown</h2>
        <div className="bg-white border border-gray-300 rounded p-6 shadow">
          {loading ? (
            <div className="h-64 flex items-center justify-center">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={stats.byUpazila}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <XAxis
                  dataKey="upazilaName"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalAmount">
                  {stats.byUpazila.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Latest Disbursements */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-4">Latest Disbursements</h2>
        <div className="flex flex-col divide-y divide-gray-200 bg-white border border-gray-300 rounded shadow-xs overflow-hidden">
          {/* Header row */}
          <div className="hidden sm:flex bg-gray-100 px-4 py-2 font-semibold text-gray-700">
            <div className="w-1/4">Name</div>
            <div className="w-1/6">NID</div>
            <div className="w-1/4">Upazila</div>
            <div className="w-1/6 text-right">Amount</div>
            <div className="w-1/6 text-right">Disbursement Date</div>
          </div>

          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-2 animate-pulse flex flex-col sm:flex-row gap-1 sm:gap-0"
                >
                  <div className="bg-gray-100 h-5 w-full sm:w-1/4 rounded"></div>
                  <div className="bg-gray-100 h-5 w-full sm:w-1/6 rounded"></div>
                  <div className="bg-gray-100 h-5 w-full sm:w-1/4 rounded"></div>
                  <div className="bg-gray-100 h-5 w-full sm:w-1/6 rounded"></div>
                  <div className="bg-gray-100 h-5 w-full sm:w-1/6 rounded"></div>
                </div>
              ))
            : stats?.latestDisbursed?.map((d) => (
                <div
                  key={d.id}
                  className="px-4 py-2 flex flex-col sm:flex-row gap-1 sm:gap-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-full sm:w-1/4 font-medium">{d.name}</div>
                  <div className="w-full sm:w-1/6 text-gray-600">{d.nid}</div>
                  <div className="w-full sm:w-1/4">{d.upazilaName}</div>
                  <div className="w-full sm:w-1/6 text-right text-green-700 font-semibold">
                    ৳ {d.paymentAmount?.toLocaleString()}
                  </div>
                  <div className="w-full sm:w-1/6 text-right text-gray-500">
                    {new Date(d.disbursementDate).toLocaleDateString('en-GB')}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  )
}
