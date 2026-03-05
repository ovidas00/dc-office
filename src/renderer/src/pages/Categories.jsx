import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import { showError, showSuccess } from '../utils/toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

/* ---------------- Schema ---------------- */

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters')
})

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [deleting, setDeleting] = useState(false)

  /* ---------------- Add Form ---------------- */

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: addErrors }
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' }
  })

  const onAddSubmit = async (data) => {
    try {
      const res = await window.api.addCategory(data)

      if (res.success) {
        showSuccess('Category added successfully')
        setAddOpen(false)
        resetAdd()
        fetchCategories()
      } else {
        showError(res.error)
      }
    } catch (err) {
      showError(err.message)
    }
  }

  /* ---------------- Edit Form ---------------- */

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm({
    resolver: zodResolver(categorySchema)
  })

  const openEditModal = (category) => {
    setSelectedCategory(category)
    setEditValue('name', category.name)
    setEditOpen(true)
  }

  const onEditSubmit = async (data) => {
    try {
      const res = await window.api.updateCategory({
        id: selectedCategory.id,
        name: data.name
      })

      if (res.success) {
        showSuccess('Category updated successfully')
        setEditOpen(false)
        resetEdit()
        fetchCategories()
      } else {
        showError(res.error)
      }
    } catch (err) {
      showError(err.message)
    }
  }

  /* ---------------- Fetch ---------------- */

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await window.api.getCategories()
      setCategories(res)
    } catch {
      showError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  /* ---------------- Delete ---------------- */

  const openDeleteDialog = (category) => {
    setSelectedCategory(category)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedCategory) return

    try {
      setDeleting(true)

      const res = await window.api.deleteCategory(selectedCategory.id)

      if (res.success) {
        showSuccess('Category deleted')
        setDeleteOpen(false)
        fetchCategories()
      } else {
        showError(res.error)
      }
    } catch (err) {
      showError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <>
      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          resetAdd()
        }}
        title="Add Category"
        footer={
          <Button variant="primary" onClick={handleSubmitAdd(onAddSubmit)}>
            Save
          </Button>
        }
      >
        <Input
          placeholder="Category name"
          {...registerAdd('name')}
          error={addErrors.name?.message}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          resetEdit()
        }}
        title="Edit Category"
        footer={
          <Button variant="primary" onClick={handleSubmitEdit(onEditSubmit)}>
            Update
          </Button>
        }
      >
        <Input
          placeholder="Category name"
          {...registerEdit('name')}
          error={editErrors.name?.message}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Category"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>

            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{selectedCategory?.name}</span>?
        </p>
        <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
      </Modal>

      {/* Page UI */}
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between rounded bg-white border border-gray-300 p-4 shadow-xs">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-600 mt-1">Manage application categories</p>
          </div>

          <Button variant="primary" icon={<Plus size={18} />} onClick={() => setAddOpen(true)}>
            Add Category
          </Button>
        </div>

        <div className="rounded bg-white border border-gray-300 shadow-xs p-4">
          <div className="overflow-hidden border border-gray-300 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr className="text-left text-gray-600">
                  <th className="p-3">#</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="p-6 text-center text-gray-400">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-6 text-center text-gray-400">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{index + 1}</td>
                      <td className="p-3">{cat.name}</td>
                      <td className="p-3 text-right flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit size={14} />}
                          onClick={() => openEditModal(cat)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => openDeleteDialog(cat)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
