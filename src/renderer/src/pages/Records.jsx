import { Plus, Search, Eye, Edit, Funnel, HandCoins } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Download } from 'lucide-react'
import { showError, showSuccess } from '../utils/toast'
import Modal from '../components/Modal'

export default function RecordsPage() {
  const navigate = useNavigate()
  const searchRef = useRef(null)

  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loadingExport, setLoadingExport] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [categories, setCategories] = useState([])
  const [filterOpen, setFilterOpen] = useState(false)

  const [filters, setFilters] = useState({
    searchQuery: '',
    status: '',
    categoryId: '',
    fromDate: '',
    toDate: '',
    page: 1,
    pageSize: 50
  })

  const [exportType, setExportType] = useState('')

  const totalPages = Math.ceil(total / filters.pageSize)

  const fetchData = async () => {
    try {
      setLoading(true)

      const payload = {
        page: filters.page,
        pageSize: filters.pageSize,
        searchQuery: filters.searchQuery,
        status: filters.status,
        categoryId: filters.categoryId,
        fromDate: filters.fromDate,
        toDate: filters.toDate
      }

      const res = await window.api.getApplications(payload)

      setRecords(res.data)
      setTotal(res.total)
      setSelectedIndex(0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 400)

    return () => clearTimeout(timer)
  }, [filters])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!records.length) return

      if (e.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev < records.length - 1 ? prev + 1 : prev))
      }

      if (e.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      }

      if (e.key === 'Enter') {
        const selected = records[selectedIndex]
        setSelectedRecord(selected)
        setViewModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [records, selectedIndex])

  // Get categories
  const getCategories = async () => {
    const categories = await window.api.getCategories()
    setCategories(categories)
  }

  useEffect(() => {
    getCategories()
  }, [])

  return (
    <>
      {/* View Modal */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="View Application"
        width="800px"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<HandCoins size={16} />}
              size="md"
              onClick={() => navigate(`/records/${selectedRecord?.id}/update-payment`)}
            >
              Update Payment
            </Button>

            <Button
              variant="primary"
              icon={<Edit size={16} />}
              size="md"
              onClick={() => navigate(`/records/${selectedRecord?.id}/edit`)}
            >
              Edit
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Personal Info Section */}
          <section className="border border-gray-300 rounded p-4">
            <h2 className="text-lg font-semibold mb-4">Personal Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{selectedRecord?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Parent Name</p>
                <p className="font-medium">{selectedRecord?.parentName}</p>
              </div>
              <div>
                <p className="text-gray-500">NID</p>
                <p className="font-medium">{selectedRecord?.nid}</p>
              </div>
              <div>
                <p className="text-gray-500">Contact Number</p>
                <p className="font-medium">{selectedRecord?.contactNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-medium capitalize">{selectedRecord?.gender}</p>
              </div>
              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-medium">{selectedRecord?.address}</p>
              </div>
              <div>
                <p className="text-gray-500">Upazila</p>
                <p className="font-medium">{selectedRecord?.upazilaName}</p>
              </div>
              <div>
                <p className="text-gray-500">Category</p>
                <p className="font-medium">{selectedRecord?.categoryName}</p>
              </div>
            </div>
          </section>

          {/* Application Details Section */}
          <section className="border border-gray-300 rounded p-4">
            <h2 className="text-lg font-semibold mb-4">Application Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Application Date</p>
                <p className="font-medium">
                  {new Date(selectedRecord?.applicationDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Approval Date</p>
                <p className="font-medium">
                  {selectedRecord?.approvalDate
                    ? new Date(selectedRecord?.approvalDate).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Disbursement Date</p>
                <p className="font-medium">
                  {selectedRecord?.disbursementDate
                    ? new Date(selectedRecord?.disbursementDate).toLocaleDateString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedRecord?.status}</p>
              </div>
            </div>
          </section>

          {/* Payment Info Section */}
          <section className="border border-gray-300 rounded p-4">
            <h2 className="text-lg font-semibold mb-4">Payment Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Paid Method / Amount</p>
                <p className="font-medium capitalize">
                  {selectedRecord?.paymentType
                    ? `${selectedRecord.paymentType} (৳${selectedRecord.paymentAmount ?? 0})`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Payment Reference</p>
                <p className="font-medium">{selectedRecord?.paymentReference || '—'}</p>
              </div>
            </div>
          </section>
        </div>
      </Modal>

      <div className="flex flex-col gap-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between rounded bg-white border border-gray-300 p-4 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Record List</h1>
            <p className="text-sm text-gray-600 mt-1">Manage donation applications efficiently</p>
          </div>

          <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate('new')}>
            Add Record
          </Button>
        </div>

        {/* Main Card */}
        <div className="rounded bg-white border border-gray-300 shadow-xs p-4 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <h2 className="flex-1 font-semibold whitespace-nowrap">Records ({total})</h2>

            {/* Search input */}
            <div>
              <Input
                ref={searchRef}
                placeholder="Search by Name or NID..."
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchQuery: e.target.value,
                    page: 1
                  }))
                }
                icon={<Search size={16} />}
                type="search"
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative z-50">
              <DropdownMenu.Root open={filterOpen} onOpenChange={setFilterOpen}>
                <DropdownMenu.Trigger asChild>
                  <Button variant="outline" icon={<Funnel size={16} />}>
                    Filter
                  </Button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  className="bg-white border border-gray-200 rounded shadow-md p-4 w-64 flex flex-col gap-3"
                >
                  {/* Status */}
                  <Select
                    options={[
                      { label: 'All Status', value: '' },
                      { label: 'Pending', value: 'pending' },
                      { label: 'Approved', value: 'approved' },
                      { label: 'Disbursed', value: 'disbursed' }
                    ]}
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                    }
                    placeholder="Status"
                  />

                  {/* Category */}
                  <Select
                    options={[
                      { label: 'All Categories', value: '' },
                      ...categories.map((c) => ({ label: c.name, value: c.id }))
                    ]}
                    value={filters.categoryId}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, categoryId: e.target.value, page: 1 }))
                    }
                    placeholder="Category"
                  />

                  {/* Date range */}
                  <Input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, fromDate: e.target.value, page: 1 }))
                    }
                    placeholder="From"
                  />
                  <Input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, toDate: e.target.value, page: 1 }))
                    }
                    placeholder="To"
                  />

                  <Button
                    variant="primary"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        status: '',
                        categoryId: '',
                        fromDate: '',
                        toDate: '',
                        page: 1,
                        pageSize: 50
                      }))
                      setFilterOpen(false)
                    }}
                  >
                    Clear Filter
                  </Button>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>

            {/* Export dropdown */}
            <div className="relative z-50">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button variant="outline" icon={<Download size={16} />}>
                    Export
                  </Button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                  side="bottom"
                  align="end"
                  className="bg-white border border-gray-200 rounded shadow-md p-4 w-48 flex flex-col gap-3"
                >
                  <Select
                    options={[
                      { label: 'Word', value: 'word' },
                      { label: 'Excel', value: 'excel' },
                      { label: 'PDF', value: 'pdf' }
                    ]}
                    value={exportType}
                    onChange={(e) => setExportType(e.target.value)}
                    placeholder="Document Type"
                  />

                  <Button
                    variant="primary"
                    onClick={async () => {
                      if (!exportType) return
                      try {
                        setLoadingExport(true)
                        console.log(filters)
                        const res = await window.api.exportApplications({
                          ...filters,
                          exportType
                        })
                        if (res.success) showSuccess('Exported successfully!')
                        else showError(`Failed to export: ${res.message}`)
                      } catch (err) {
                        showError('Export error: ' + err.message)
                      } finally {
                        setLoadingExport(false)
                      }
                    }}
                    loading={loadingExport}
                  >
                    Export
                  </Button>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr className="text-left text-gray-600">
                  <th className="p-3">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">NID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Applied</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-400">
                      Loading records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-400">
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((rec, index) => (
                    <tr
                      key={rec.id}
                      className={`cursor-pointer ${
                        index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <td className="p-3 font-medium text-gray-800">{rec.id}</td>
                      <td className="p-3 font-medium text-gray-800">{rec.name}</td>
                      <td className="p-3">{rec.nid}</td>
                      <td className="p-3">{rec.categoryName}</td>
                      <td className="p-3">{new Date(rec.applicationDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        {rec.status === 'approved' && (
                          <span className="text-green-600 font-medium">Approved</span>
                        )}
                        {rec.status === 'pending' && (
                          <span className="text-yellow-600 font-medium">Pending</span>
                        )}
                        {rec.status === 'disbursed' && (
                          <span className="text-blue-600 font-medium">Disbursed</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye size={16} />}
                          onClick={() => {
                            setSelectedRecord(rec)
                            setViewModalOpen(true)
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {records.length ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Page {filters.page} of {totalPages || 1}
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: prev.page - 1
                    }))
                  }
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  disabled={filters.page === totalPages || totalPages === 0}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: prev.page + 1
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </>
  )
}
