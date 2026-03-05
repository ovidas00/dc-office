import { useState } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { showError, showSuccess } from '../utils/toast'

export default function BackupPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBackup = async () => {
    try {
      setLoading(true)

      const res = await window.api.startBackup(password)

      if (res.success) {
        showSuccess(`Backup saved successfully at ${res.path}`)
        setPassword('')
      } else {
        showError(res.error || 'Backup failed')
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="rounded bg-white border border-gray-300 shadow-sm p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Database Backup</h1>
        <p className="text-sm text-gray-600">
          Create a password-protected backup of your database file.
        </p>

        <Input
          label="Backup Password (optional)"
          placeholder="Enter a password to encrypt backup"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />

        <Button variant="primary" onClick={handleBackup} loading={loading}>
          {loading ? 'Backing up...' : 'Create Backup'}
        </Button>
      </div>
    </div>
  )
}
