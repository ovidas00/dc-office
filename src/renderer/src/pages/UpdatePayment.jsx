import Button from '../components/Button'
import Input from '../components/Input'
import Breadcrumb from '../components/Breadcrumb'
import Select from '../components/Select'
import Modal from '../components/Modal'
import { useForm, Controller } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { showError, showSuccess } from '../utils/toast'

const paymentTypes = [
  { label: 'Cash', value: 'cash' },
  { label: 'Check', value: 'check' }
]

export default function UpdatePaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  // Master password modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [formPayload, setFormPayload] = useState(null)

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      approvalDate: '',
      disbursementDate: '',
      paymentType: '',
      paymentAmount: '',
      paymentReference: ''
    }
  })

  const loadApplication = async () => {
    const res = await window.api.getApplicationById(id)
    if (!res?.data) {
      showError('Application not found')
      navigate('/')
      return
    }
    const app = res.data

    reset({
      approvalDate: app.approvalDate ? new Date(app.approvalDate).toISOString().slice(0, 10) : '',
      disbursementDate: app.disbursementDate
        ? new Date(app.disbursementDate).toISOString().slice(0, 10)
        : '',
      paymentType: app.paymentType || '',
      paymentAmount: app.paymentAmount || '',
      paymentReference: app.paymentReference || ''
    })

    setLoading(false)
  }

  useEffect(() => {
    loadApplication()
  }, [id])

  // Called when user submits the form → open password modal
  const handleFormSubmit = (data) => {
    const payload = {
      approvalDate: data.approvalDate || null,
      disbursementDate: data.disbursementDate || null,
      paymentType: data.paymentType || null,
      paymentAmount: data.paymentAmount ? Number(data.paymentAmount) : null,
      paymentReference: data.paymentReference || null
    }

    setFormPayload(payload)
    setPasswordModalOpen(true)
  }

  // Called when user submits master password
  const handlePasswordSubmit = async () => {
    setActionLoading(true)
    try {
      const payloadWithPassword = { ...formPayload, masterPassword }
      const res = await window.api.updatePayment(id, payloadWithPassword)

      if (res.success) {
        showSuccess('Payment updated successfully')
        navigate(-1)
      } else {
        showError(res.error || 'Failed to update payment')
      }
    } catch (err) {
      showError(err.message || 'Something went wrong')
    } finally {
      setActionLoading(false)
      setPasswordModalOpen(false)
      setMasterPassword('')
      setFormPayload(null)
    }
  }

  if (loading) return <div className="text-center mt-10">Loading...</div>

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Breadcrumb />

      <div className="flex items-center justify-between rounded bg-white border border-gray-300 p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Update Payment</h1>
          <p className="text-sm text-gray-600 mt-1">Update payment and approval details</p>
        </div>
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-2 gap-4">
          <Input type="date" label="Approval Date" {...register('approvalDate')} />

          <Input type="date" label="Disbursement Date" {...register('disbursementDate')} />

          <Controller
            name="paymentType"
            control={control}
            render={({ field }) => (
              <Select
                label="Payment Type"
                placeholder="Select payment type"
                options={paymentTypes}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          <Input
            type="number"
            label="Payment Amount"
            placeholder="5000"
            {...register('paymentAmount')}
          />

          <div className="col-span-full">
            <Input
              label="Payment Reference"
              placeholder="Check number / transaction ID"
              {...register('paymentReference')}
            />
          </div>

          <div className="flex gap-2 mt-4 col-span-full">
            <Button variant="primary" type="submit">
              Update Payment
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
