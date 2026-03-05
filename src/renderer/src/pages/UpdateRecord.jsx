import Button from '../components/Button'
import Input from '../components/Input'
import Breadcrumb from '../components/Breadcrumb'
import Select from '../components/Select'
import Modal from '../components/Modal'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { showError, showSuccess } from '../utils/toast'
import { Trash2 } from 'lucide-react'

const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
]

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  nidNumber: z.string().min(10, 'NID number must be at least 10 characters'),
  contactNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'Invalid Bangladeshi phone number format'),
  upazila: z.string().min(1, 'Upazila is required'),
  gender: z.string().min(1, 'Gender is required'),
  category: z.string().min(1, 'Category is required'),
  address: z.string().min(5, 'Address must be at least 5 characters')
})

export default function UpdateRecordPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [upazilas, setUpazilas] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Master password modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [actionType, setActionType] = useState('') // 'update' | 'delete'
  const [masterPassword, setMasterPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const {
    register,
    reset,
    control,
    getValues,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      parentName: '',
      nidNumber: '',
      contactNumber: '',
      upazila: '',
      address: '',
      gender: '',
      category: ''
    }
  })

  const loadInitialData = async () => {
    const [upazilasData, categoriesData] = await Promise.all([
      window.api.getUpazilas(),
      window.api.getCategories()
    ])
    setUpazilas(upazilasData)
    setCategories(categoriesData)
  }

  const loadApplication = async () => {
    const res = await window.api.getApplicationById(id)
    if (!res?.data) {
      showError('Application not found')
      navigate('/')
      return
    }
    const app = res.data
    reset({
      name: app.name,
      parentName: app.parentName,
      nidNumber: app.nid,
      contactNumber: app.contactNumber,
      upazila: app.upazilaId?.toString(),
      gender: app.gender,
      category: app.categoryId?.toString(),
      address: app.address
    })
  }

  useEffect(() => {
    const init = async () => {
      await loadInitialData()
      await loadApplication()
      setLoading(false)
    }
    init()
  }, [id])

  // Triggered when user clicks update button
  const handleUpdateClick = () => {
    setActionType('update')
    setPasswordModalOpen(true)
  }

  // Triggered when user clicks delete button
  const handleDeleteClick = () => {
    setActionType('delete')
    setPasswordModalOpen(true)
  }

  // Master password submit
  const handlePasswordSubmit = async () => {
    setActionLoading(true)
    try {
      if (actionType === 'update') {
        const formData = getValues()
        const res = await window.api.updateApplication(id, { ...formData, masterPassword })
        if (res.success) {
          showSuccess('Application updated successfully')
        } else {
          showError(res.error || 'Failed to update')
        }
      } else if (actionType === 'delete') {
        const res = await window.api.deleteApplication(id, { masterPassword })
        if (res.success) {
          showSuccess('Record deleted successfully')
          navigate('/records', { replace: true })
        } else {
          showError(res.error || 'Failed to delete')
        }
      }
    } catch (err) {
      showError(err.message || 'Something went wrong')
    } finally {
      setActionLoading(false)
      setPasswordModalOpen(false)
      setMasterPassword('')
    }
  }

  if (loading) return <div className="text-center mt-10">Loading...</div>

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Breadcrumb />

      {/* Header */}
      <div className="flex items-center justify-between rounded bg-white border border-gray-300 p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Update Record</h1>
          <p className="text-sm text-gray-600 mt-1">Modify the fields and save changes</p>
        </div>

        <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDeleteClick}>
          Delete
        </Button>
      </div>

      {/* Master Password Modal */}
      <Modal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Enter Master Password"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit} loading={actionLoading}>
              Confirm
            </Button>
          </div>
        }
      >
        <Input
          label="Master Password"
          type="password"
          placeholder="Enter master password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
        />
      </Modal>

      {/* Form */}
      <div className="rounded bg-white border border-gray-300 shadow-sm p-6 flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleUpdateClick()
          }}
          className="grid grid-cols-2 gap-4"
        >
          <Input label="Full Name" {...register('name')} error={errors.name?.message} />
          <Input
            label="Parent Name"
            {...register('parentName')}
            error={errors.parentName?.message}
          />
          <Input label="NID Number" {...register('nidNumber')} error={errors.nidNumber?.message} />
          <Input
            label="Contact Number"
            {...register('contactNumber')}
            error={errors.contactNumber?.message}
          />

          <Controller
            name="upazila"
            control={control}
            render={({ field }) => (
              <Select
                label="Select Upazila"
                options={upazilas.map((u) => ({ label: u.name, value: u.id.toString() }))}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.upazila?.message}
              />
            )}
          />

          <Input label="Address" {...register('address')} error={errors.address?.message} />

          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                label="Gender"
                options={genders}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.gender?.message}
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                label="Category"
                options={categories.map((c) => ({ label: c.name, value: c.id.toString() }))}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.category?.message}
              />
            )}
          />

          <div className="flex gap-2 mt-4 col-span-full">
            <Button variant="primary" type="submit">
              Update
            </Button>
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
