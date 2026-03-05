import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import RecordsPage from './pages/Records'
import AddRecordPage from './pages/AddRecord'
import CategoriesPage from './pages/Categories'
import DashboardPage from './pages/DashboardPage'
import BackupPage from './pages/Backup'
import UpdateRecordPage from './pages/UpdateRecord'
import UpdatePaymentPage from './pages/UpdatePayment'
import UpdatePasswordPage from './pages/UpdatePassword'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/records/new" element={<AddRecordPage />} />
          <Route path="/records/:id/edit" element={<UpdateRecordPage />} />
          <Route path="/records/:id/update-payment" element={<UpdatePaymentPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/backup" element={<BackupPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
