import { useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { showError, showSuccess } from '../utils/toast'

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmNewPassword: z.string().min(6, 'Confirm password must be at least 6 characters')
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword']
  })

export default function UpdatePasswordPage() {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const res = await window.api.updateMasterPassword(data.oldPassword, data.newPassword)
      if (res.success) {
        showSuccess('Master password updated successfully')
        reset()
      } else {
        showError(res.error || 'Password update failed')
      }
    } catch (err) {
      showError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="rounded bg-white border border-gray-300 shadow-sm p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Update Master Password</h1>
        <p className="text-sm text-gray-600">
          Change your master password. New password must be at least 6 characters.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-4">
          <Input
            label="Old Password"
            placeholder="Enter your current password"
            type="password"
            {...register('oldPassword')}
            error={errors.oldPassword?.message}
          />
          <Input
            label="New Password"
            placeholder="Enter your new password"
            type="password"
            {...register('newPassword')}
            error={errors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            placeholder="Confirm your new password"
            type="password"
            {...register('confirmNewPassword')}
            error={errors.confirmNewPassword?.message}
          />

          <Button variant="primary" type="submit" loading={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
