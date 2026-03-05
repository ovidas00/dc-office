import Button from '../components/Button'
import Input from '../components/Input'
import Breadcrumb from '../components/Breadcrumb'
import Select from '../components/Select'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { showError, showSuccess } from '../utils/toast'

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

export default function AddRecordPage() {
  const [upazilas, setUpazilas] = useState([])
  const [categories, setCategories] = useState([])
  const {
    register,
    handleSubmit,
    reset,
    control,
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

  // Get upazilas
  const getUpazilas = async () => {
    const upazilas = await window.api.getUpazilas()
    setUpazilas(upazilas)
  }

  // Get categories
  const getCategories = async () => {
    const categories = await window.api.getCategories()
    setCategories(categories)
  }

  // Get initial data
  useEffect(() => {
    Promise.resolve().then(() => {
      getUpazilas()
      getCategories()
    })
  }, [])

  const onSubmit = async (formData) => {
    const res = await window.api.addApplication(formData)
    if (res.success) {
      showSuccess(`Application saved with ID: ${res.id}`)
      reset()
    } else {
      showError(`Failed to save: ${res.error}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Breadcrumb />
      <div className="flex items-center justify-between rounded bg-white border border-gray-300 p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add Record</h1>
          <p className="text-sm text-gray-600 mt-1">Fill out the fields and save the new record</p>
        </div>
      </div>
      <div className="rounded bg-white border border-gray-300 shadow-sm p-6 flex flex-col gap-4">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="MD. Sakib"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Parent Name"
            placeholder="MD. Anwar Hossain"
            {...register('parentName')}
            error={errors.parentName?.message}
          />
          <Input
            label="NID Number"
            placeholder="335423332002"
            {...register('nidNumber')}
            error={errors.nidNumber?.message}
          />
          <Input
            label="Contact Number"
            placeholder="+8801708455666"
            {...register('contactNumber')}
            error={errors.contactNumber?.message}
          />
          <Controller
            name="upazila"
            control={control}
            render={({ field }) => (
              <Select
                label="Select Upazila"
                placeholder="Choose Upazila"
                options={upazilas.map((u) => ({ label: u.name, value: u.id.toString() }))}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.upazila?.message}
              />
            )}
          />
          <Input
            label="Address"
            placeholder="123 Main Street, City"
            {...register('address')}
            error={errors.address?.message}
          />
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                label="Gender"
                placeholder="Select Gender"
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
                placeholder="Select Category"
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                value={field.value ?? ''}
                onChange={field.onChange}
                error={errors.category?.message}
              />
            )}
          />
          <div className="flex gap-2 mt-4 col-span-full">
            <Button variant="primary" type="submit">
              Save
            </Button>
            <Button variant="outline" type="button" onClick={() => reset()}>
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
